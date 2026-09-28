/**
 * @jest-environment node
 */
import { db } from "@/db";
import { categorySchema } from "@/schemas";
import {
  getUserCategories,
  getCategoriesCount,
  getCategoriesHistory,
  createCategory,
  deleteCategories,
  updateCategory,
  categorySelect,
} from "@/data/categories";
import { Category } from "@/types";
import type { CategoryResolver } from "@/data/categoryMappings";

// Mock dependencies
jest.mock("@/db", () => ({
  db: {
    $queryRaw: jest.fn(),
    category: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mocked-uuid"),
}));

jest.mock("@/schemas", () => ({
  categorySchema: {
    safeParse: jest.fn(),
  },
}));

describe("categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserCategories", () => {
    const mockUserId = "user-123";
    const mockCategories: Category[] = [
      {
        id: "category-1",
        name: "Test Category",
        description: "Test Description",
        icon: "🍕",
        owner: { id: mockUserId, name: "User", image: null },
      },
    ];

    it("should return user categories", async () => {
      (db.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await getUserCategories(mockUserId);

      expect(result).toEqual(mockCategories);
      expect(db.category.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, archivedAt: null },
        select: categorySelect,
      });
    });
  });

  describe("getCategoriesCount", () => {
    const mockUserId = "user-123";
    const mockCount = 5;

    it("should return categories count", async () => {
      (db.category.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await getCategoriesCount(mockUserId);

      expect(result).toEqual(mockCount);
      expect(db.category.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, archivedAt: null },
      });
    });
  });

  describe("createCategory", () => {
    const mockCategoryData = {
      name: "Test Category",
      userId: "user-123",
      description: "Test Description",
      icon: "🍕",
    };

    it("should create a category successfully", async () => {
      (categorySchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
      });

      const mockDbResponse = {
        id: "mocked-uuid",
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      const expectedResult: Category = {
        id: "mocked-uuid",
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      (db.category.create as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await createCategory(
        mockCategoryData.name,
        mockCategoryData.userId,
        mockCategoryData.description,
        mockCategoryData.icon
      );

      expect(result).toEqual(expectedResult);

      expect(db.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            id: "mocked-uuid",
            name: mockCategoryData.name,
            userId: mockCategoryData.userId,
            description: mockCategoryData.description,
            icon: mockCategoryData.icon,
          },
        })
      );
    });

    it("should throw error if validation fails", async () => {
      (categorySchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
      });

      await expect(
        createCategory(
          mockCategoryData.name,
          mockCategoryData.userId,
          mockCategoryData.description
        )
      ).rejects.toThrow("Bad Request");

      expect(db.category.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategories", () => {
    const mockDeleteData = {
      ids: ["category-1", "category-2"],
      userId: "user-123",
    };

    it("archives categories instead of deleting them", async () => {
      const mockDeleteResult = { count: 2 };
      (db.category.updateMany as jest.Mock).mockResolvedValue(mockDeleteResult);

      const result = await deleteCategories(
        mockDeleteData.ids,
        mockDeleteData.userId
      );

      expect(result).toEqual(mockDeleteResult);
      expect(db.category.deleteMany).not.toHaveBeenCalled();
      expect(db.category.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: mockDeleteData.ids,
          },
          userId: mockDeleteData.userId,
          archivedAt: null,
        },
        data: { archivedAt: expect.any(Date) },
      });
    });
  });

  describe("updateCategory", () => {
    it("should update category successfully", async () => {
      const mockCategoryData = {
        id: "category-1",
        userId: "user-123",
        name: "Updated Category",
        description: "Updated Description",
        icon: "updated-icon",
      };

      const mockDbResponse = {
        id: mockCategoryData.id,
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      const expectedResult: Category = {
        id: mockCategoryData.id,
        name: mockCategoryData.name,
        description: mockCategoryData.description,
        icon: mockCategoryData.icon,
        owner: {
          id: mockCategoryData.userId,
          name: "Test User",
          image: null,
          email: "test@example.com",
        },
      };

      (db.category.update as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await updateCategory(
        mockCategoryData.id,
        mockCategoryData.userId,
        mockCategoryData.name,
        mockCategoryData.description,
        mockCategoryData.icon
      );

      expect(result).toEqual(expectedResult);
      expect(db.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockCategoryData.id,
            userId: mockCategoryData.userId,
            archivedAt: null,
          },
          data: {
            name: mockCategoryData.name,
            description: mockCategoryData.description,
            icon: mockCategoryData.icon,
          },
        })
      );
    });
  });
});

