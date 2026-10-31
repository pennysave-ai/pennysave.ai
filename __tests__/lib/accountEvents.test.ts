import { notifyAccountUpdated } from "@/lib/accountEvents";
import { getAccountAsSeenByMembers } from "@/data/accounts";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";

jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/data/accounts", () => ({
  getAccountAsSeenByMembers: jest.fn(),
}));
jest.mock("@/lib/websocket", () => ({
  sendWebSocketMessage: jest.fn(),
}));

describe("account events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sendWebSocketMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it("sends each person the account as their own list shows it", async () => {
    const forMike = { id: "acc", name: "Holiday", users: [{ id: "mike" }, { id: "anna" }] };
    const forAnna = { id: "acc", name: "Holiday", users: [{ id: "mike" }, { id: "anna" }] };
    (getAccountAsSeenByMembers as jest.Mock).mockResolvedValue([
      { viewerId: "mike", account: forMike },
      { viewerId: "anna", account: forAnna },
    ]);

    await notifyAccountUpdated("acc", "mike");

    expect(sendWebSocketMessage).toHaveBeenCalledWith(
      { type: BroadcastType.ACCOUNT_UPDATED, recipients: ["mike"], data: forMike },
      "mike"
    );
    expect(sendWebSocketMessage).toHaveBeenCalledWith(
      { type: BroadcastType.ACCOUNT_UPDATED, recipients: ["anna"], data: forAnna },
      "mike"
    );
  });

  it("sends nothing to someone whose list wouldn't show the account", async () => {
    // The owner's subscription lapsed: Anna can't see it.
    (getAccountAsSeenByMembers as jest.Mock).mockResolvedValue([
      { viewerId: "mike", account: { id: "acc", users: [{ id: "mike" }] } },
      { viewerId: "anna", account: null },
    ]);

    await notifyAccountUpdated("acc", "mike");

    expect(sendWebSocketMessage).toHaveBeenCalledTimes(1);
    expect((sendWebSocketMessage as jest.Mock).mock.calls[0][0].recipients).toEqual(["mike"]);
  });

  it("sends a member a paused account as ACCOUNT_PAUSED", async () => {
    const forAnna = { id: "acc", users: [{ id: "mike" }, { id: "anna" }], paused: true };
    (getAccountAsSeenByMembers as jest.Mock).mockResolvedValue([
      { viewerId: "mike", account: { id: "acc", users: [{ id: "mike" }] } },
      { viewerId: "anna", account: forAnna },
    ]);

    await notifyAccountUpdated("acc", "mike");

    expect(sendWebSocketMessage).toHaveBeenCalledWith(
      { type: BroadcastType.ACCOUNT_PAUSED, recipients: ["anna"], data: forAnna },
      "mike"
    );
    expect((sendWebSocketMessage as jest.Mock).mock.calls[0][0].type).toBe(
      BroadcastType.ACCOUNT_UPDATED
    );
  });

  it("never throws", async () => {
    (getAccountAsSeenByMembers as jest.Mock).mockRejectedValue(new Error("db"));
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyAccountUpdated("acc", "mike")).resolves.toBeUndefined();
    error.mockRestore();
  });
});
