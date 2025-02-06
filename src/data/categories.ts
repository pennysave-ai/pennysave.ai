import { v4 as uuid } from "uuid";
import { db } from "@/db";
import { categorySchema } from "@/schemas";

enum PlaidCategoryConfidenceLevel {
  VERY_HIGH = "VERY_HIGH", // We are more than 98% confident that this category reflects the intent of the transaction.
  HIGH = "HIGH", // We are more than 90% confident that this category reflects the intent of the transaction.
  MEDIUM = "MEDIUM", // We are moderately confident that this category reflects the intent of the transaction.
  LOW = "LOW", // This category may reflect the intent, but there may be other categories that are more accurate.
  UNKNOWN = "UNKNOWN", // We don’t know the confidence level for this category.
}
/**
 * Assign the categories to the transactions
 * TODO Implement an ai model here to take into account user created categories
 * and assign them to the transactions
 * @param transactionsMap - A map of transactions with their personal finance categories
 * @param currentCategoriesMap - A map of existing user categories
 * @param plaidCategories - A list of plaid categories
 * @param userId - User ID
 * @returns {Promise<Map<(string, string)>>}
 */
export async function getCategoiresMappings(
  transactions: Map<
    string,
    {
      id: string;
      primary?: string | undefined;
      detailed?: string | undefined;
      confidence_level?: string | null;
    }
  >,
  currentCategoriesMap: Map<
    string,
    {
      name: string;
      description: string | null;
      plaidId: string | null;
      id: string;
    }
  >,
  plaidCategories: {
    id: string;
    description: string;
    detailed: string;
    primary: string;
  }[],
  userId: string
): Promise<Map<string, string | null>> {
  const mappedCategories = new Map();
  const newCategories = new Map();
  transactions.forEach((transaction) => {
    const confidenceLevel =
      (transaction?.confidence_level as PlaidCategoryConfidenceLevel) ||
      PlaidCategoryConfidenceLevel.UNKNOWN;
    // If the confidence level is LOW or UNKNOWN, mark transaction as uncategorized
    if (confidenceLevel === PlaidCategoryConfidenceLevel.UNKNOWN) {
      mappedCategories.set(transaction.id, null);
      return;
    }
    // Check if the transaction has a primary category and exists in the current categories map
    const primaryCategory = transaction.primary as string;
    const existingCategory = currentCategoriesMap.get(primaryCategory);
    if (existingCategory) {
      mappedCategories.set(transaction.id, existingCategory.id);
      return;
    } else {
      // Add a new category
      if (!newCategories.get(transaction.primary)) {
        const newCategoryUUID = uuid();
        mappedCategories.set(transaction.id, newCategoryUUID);
        const plaidCategory = plaidCategories.find(
          ({ primary, detailed }) =>
            primary === transaction.primary && detailed === transaction.detailed
        );
        newCategories.set(transaction.primary, {
          id: newCategoryUUID,
          plaidPrimary: transaction.primary,
          description: plaidCategory?.description,
          plaidId: plaidCategory?.id,
          name: transaction?.primary
            ?.toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          userId,
        });
      }
    }
  });
  // Add new categories to db
  await db.category.createMany({
    data: Array.from(newCategories.values()),
  });
  console.log("@mappedCategories", mappedCategories);
  return mappedCategories;
}

/**
 * Get the list of user categories
 * @param userId - User ID
 * @returns {Promise<{id: string, name: string, description: string}[]>}
 */
export async function getUserCategories(userId?: string) {
  return db.category.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}

/**
 * Greates a new category
 * @param {String} name - Category name
 * @param {String} userId - User ID
 * @param {String} description - Category description
 * @returns {Promise} - Promise object represents the category data
 * @throws {Error} - If the category creation fails
 */
export async function createCategory(
  name: string,
  userId: string,
  description?: string
) {
  const validationResult = categorySchema.safeParse({
    name,
  });
  if (!validationResult.success) {
    throw new Error("Bad Request");
  }
  const category = await db.category.create({
    data: {
      id: uuid(),
      name,
      userId,
      description,
    },
  });
  return { id: category.id };
}

/**
 * Get user categories by name
 * @param {String} userId - User ID
 * @param {String} name - Category Name
 * @returns {Array<{id:string, name: string, plaidId: string}>} - Array of category Id's
 */
export async function getUserCategoriesByName(userId: string, name: string) {
  const categories = await db.category.findMany({
    where: {
      userId,
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      plaidId: true,
    },
  });
  return categories;
}
