/**
 * @jest-environment node
 */
import { POST } from "@/app/api/checkout/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { stripe } from "@/data/stripe";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
  NextRequest: jest.fn(),
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/data/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(), // Mock the create method
      },
    },
  },
}));

describe("POST /api/checkout", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };
  const mockStripeCustomerId = "cus_123";
  const mockPriceId = "price_123";
  const mockCheckoutSession = { url: "https://checkout.stripe.com/session_id" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const mockReq = {
      json: jest.fn().mockResolvedValue({ priceId: mockPriceId }),
    };

    const response = await POST(mockReq as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should return 400 if priceId is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);

    const mockReq = {
      json: jest.fn().mockResolvedValue({}),
    };

    const response = await POST(mockReq as unknown as NextRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toBe("Bad Request");
  });

  it("should return 401 if user id is missing", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: {} });

    const mockReq = {
      json: jest.fn().mockResolvedValue({ priceId: mockPriceId }),
    };

    const response = await POST(mockReq as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should create a checkout session successfully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(
      mockCheckoutSession
    );

    const mockReq = {
      json: jest.fn().mockResolvedValue({ priceId: mockPriceId }),
    };

    const response = await POST(mockReq as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ url: mockCheckoutSession.url });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      locale: "auto",
      customer: mockStripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: mockPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: mockUser.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings`,
    });
  });

  it("should handle errors gracefully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      stripeCustomerId: mockStripeCustomerId,
    });
    (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
      new Error("Stripe error")
    );

    const mockReq = {
      json: jest.fn().mockResolvedValue({ priceId: mockPriceId }),
    };

    const response = await POST(mockReq as unknown as NextRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toBe("Failed to create checkout session");
  });
});
