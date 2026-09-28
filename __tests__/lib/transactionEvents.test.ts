import {
  notifyTransactionChanged,
  notifyTransactionsDeleted,
} from "@/lib/transactionEvents";
import { getCategoryResolvers } from "@/data/categoryMappings";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";
import { Transaction } from "@/types";

jest.mock("@/data/categoryMappings", () => ({
  getCategoryResolvers: jest.fn(),
}));
jest.mock("@/lib/websocket", () => ({
  sendWebSocketMessage: jest.fn(),
}));

const category = (id: string, userId: string) => ({
  id,
  name: id,
  userId,
});

describe("transaction events", () => {
  const authorFood = category("anna-food", "anna");
  const mikeRestaurants = category("mike-restaurants", "mike");
  const row = {
    id: "row-1",
    amount: -1200,
    category: authorFood,
    sourceCategory: authorFood,
  } as unknown as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    (sendWebSocketMessage as jest.Mock).mockResolvedValue(undefined);
    (getCategoryResolvers as jest.Mock).mockResolvedValue(
      new Map([
        ["anna", { resolve: () => authorFood }],
        ["mike", { resolve: () => mikeRestaurants }],
      ])
    );
  });

  it("sends each recipient the row under their own category", async () => {
    await notifyTransactionChanged(
      BroadcastType.TRANSACTION_CREATED,
      row,
      ["anna", "mike"],
      "anna"
    );

    const sent = (sendWebSocketMessage as jest.Mock).mock.calls.map(
      ([message]) => message
    );
    expect(sent).toHaveLength(2);
    const forMike = sent.find((m) => m.recipients[0] === "mike");
    const forAnna = sent.find((m) => m.recipients[0] === "anna");
    expect(forMike.recipients).toEqual(["mike"]);
    expect(forMike.data.category).toEqual(mikeRestaurants);
    // What the author picked is kept, whoever is looking.
    expect(forMike.data.sourceCategory).toEqual(authorFood);
    expect(forAnna.data.category).toEqual(authorFood);
  });

  it("sends an unmapped partner row with no category", async () => {
    (getCategoryResolvers as jest.Mock).mockResolvedValue(
      new Map([["mike", { resolve: () => null }]])
    );

    await notifyTransactionChanged(
      BroadcastType.TRANSACTION_UPDATED,
      row,
      ["mike"],
      "anna"
    );

    const [[message]] = (sendWebSocketMessage as jest.Mock).mock.calls;
    expect(message.type).toBe(BroadcastType.TRANSACTION_UPDATED);
    expect(message.data.category).toBeNull();
  });

  it("never throws, so an unawaited call can't crash the request", async () => {
    (getCategoryResolvers as jest.Mock).mockRejectedValue(new Error("db"));
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      notifyTransactionChanged(
        BroadcastType.TRANSACTION_CREATED,
        row,
        ["mike"],
        "anna"
      )
    ).resolves.toBeUndefined();
    (sendWebSocketMessage as jest.Mock).mockRejectedValue(new Error("down"));
    await expect(
      notifyTransactionsDeleted(["row-1"], ["mike"], "anna")
    ).resolves.toBeUndefined();
    error.mockRestore();
  });

  it("sends one deletion to everyone, with only the ids", async () => {
    await notifyTransactionsDeleted(["row-1", "row-2"], ["anna", "mike"], "anna");

    expect(sendWebSocketMessage).toHaveBeenCalledWith(
      {
        type: BroadcastType.TRANSACTION_DELETED,
        recipients: ["anna", "mike"],
        data: { ids: ["row-1", "row-2"] },
      },
      "anna"
    );
  });

  it("sends nothing when there is no one to tell", async () => {
    await notifyTransactionsDeleted(["row-1"], [], "anna");
    expect(sendWebSocketMessage).not.toHaveBeenCalled();
  });
});
