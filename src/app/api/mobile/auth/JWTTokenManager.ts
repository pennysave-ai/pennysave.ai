import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { db } from "@/db";

const JWT_SECRET = process.env.AUTH_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.MOBILE_ACCESS_TOKEN_EXPIRES_IN || "900"
); // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = parseInt(
  process.env.MOBILE_REFRESH_TOKEN_EXPIRES_IN || "1209600"
); // 14 days
export const AUDIENCE = "mobile-app";
interface UserData {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: string;
  hasActiveStripeSubscription: boolean;
  stripePriceId?: string | null;
  stripeSubscriptionEndDate?: Date | null;
  stripeSubscriptionCancelAtDate?: Date | null;
  sendMonthlyReport: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string | null;
  role: string;
  familyId: string;
  version: number;
  type: "access" | "refresh";
  jti: string;
  activeSubscription: boolean;
  priceId?: string | null;
  expires?: string;
  cancelAt?: string;
  monthlyReports: boolean;
  iat: number;
  exp: number;
  aud: string;
}

export class JWTTokenManager {
  // Hash tokens for secure storage
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Create access and refresh token pair
  static async createTokenPair(
    user: UserData,
    familyId?: string,
    version: number = 1
  ): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const tokenFamilyId = familyId || uuidv4();

    // Create access token (short-lived)
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      role: user.role,
      familyId: tokenFamilyId,
      version,
      type: "access" as const,
      jti: crypto.randomBytes(16).toString("hex"),

