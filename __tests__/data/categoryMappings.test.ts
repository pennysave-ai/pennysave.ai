/**
 * @jest-environment node
 */
import { db } from "@/db";
import { getCategoryResolvers } from "@/data/categoryMappings";

jest.mock("@/db", () => ({
  db: {
    $transaction: jest.fn(),
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    categoryMapping: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    transactionPlacement: {
      findMany: jest.fn(),
    },
    userAccountAccess: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/websocket", () => ({
  sendWebSocketMessage: jest.fn(),
}));

const getCategoryResolver = async (viewerId: string) =>
  (await getCategoryResolvers([viewerId])).get(viewerId)!;

const cat = (id: string, name: string, ownerId: string) => ({
  id,
  name,
  description: null,
  icon: null,
  owner: { id: ownerId, name: ownerId, image: null, email: null, role: null },
});

// Mike's categories, oldest first as the resolver query orders them.
const MIKE_GROCERIES = cat("c_mike_groceries", "Groceries", "u_mike");
const MIKE_GROCERIES_DUP = cat("c_mike_groceries_2", "groceries", "u_mike");
const MIKE_EATING_OUT = cat("c_mike_eating_out", "Eating out", "u_mike");
const ANNA_FOOD = cat("c_anna_food", "Food", "u_anna");
const ANNA_GROCERIES = cat("c_anna_groceries", " Grocéries ", "u_anna");
const ANNA_HOBBY = cat("c_anna_hobby", "Hobby", "u_anna");

const mockViewer = (
  categories = [MIKE_GROCERIES, MIKE_GROCERIES_DUP, MIKE_EATING_OUT],
  mappings: {
    sourceCategoryId: string;
    targetCategoryId: string | null;
  }[] = [],
  placements: { transactionId: string; categoryId: string }[] = [],
) => {
  (db.category.findMany as jest.Mock).mockResolvedValueOnce(categories);
  (db.categoryMapping.findMany as jest.Mock).mockResolvedValueOnce(
    mappings.map((mapping) => ({ viewerId: "u_mike", ...mapping })),
  );
  (db.transactionPlacement.findMany as jest.Mock).mockResolvedValueOnce(
    placements.map((placement) => ({ viewerId: "u_mike", ...placement })),
  );
};

const archived = <T extends object>(category: T) => ({
  ...category,
  archivedAt: new Date("2026-09-27"),
});

describe("categoryMappings", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("resolver", () => {
    it("keeps the viewer's own category", async () => {
      mockViewer();
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(MIKE_EATING_OUT)?.id).toBe("c_mike_eating_out");
    });

    it("prefers an explicit mapping over a name match", async () => {
      mockViewer(undefined, [
        {
          sourceCategoryId: "c_anna_groceries",
          targetCategoryId: "c_mike_eating_out",
        },
      ]);
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_GROCERIES)?.id).toBe("c_mike_eating_out");
    });

    it("matches on the normalized name, taking the oldest match", async () => {
      mockViewer();
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_GROCERIES)?.id).toBe("c_mike_groceries");
    });

    it("returns null for an unmapped partner category and for none", async () => {
      mockViewer();
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_HOBBY)).toBeNull();
      expect(resolver.resolve(null)).toBeNull();
    });

    it("returns null for a removed source instead of the name match", async () => {
      mockViewer(undefined, [
        { sourceCategoryId: "c_anna_groceries", targetCategoryId: null },
      ]);
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_GROCERIES)).toBeNull();
    });

    it("ignores a mapping whose target is no longer the viewer's", async () => {
      mockViewer(undefined, [
        { sourceCategoryId: "c_anna_hobby", targetCategoryId: "c_gone" },
      ]);
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_HOBBY)).toBeNull();
    });

    it("puts the viewer's pick for a row above every other rule", async () => {
      mockViewer(
        undefined,
        [
          {
            sourceCategoryId: "c_anna_groceries",
            targetCategoryId: "c_mike_groceries",
          },
        ],
        [{ transactionId: "t_1", categoryId: "c_mike_eating_out" }],
      );
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_GROCERIES, "t_1")?.id).toBe(
        "c_mike_eating_out",
      );
      expect(resolver.resolve(null, "t_1")?.id).toBe("c_mike_eating_out");
      // Only that row.
      expect(resolver.resolve(ANNA_GROCERIES, "t_2")?.id).toBe(
        "c_mike_groceries",
      );
    });

    it("falls through a pick whose category the viewer archived", async () => {
      mockViewer(
        undefined,
        [],
        [{ transactionId: "t_1", categoryId: "c_gone" }],
      );
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(ANNA_GROCERIES, "t_1")?.id).toBe(
        "c_mike_groceries",
      );
    });

    it("leaves the owner's archived category uncategorized", async () => {
      mockViewer();
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(archived(MIKE_EATING_OUT))).toBeNull();
    });

    it("keeps an archived partner category's mapping, but no name match", async () => {
      mockViewer(undefined, [
        {
          sourceCategoryId: "c_anna_food",
          targetCategoryId: "c_mike_eating_out",
        },
      ]);
      const resolver = await getCategoryResolver("u_mike");
      expect(resolver.resolve(archived(ANNA_FOOD))?.id).toBe(
        "c_mike_eating_out",
      );
      expect(resolver.resolve(archived(ANNA_GROCERIES))).toBeNull();
    });

    it("only loads the viewer's live categories", async () => {
      mockViewer();
      await getCategoryResolver("u_mike");
      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: { in: ["u_mike"] }, archivedAt: null },
        }),
      );
    });
  });
});