describe("getCategoriesHistory", () => {
  const CATEGORY_IDS = ["cat-food", "cat-salary"];

  /** user-1 owns its categories and maps Anna's "anna-food" onto "cat-food". */
  const resolver = {
    categories: [{ id: "cat-food" }, { id: "cat-salary" }] as Category[],
    resolve: (category) => {
      if (!category) return null;
      if (category.owner.id === "user-1") return category as Category;
      if (category.id === "anna-food") return { id: "cat-food" } as Category;
      return null;
    },
  } as CategoryResolver;

  const row = (
    categoryId: string,
    month: string,
    currencyId: string,
    amount: number,
    ownerId = "user-1",
    placedCategoryId: string | null = null,
  ) => ({
    categoryId,
    categoryName: categoryId,
    ownerId,
    archivedAt: null,
    placedCategoryId,
    month,
    currencyId,
    amount: BigInt(amount),
  });

  /** The bound values Prisma.sql collects, in template order. */
  const queryValues = () => (db.$queryRaw as jest.Mock).mock.calls[0][0].values;

  const months = async (timezone: string | null | undefined) =>
    (await getCategoriesHistory("user-1", ["cat-food"], timezone, resolver))
      .get("cat-food")!
      .map((entry) => entry.month);

  beforeEach(() => {
    jest.clearAllMocks();
    (db.$queryRaw as jest.Mock).mockResolvedValue([]);
    jest.useFakeTimers().setSystemTime(new Date("2026-09-20T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the five months before the current one, oldest first", async () => {
    expect(await months("Europe/Madrid")).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
  });

  it("queries only the window those five months cover", async () => {
    await getCategoriesHistory("user-1", CATEGORY_IDS, "Europe/Madrid", resolver);

    expect(queryValues()).toEqual([
      "Europe/Madrid",
      // The viewer's picks, then their account access.
      "user-1",
      "user-1",
      ...CATEGORY_IDS,
      "user-1",
      // 2026-04-01 and 2026-09-01, midnight in Madrid (CEST, UTC+2).
      new Date("2026-03-31T22:00:00Z"),
      new Date("2026-08-31T22:00:00Z"),
    ]);
  });

  it("cuts months in the user's timezone, not UTC", async () => {
    // 22:30 on 31 August in New York is already 1 September in UTC, so a
    // UTC-cut window would hand the client a bar for their live month.
    jest.setSystemTime(new Date("2026-09-01T02:30:00Z"));

    expect(await months("America/New_York")).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  it.each([["Mars/Olympus"], [null], [undefined]])(
    "falls back to UTC when the stored timezone is %p",
    async (timezone) => {
      jest.setSystemTime(new Date("2026-09-01T02:30:00Z"));

      expect(await months(timezone)).toEqual([
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
      ]);
      expect(queryValues()[0]).toBe("UTC");
    }
  );

  it("keeps one signed net total per currency and leaves quiet months empty", async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValueOnce([
      row("cat-food", "2026-05", "eur", -980000),
      row("cat-food", "2026-05", "usd", -45000),
      // A refund month that nets positive — spend-only aggregation would lose this.
      row("cat-food", "2026-08", "eur", 320000),
      row("cat-salary", "2026-07", "eur", 4500000),
    ]);

    const history = await getCategoriesHistory("user-1", CATEGORY_IDS, "Europe/Madrid", resolver);

    expect(history.get("cat-food")).toEqual([
      { month: "2026-04", totals: [] },
      {
        month: "2026-05",
        totals: [
          { currencyId: "eur", amount: -980000 },
          { currencyId: "usd", amount: -45000 },
        ],
      },
      { month: "2026-06", totals: [] },
      { month: "2026-07", totals: [] },
      { month: "2026-08", totals: [{ currencyId: "eur", amount: 320000 }] },
    ]);
    expect(history.get("cat-salary")).toEqual([
      { month: "2026-04", totals: [] },
      { month: "2026-05", totals: [] },
      { month: "2026-06", totals: [] },
      { month: "2026-07", totals: [{ currencyId: "eur", amount: 4500000 }] },
      { month: "2026-08", totals: [] },
    ]);
  });

  it("gives a category with no transactions at all five empty months", async () => {
    const history = await getCategoriesHistory("user-1", ["cat-food"], "UTC", resolver);

    expect(history.get("cat-food")).toEqual([
      { month: "2026-04", totals: [] },
      { month: "2026-05", totals: [] },
      { month: "2026-06", totals: [] },
      { month: "2026-07", totals: [] },
      { month: "2026-08", totals: [] },
    ]);
  });

  it("does not hit the database when there are no categories", async () => {
    const history = await getCategoriesHistory("user-1", [], "Europe/Madrid", resolver);

    expect(db.$queryRaw).not.toHaveBeenCalled();
    expect(history.size).toBe(0);
  });

  it("counts partner rows under the category they resolve to and drops unmapped ones", async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValueOnce([
      row("cat-food", "2026-05", "eur", -100000),
      // Anna's mapped category adds to the same currency total.
      row("anna-food", "2026-05", "eur", -50000, "anna"),
      row("anna-food", "2026-05", "usd", -7000, "anna"),
      // Anna's unmapped category counts nowhere.
      row("anna-hobby", "2026-05", "eur", -999000, "anna"),
    ]);

    const history = await getCategoriesHistory("user-1", ["cat-food"], "UTC", resolver);

    expect(history.get("cat-food")![1]).toEqual({
      month: "2026-05",
      totals: [
        { currencyId: "eur", amount: -150000 },
        { currencyId: "usd", amount: -7000 },
      ],
    });
  });

  it("counts rows the viewer picked under their pick, whatever the author filed", async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValueOnce([
      // Anna's unmapped category, but picked into cat-food row by row.
      row("anna-hobby", "2026-05", "eur", -20000, "anna", "cat-food"),
      // A pick moves a row out of the category it would resolve to.
      row("anna-food", "2026-05", "eur", -3000, "anna", "cat-salary"),
    ]);

    const history = await getCategoriesHistory(
      "user-1",
      ["cat-food", "cat-salary"],
      "UTC",
      resolver,
    );

    expect(history.get("cat-food")![1].totals).toEqual([
      { currencyId: "eur", amount: -20000 },
    ]);
    expect(history.get("cat-salary")![1].totals).toEqual([
      { currencyId: "eur", amount: -3000 },
    ]);
  });
});
