/**
 * @jest-environment node
 */
import { db } from "@/db";
import { embedTexts } from "@/lib/embeddings";
import {
  deleteCategoryMapping,
  freezeNameMatchesBeforeRename,
  getCategoryResolver,
  listCategoryMappings,
  suggestCategoryMappings,
  upsertCategoryMapping,
} from "@/data/categoryMappings";

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

jest.mock("@/lib/embeddings", () => ({
  ...jest.requireActual("@/lib/embeddings"),
  embedTexts: jest.fn(),
}));

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

  describe("freezeNameMatchesBeforeRename", () => {
    it("stores a name match as a mapping for partners without one", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValueOnce({
        name: "Groceries",
      });
      // getCoMemberIds, then the rows each co-member can see.
      (db.userAccountAccess.findMany as jest.Mock)
        .mockResolvedValueOnce([{ userId: "u_mike" }, { userId: "u_ola" }])
        .mockResolvedValueOnce([{ userId: "u_mike" }, { userId: "u_ola" }]);
      // Resolvers for both co-members: Mike has a Groceries, Ola a mapping.
      (db.category.findMany as jest.Mock).mockResolvedValueOnce([
        MIKE_GROCERIES,
      ]);
      (db.categoryMapping.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ viewerId: "u_ola" }]);
      (db.transactionPlacement.findMany as jest.Mock).mockResolvedValueOnce([]);

      await freezeNameMatchesBeforeRename("c_anna", "u_anna", "Food shop");

      expect(db.categoryMapping.createMany).toHaveBeenCalledWith({
        data: [
          {
            viewerId: "u_mike",
            sourceCategoryId: "c_anna",
            targetCategoryId: "c_mike_groceries",
          },
        ],
        skipDuplicates: true,
      });
    });

    it("does nothing when the normalized name stays the same", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValueOnce({
        name: "Groceries",
      });
      await freezeNameMatchesBeforeRename("c_anna", "u_anna", " grocéries ");
      expect(db.userAccountAccess.findMany).not.toHaveBeenCalled();
      expect(db.categoryMapping.createMany).not.toHaveBeenCalled();
    });
  });

  describe("upsertCategoryMapping", () => {
    it("returns 404 when the target is not the viewer's", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue(null);
      expect(
        await upsertCategoryMapping("u_mike", "c_anna_food", "c_other"),
      ).toEqual({ ok: false, status: 404 });
    });

    it("returns 400 when the source is the viewer's own or missing", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue({ id: "t" });
      (db.category.findUnique as jest.Mock).mockResolvedValueOnce(
        MIKE_EATING_OUT,
      );
      expect(
        await upsertCategoryMapping("u_mike", "c_mike_eating_out", "t"),
      ).toEqual({ ok: false, status: 400 });

      (db.category.findUnique as jest.Mock).mockResolvedValueOnce(null);
      expect(await upsertCategoryMapping("u_mike", "missing", "t")).toEqual({
        ok: false,
        status: 400,
      });
    });

    it("returns 403 when the source owner shares no account", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue({ id: "t" });
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_FOOD);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue(null);
      expect(await upsertCategoryMapping("u_mike", "c_anna_food", "t")).toEqual(
        { ok: false, status: 403 },
      );
      expect(db.categoryMapping.upsert).not.toHaveBeenCalled();
    });

    it("upserts and returns the mapping as a list item", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue({
        id: "c_mike_groceries",
      });
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_FOOD);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue({
        userId: "u_mike",
      });

      (db.categoryMapping.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await upsertCategoryMapping(
        "u_mike",
        "c_anna_food",
        "c_mike_groceries",
      );

      expect(result).toEqual({
        ok: true,
        mapping: {
          source: ANNA_FOOD,
          targetCategoryId: "c_mike_groceries",
          kind: "explicit",
        },
        previous: null,
      });
      expect(db.categoryMapping.upsert).toHaveBeenCalledWith({
        where: {
          viewerId_sourceCategoryId: {
            viewerId: "u_mike",
            sourceCategoryId: "c_anna_food",
          },
        },
        create: {
          viewerId: "u_mike",
          sourceCategoryId: "c_anna_food",
          targetCategoryId: "c_mike_groceries",
        },
        update: { targetCategoryId: "c_mike_groceries" },
      });
    });
  });

  describe("upsertCategoryMapping (previous)", () => {
    it("returns what was stored before, so Undo can put it back", async () => {
      (db.category.findFirst as jest.Mock).mockResolvedValue({
        id: "c_mike_groceries",
      });
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_FOOD);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue({
        userId: "u_mike",
      });
      (db.categoryMapping.findUnique as jest.Mock).mockResolvedValue({
        targetCategoryId: null,
      });

      const result = await upsertCategoryMapping(
        "u_mike",
        "c_anna_food",
        "c_mike_groceries",
      );

      expect(result).toMatchObject({
        ok: true,
        previous: { targetCategoryId: null },
      });
    });
  });

  describe("deleteCategoryMapping", () => {
    it("forget deletes the row instead of storing a removal", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_GROCERIES);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue({
        userId: "u_mike",
      });

      await deleteCategoryMapping("u_mike", "c_anna_groceries", {
        forget: true,
      });

      expect(db.categoryMapping.deleteMany).toHaveBeenCalledWith({
        where: { viewerId: "u_mike", sourceCategoryId: "c_anna_groceries" },
      });
      expect(db.categoryMapping.upsert).not.toHaveBeenCalled();
    });

    it("stores the removal as a mapping with no target", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_GROCERIES);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue({
        userId: "u_mike",
      });

      await deleteCategoryMapping("u_mike", "c_anna_groceries");

      expect(db.categoryMapping.upsert).toHaveBeenCalledWith({
        where: {
          viewerId_sourceCategoryId: {
            viewerId: "u_mike",
            sourceCategoryId: "c_anna_groceries",
          },
        },
        create: {
          viewerId: "u_mike",
          sourceCategoryId: "c_anna_groceries",
          targetCategoryId: null,
        },
        update: { targetCategoryId: null },
      });
    });

    it("does nothing for a source the viewer couldn't map", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await deleteCategoryMapping("u_mike", "missing");

      (db.category.findUnique as jest.Mock).mockResolvedValueOnce(
        MIKE_EATING_OUT,
      );
      await deleteCategoryMapping("u_mike", "c_mike_eating_out");

      (db.category.findUnique as jest.Mock).mockResolvedValueOnce(ANNA_FOOD);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValueOnce(null);
      await deleteCategoryMapping("u_mike", "c_anna_food");

      expect(db.categoryMapping.upsert).not.toHaveBeenCalled();
    });
  });

  describe("listCategoryMappings", () => {
    it("lists explicit mappings first, hides unshared ones, then name matches", async () => {
      const ZOE_FOOD = cat("c_zoe_food", "Food", "u_zoe");
      // Resolver queries.
      mockViewer();
      (db.userAccountAccess.findMany as jest.Mock).mockResolvedValue([
        { userId: "u_anna" },
      ]);
      // Explicit mappings (resolver's call is consumed first).
      (db.categoryMapping.findMany as jest.Mock).mockResolvedValueOnce([
        {
          sourceCategoryId: "c_anna_food",
          targetCategoryId: "c_mike_groceries",
          sourceCategory: ANNA_FOOD,
        },
        {
          sourceCategoryId: "c_zoe_food",
          targetCategoryId: "c_mike_groceries",
          sourceCategory: ZOE_FOOD,
        },
      ]);
      // Partner categories seen on shared accounts.
      (db.category.findMany as jest.Mock).mockResolvedValueOnce([
        ANNA_GROCERIES,
        ANNA_HOBBY,
      ]);

      expect(await listCategoryMappings("u_mike")).toEqual([
        {
          source: ANNA_FOOD,
          targetCategoryId: "c_mike_groceries",
          kind: "explicit",
        },
        {
          source: ANNA_GROCERIES,
          targetCategoryId: "c_mike_groceries",
          kind: "name",
        },
      ]);
    });
  });

  describe("listCategoryMappings (removed)", () => {
    it("lists a removed source neither as explicit nor as a name match", async () => {
      mockViewer();
      (db.userAccountAccess.findMany as jest.Mock).mockResolvedValue([
        { userId: "u_anna" },
      ]);
      (db.categoryMapping.findMany as jest.Mock).mockResolvedValueOnce([
        {
          sourceCategoryId: "c_anna_groceries",
          targetCategoryId: null,
          sourceCategory: ANNA_GROCERIES,
        },
      ]);
      (db.category.findMany as jest.Mock).mockResolvedValueOnce([]);

      expect(await listCategoryMappings("u_mike")).toEqual([]);
      // Kept out of the name-match query, where "Grocéries" would match.
      expect(db.category.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ["c_anna_groceries"] },
          }),
        }),
      );
    });
  });

  describe("suggestCategoryMappings", () => {
    const sharedSource = () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(ANNA_FOOD);
      (db.userAccountAccess.findFirst as jest.Mock).mockResolvedValue({
        userId: "u_mike",
      });
    };

    it("returns null when the source is not a visible partner category", async () => {
      (db.category.findUnique as jest.Mock).mockResolvedValue(MIKE_GROCERIES);
      expect(await suggestCategoryMappings("u_mike", "c_mike_groceries")).toBe(
        null,
      );
    });

    it("suggests by payee overlap, using notes when payee is empty", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { payee: "Tesco", notes: null },
          { payee: "", notes: "Lidl " },
          { payee: "Cinema", notes: null },
        ])
        .mockResolvedValueOnce([
          { payee: "TESCO", notes: null, categoryId: "c_mike_groceries" },
          { payee: "tesco", notes: null, categoryId: "c_mike_groceries" },
          { payee: "", notes: "lidl", categoryId: "c_mike_groceries" },
          { payee: "Cinema", notes: null, categoryId: "c_mike_eating_out" },
        ]);
      (db.category.findMany as jest.Mock).mockResolvedValue([]);
      (embedTexts as jest.Mock).mockResolvedValue(null);

      expect(await suggestCategoryMappings("u_mike", "c_anna_food")).toEqual([
        {
          categoryId: "c_mike_groceries",
          confidence: 0.75,
          reason: { kind: "payees", payees: ["Tesco", "Lidl"] },
        },
      ]);
    });

    it("returns an empty list rather than a weak guess", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock)
        .mockResolvedValueOnce([{ payee: "Tesco", notes: null }])
        // Mike files Tesco half here, half there: under the 60% share.
        .mockResolvedValueOnce([
          { payee: "Tesco", notes: null, categoryId: "c_mike_groceries" },
          { payee: "Tesco", notes: null, categoryId: "c_mike_eating_out" },
        ]);
      (db.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "c_anna_food",
          name: "Food",
          nameEmbedding: [1, 0],
          nameEmbeddingKey: "food",
        },
        {
          id: "c_mike_groceries",
          name: "Groceries",
          nameEmbedding: [0, 1],
          nameEmbeddingKey: "groceries",
        },
      ]);

      expect(await suggestCategoryMappings("u_mike", "c_anna_food")).toEqual(
        [],
      );
    });

    it("suggests by meaning above the threshold, computing stale embeddings", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (db.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "c_anna_food",
          name: "Food",
          nameEmbedding: [],
          nameEmbeddingKey: null,
        },
        {
          id: "c_mike_groceries",
          name: "Groceries",
          nameEmbedding: [0.9, 0.1],
          nameEmbeddingKey: "groceries",
        },
        {
          id: "c_mike_eating_out",
          name: "Eating out",
          nameEmbedding: [0, 1],
          nameEmbeddingKey: "eating out",
        },
      ]);
      (embedTexts as jest.Mock).mockResolvedValue([[1, 0]]);
      (db.$transaction as jest.Mock).mockResolvedValue([]);

      expect(await suggestCategoryMappings("u_mike", "c_anna_food")).toEqual([
        {
          categoryId: "c_mike_groceries",
          confidence: 0.99,
          reason: { kind: "meaning" },
        },
      ]);
      expect(embedTexts).toHaveBeenCalledWith(["Food"]);
    });

    it("suggests from a single shared payee, matching notes against payee", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock)
        // Anna's two rows carry the merchant in the notes only.
        .mockResolvedValueOnce([
          { payee: "", notes: "DOGFOOD INC" },
          { payee: "", notes: "DOGFOOD INC" },
        ])
        .mockResolvedValueOnce([
          {
            payee: "DOGFOOD INC",
            notes: "DOGFOOD INC",
            categoryId: "c_mike_eating_out",
          },
        ]);
      (db.category.findMany as jest.Mock).mockResolvedValue([]);

      const [first] = (await suggestCategoryMappings("u_mike", "c_anna_food"))!;
      expect(first).toEqual({
        categoryId: "c_mike_eating_out",
        confidence: 1,
        reason: { kind: "payees", payees: ["DOGFOOD INC"] },
      });
    });

    // Measured on real vectors: "Pet" vs "Dog" 0.63, vs everything else <= 0.38.
    const angled = (cos: number) => [cos, Math.sqrt(1 - cos * cos)];

    it("suggests by meaning when the best match stands clearly apart", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (db.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "c_anna_food",
          name: "Pet",
          nameEmbedding: [1, 0],
          nameEmbeddingKey: "pet",
        },
        {
          id: "c_mike_groceries",
          name: "Groceries",
          nameEmbedding: angled(0.3),
          nameEmbeddingKey: "groceries",
        },
        {
          id: "c_mike_groceries_2",
          name: "groceries",
          nameEmbedding: angled(0.28),
          nameEmbeddingKey: "groceries",
        },
        {
          id: "c_mike_eating_out",
          name: "Dog",
          nameEmbedding: angled(0.63),
          nameEmbeddingKey: "dog",
        },
      ]);

      expect(await suggestCategoryMappings("u_mike", "c_anna_food")).toEqual([
        {
          categoryId: "c_mike_eating_out",
          confidence: 0.63,
          reason: { kind: "meaning" },
        },
      ]);
    });

    it("suggests nothing by meaning when two categories are about as close", async () => {
      sharedSource();
      mockViewer();
      (db.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (db.category.findMany as jest.Mock).mockResolvedValue([
        {
          id: "c_anna_food",
          name: "Pet",
          nameEmbedding: [1, 0],
          nameEmbeddingKey: "pet",
        },
        {
          id: "c_mike_groceries",
          name: "Groceries",
          nameEmbedding: angled(0.58),
          nameEmbeddingKey: "groceries",
        },
        {
          id: "c_mike_groceries_2",
          name: "groceries",
          nameEmbedding: angled(0.1),
          nameEmbeddingKey: "groceries",
        },
        {
          id: "c_mike_eating_out",
          name: "Dog",
          nameEmbedding: angled(0.63),
          nameEmbeddingKey: "dog",
        },
      ]);

      expect(await suggestCategoryMappings("u_mike", "c_anna_food")).toEqual(
        [],
      );
    });
  });
});