      // Subscription data
      activeSubscription: user.hasActiveStripeSubscription,
      priceId: user.stripePriceId,
      expires: user.stripeSubscriptionEndDate?.toISOString(),
      cancelAt: user.stripeSubscriptionCancelAtDate?.toISOString(),
      monthlyReports: user.sendMonthlyReport,
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      audience: AUDIENCE,
      issuer: "pennysave-api",
    });

    // Create refresh token (long-lived)
    const refreshTokenPayload = {
      sub: user.id,
      familyId: tokenFamilyId,
      version,
      type: "refresh" as const,
      jti: crypto.randomBytes(16).toString("hex"),
    };

    const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      audience: AUDIENCE,
      issuer: "pennysave-api",
    });
    return {
      accessToken,
      refreshToken,
      accessTokenHash: this.hashToken(accessToken),
      refreshTokenHash: this.hashToken(refreshToken),
      accessExpiresAt: new Date((now + ACCESS_TOKEN_EXPIRES_IN) * 1000),
      refreshExpiresAt: new Date((now + REFRESH_TOKEN_EXPIRES_IN) * 1000),
    };
  }

  // Create and store token family in database
  static async createTokenFamily(user: UserData): Promise<TokenPair> {
    const familyId = uuidv4();
    const tokens = await this.createTokenPair(user, familyId, 1);

    // Store in database
    await db.mobileJWTToken.create({
      data: {
        userId: user.id,
        familyId: familyId,
        tokenVersion: 1,
        accessTokenHash: tokens.accessTokenHash,
        refreshTokenHash: tokens.refreshTokenHash,
        expiresAt: tokens.accessExpiresAt,
        refreshExpiresAt: tokens.refreshExpiresAt,
        isActive: true,
      },
    });

    return tokens;
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, JWT_SECRET, {
        audience: AUDIENCE,
        issuer: "pennysave-api",
        algorithms: ["HS256"],
      }) as JWTPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const refreshTokenHash = this.hashToken(refreshToken);
      // Find stored token
      const storedToken = await db.mobileJWTToken.findFirst({
        where: {
          familyId: payload.familyId,
          tokenVersion: payload.version,
          refreshTokenHash: refreshTokenHash,
          isActive: true,
          familyInvalidated: false,
          refreshExpiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              hasActiveStripeSubscription: true,
              stripePriceId: true,
              stripeSubscriptionEndDate: true,
              stripeSubscriptionCancelAtDate: true,
              sendMonthlyReport: true,
            },
          },
        },
      });

      if (!storedToken) {
        // Check for compromise
        await this.checkForCompromise(payload.familyId, payload.version);
        throw new Error("Invalid or expired refresh token");
      }
      // Check if this token version is older than the current active version
      const currentActiveToken = await db.mobileJWTToken.findFirst({
        where: {
          familyId: payload.familyId,
          isActive: true,
          familyInvalidated: false,
        },
        orderBy: {
          tokenVersion: "desc",
        },
      });

      if (
        currentActiveToken &&
        payload.version < currentActiveToken.tokenVersion
      ) {
        // 🚨 COMPROMISE DETECTED: Old token being used
        console.error(`🚨 SECURITY ALERT: Token compromise detected!`);
        console.error(`Family ID: ${payload.familyId}`);
        console.error(
          `Attempted version: ${payload.version}, Current version: ${currentActiveToken.tokenVersion}`
        );
        console.error(`User ID: ${storedToken?.userId || "unknown"}`);

        // Invalidate entire token family
        await this.invalidateTokenFamily(
          payload.familyId,
          `compromise_detected_v${payload.version}_attempted`
        );
        throw new Error("Token compromise detected. All tokens invalidated.");
      }

      // Create new token version
      const newVersion = storedToken.tokenVersion + 1;
      const userData: UserData = {
        id: storedToken.user.id,
        email: storedToken.user.email ?? "",
        name: storedToken.user.name ?? "",
        image: storedToken.user.image,
        role: storedToken.user.role,
        hasActiveStripeSubscription:
          storedToken.user.hasActiveStripeSubscription ?? false,
        stripePriceId: storedToken.user.stripePriceId,
        stripeSubscriptionEndDate: storedToken.user.stripeSubscriptionEndDate,
        stripeSubscriptionCancelAtDate:
          storedToken.user.stripeSubscriptionCancelAtDate,
        sendMonthlyReport: storedToken.user.sendMonthlyReport ?? false,
      };

      // Create NEW token pair (both access and refresh tokens)
      const newTokens = await this.createTokenPair(
        userData,
        storedToken.familyId,
        newVersion
      );

      // Update database
      await db.$transaction([
        // Deactivate old token
        db.mobileJWTToken.update({
          where: { id: storedToken.id },
          data: { isActive: false },
        }),

        // Create new token version
        db.mobileJWTToken.create({
          data: {
            userId: storedToken.userId,
            familyId: storedToken.familyId,
            tokenVersion: newVersion,
            accessTokenHash: newTokens.accessTokenHash,
            refreshTokenHash: newTokens.refreshTokenHash,
            expiresAt: newTokens.accessExpiresAt,
            refreshExpiresAt: newTokens.refreshExpiresAt,
            isActive: true,
          },
        }),
      ]);

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid refresh token: ${error.message}`);
      }
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  // Compromise detection helper method
  static async checkForCompromise(familyId: string, attemptedVersion: number) {
    try {
      // Check if there are any active tokens with higher version numbers
      const higherVersionTokens = await db.mobileJWTToken.findMany({
        where: {
          familyId: familyId,
          tokenVersion: { gt: attemptedVersion },
          familyInvalidated: false,
        },
        orderBy: {
          tokenVersion: "desc",
        },
        take: 1,
      });

      if (higherVersionTokens.length > 0) {
        const currentVersion = higherVersionTokens[0].tokenVersion;

        console.error(`🚨 SECURITY ALERT: Potential compromise detected!`);
        console.error(`Family ID: ${familyId}`);
        console.error(
          `Attempted version: ${attemptedVersion}, Current version: ${currentVersion}`
        );

        // Invalidate entire family
        await this.invalidateTokenFamily(
          familyId,
          `compromise_suspected_v${attemptedVersion}_vs_v${currentVersion}`
        );

        return true; // Compromise detected
      }

      return false; // No compromise detected
    } catch (error) {
      console.error("Error in compromise detection:", error);
      return false;
    }
  }

  // Invalidate token family (logout)
  static async invalidateTokenFamily(familyId: string, reason = "logout") {
    await db.mobileJWTToken.updateMany({
      where: { familyId },
      data: {
        isActive: false,
        familyInvalidated: true,
        invalidatedAt: new Date(),
        invalidatedReason: reason,
      },
    });
  }

  // Invalidate all user tokens (logout all devices)
  static async invalidateAllUserTokens(userId: string, reason = "logout_all") {
    await db.mobileJWTToken.updateMany({
      where: { userId },
      data: {
        isActive: false,
        familyInvalidated: true,
        invalidatedAt: new Date(),
        invalidatedReason: reason,
      },
    });
  }

  // Verify and validate access token
  static async validateAccessToken(token: string) {
    try {
      // Verify JWT signature and claims
      const payload = jwt.verify(token, JWT_SECRET, {
        audience: AUDIENCE,
        issuer: "pennysave-api",
        algorithms: ["HS256"],
      }) as JWTPayload;

      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      const tokenHash = this.hashToken(token);

      // Verify token is still active in database
      const storedToken = await db.mobileJWTToken.findFirst({
        where: {
          familyId: payload.familyId,
          tokenVersion: payload.version,
          accessTokenHash: tokenHash,
          isActive: true,
          familyInvalidated: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new Error("Token not found or expired");
      }

      // Update usage tracking
      await db.mobileJWTToken.update({
        where: { id: storedToken.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      });

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Token validation failed: ${error.message}`);
      }
      throw new Error(`Token validation failed: ${error}`);
    }
  }

  // Revoke access and refresh tokens
  static async revokeTokens(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET, {
        audience: AUDIENCE,
        issuer: "pennysave-api",
        algorithms: ["HS256"],
      }) as JWTPayload;

      // Validate refresh token
      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const refreshTokenHash = this.hashToken(refreshToken);
      const storedToken = await db.mobileJWTToken.findFirst({
        where: {
          familyId: payload.familyId,
          tokenVersion: payload.version,
          refreshTokenHash: refreshTokenHash,
          isActive: true,
          familyInvalidated: false,
          refreshExpiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!storedToken) {
        // Check for compromise
        await this.checkForCompromise(payload.familyId, payload.version);
        throw new Error("Invalid or expired refresh token");
      }

      await db.mobileJWTToken.updateMany({
        where: { userId: storedToken.userId },
        data: {
          isActive: false,
          familyInvalidated: true,
          invalidatedAt: new Date(),
          invalidatedReason: "user_logout",
        },
      });
    } catch (error) {
      console.error("Error validating refresh token:", error);
      throw new Error("Invalid refresh token");
    }
  }
}
