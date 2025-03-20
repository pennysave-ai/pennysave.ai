import { v4 as uuid } from "uuid";
import { db } from "@/db";
import { categorySchema } from "@/schemas";

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

/*
 * Get categories number
 * @param userId - User ID
 * @returns {Promise<number>}
 */
export async function getCategoriesCount(userId?: string) {
  return await db.category.count({ where: { userId } });
}

/**
 * Creates a new category
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
 * @returns {Array<{id:string, name: string}>} - Array of category Id's
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
    },
  });
  return categories;
}

/**
 * Delete user categories
 * @param {String[]} ids - Array of category Id's
 * @param {String} userId - User ID
 * @returns {Promise<{id: string}[]>} - Array of category Id's
 * @throws {Error} - If the category deletion fails
 */
export async function deleteCategories(ids: string[], userId: string) {
  const categories = await db.category.deleteMany({
    where: { id: { in: ids }, userId },
  });
  return categories;
}

/**
 * Update user category
 * @param {String} id - Category ID
 * @param {String} userId - User ID
 * @param {String} name - Category Name
 * @param {String} description - Category Description
 * @returns {Promise<{id: string, name: string}>} - Category data
 * @throws {Error} - If the category update fails
 */
export async function updateCategory(
  id: string,
  userId: string,
  name: string,
  description?: string
) {
  const category = await db.category.update({
    where: { id, userId },
    data: {
      name,
      description,
    },
  });
  return category;
}
