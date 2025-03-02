/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/notifications/route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setNotificationPreferences } from "@/data/user";

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

jest.mock("@/data/user");

describe("PUT /api/notifications", () => {
  const mockUser = { id: "user-123" };
  const mockSession = { user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const mockReq = {
      json: jest.fn().mockResolvedValue({ monthlyReports: true }),
    };

    const response = await PUT(mockReq as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should return 400 if monthlyReports is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);

    const mockReq = {
      json: jest.fn().mockResolvedValue({}),
    };

    const response = await PUT(mockReq as unknown as NextRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toBe("Bad Request");
  });

  it("should return 401 if user id is missing", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: {} });

    const mockReq = {
      json: jest.fn().mockResolvedValue({ monthlyReports: true }),
    };

    const response = await PUT(mockReq as unknown as NextRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toBe("Unautorized");
  });

  it("should update notification preferences successfully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (setNotificationPreferences as jest.Mock).mockResolvedValue({});

    const mockReq = {
      json: jest.fn().mockResolvedValue({ monthlyReports: true }),
    };

    const response = await PUT(mockReq as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ data: "success" });
    expect(setNotificationPreferences).toHaveBeenCalledWith({
      userId: mockUser.id,
      monthlyReports: true,
    });
  });

  it("should handle errors gracefully", async () => {
    (auth as jest.Mock).mockResolvedValue(mockSession);
    (setNotificationPreferences as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const mockReq = {
      json: jest.fn().mockResolvedValue({ monthlyReports: true }),
    };

    const response = await PUT(mockReq as unknown as NextRequest);
    expect(response.status).toBe(500);
    expect(await response.json()).toBe(
      "Error while saving notification status"
    );
  });
});
