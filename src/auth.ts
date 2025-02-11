import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { UserRole } from "@prisma/client";
import { db } from "@/db";
import { getUserById } from "@/data";

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
  hasActiveStripeSubscription: boolean;
  subscription?: {
    priceId: string;
    expires: string;
    cancelAt: string | null;
  };
  notifications: {
    monthlyReports: boolean;
  };
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        data: { emailVerified: new Date() },
        where: { id: user.id },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;
      if (user && user.id) {
        const existingUser = await getUserById(user.id);
        // Prevent sign in if the user is not verified
        if (!existingUser?.emailVerified) return false;
      }
      return true;
    },
    async session({ session, token }) {
      // Setting the user id from the token
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.activeSubscription && session.user) {
        session.user.subscription = {
          priceId: token.priceId as string,
          expires: token.expires as string,
          cancelAt: token.cancelAt as string | null,
        };
      }
      session.user.notifications = {
        monthlyReports: token.monthlyReports as boolean,
      };
      session.user.hasActiveStripeSubscription =
        token.activeSubscription as boolean;
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      // Adding the user role to the token
      const existingUser = await db.user.findUnique({
        select: {
          hasActiveStripeSubscription: true,
          stripePriceId: true,
          stripeSubscriptionEndDate: true,
          stripeSubscriptionCancelAtDate: true,
          sendMonthlyReport: true,
        },
        where: { id: token.sub },
      });
      if (!existingUser) return token;
      token.activeSubscription = existingUser.hasActiveStripeSubscription;
      token.priceId = existingUser.stripePriceId;
      token.expires = existingUser.stripeSubscriptionEndDate;
      token.cancelAt = existingUser.stripeSubscriptionCancelAtDate;
      token.monthlyReports = existingUser.sendMonthlyReport;
      return token;
    },
  },
});
