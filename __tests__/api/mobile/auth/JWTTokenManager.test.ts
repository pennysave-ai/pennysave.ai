/**
 * @jest-environment node
 */
import jwt from "jsonwebtoken";

jest.mock("@/db", () => ({
  db: { mobileJWTToken: { create: jest.fn(), findFirst: jest.fn() } },
}));

// JWTTokenManager reads AUTH_SECRET at module load, so the env has to be set
// before the module is evaluated - hence the deferred import.
type Manager =
  typeof import("@/app/api/mobile/auth/JWTTokenManager").JWTTokenManager;
let JWTTokenManager: Manager;

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret";
  ({ JWTTokenManager } = await import(
    "@/app/api/mobile/auth/JWTTokenManager"
  ));
});

const startedAt = new Date("2026-09-01T10:00:00Z");
const expiresAt = new Date("2026-09-08T10:00:00Z");

const trialUser = {
  id: "user-123",
  email: "john@example.com",
  name: "John Doe",
  image: null,
  role: "USER",
  subscription: {
    status: "trial" as const,
    startedAt,
    expiresAt,
    gracePeriodExpiresAt: null,
    trialStartedAt: startedAt,
    originalPurchaseDate: startedAt,
  },
  hasActiveStripeSubscription: false,
  stripePriceId: null,
  stripeSubscriptionEndDate: null,
  stripeSubscriptionCancelAtDate: null,
  sendMonthlyReport: false,
};

describe("JWTTokenManager.createTokenPair", () => {
  it("signs the full subscription state into the access token", async () => {
    const { accessToken } = await JWTTokenManager.createTokenPair(trialUser);
    const claims = jwt.decode(accessToken) as Record<string, any>;

    expect(claims.subscription).toEqual({
      status: "trial",
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      gracePeriodExpiresAt: null,
      trialStartedAt: startedAt.toISOString(),
      originalPurchaseDate: startedAt.toISOString(),
    });
  });

  it("keeps the grace period deadline on a grace_period user", async () => {
    const gracePeriodExpiresAt = new Date("2026-09-24T10:00:00Z");
    const { accessToken } = await JWTTokenManager.createTokenPair({
      ...trialUser,
      subscription: {
        ...trialUser.subscription,
        status: "grace_period" as const,
        gracePeriodExpiresAt,
      },
    });
    const claims = jwt.decode(accessToken) as Record<string, any>;

    expect(claims.subscription.status).toBe("grace_period");
    expect(claims.subscription.gracePeriodExpiresAt).toBe(
      gracePeriodExpiresAt.toISOString(),
    );
  });

  it("carries no subscription claims on the refresh token", async () => {
    const { refreshToken } = await JWTTokenManager.createTokenPair(trialUser);
    const claims = jwt.decode(refreshToken) as Record<string, any>;

    expect(claims.type).toBe("refresh");
    expect(claims.subscription).toBeUndefined();
    expect(claims.email).toBeUndefined();
  });
});
