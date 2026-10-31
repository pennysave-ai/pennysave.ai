import { db } from "@/db";
import { categorySelect } from "@/data/categories";
import { normalizeCategoryName } from "@/lib/utils";
import {
  Category,
} from "@/types";

/** The minimum a category needs for the resolver: who owns it and what it is called. */
export type ResolvableCategory = {
  id: string;
  name: string;
  owner: { id: string };
  /** Set when its owner deleted it. */
  archivedAt?: Date | null;
};

/**
 * Answers "which of the viewer's categories does this category count under?".
 * Build one per request with getCategoryResolver and use it for every row, so
 * the transaction list, category history and reports can never disagree.
 */
export type CategoryResolver = {
  viewerId: string;
  /** The viewer's own categories, oldest first; archived ones left out. */
  categories: Category[];
  /**
   * 0. the viewer's own pick for this row (`transactionId`) → that category
   * 1. owned by the viewer → itself, or null once they archived it
   * 2. an explicit mapping → its target, or null if the viewer removed it
   * 3. same normalized name as one of the viewer's categories → the oldest
   *    such, unless the source is archived
   * 4. otherwise → null (unmapped)
   *
   * Pass `transactionId` whenever the category comes from a row; leave it out
   * only when resolving a category as such.
   */
  resolve: (
    category: ResolvableCategory | null | undefined,
    transactionId?: string | null,
  ) => Category | null;
  /** Step 3 on its own: the viewer's category a name matches, if any. */
  matchByName: (name: string) => Category | undefined;
};

/**
 * Build resolvers for several viewers with two queries, for batch jobs such as
 * the monthly reports.
 * @param {String[]} viewerIds - Viewer user IDs
 * @returns {Promise<Map<string, CategoryResolver>>} - A resolver per viewer
 */
export async function getCategoryResolvers(
  viewerIds: string[],
): Promise<Map<string, CategoryResolver>> {
  const ids = [...new Set(viewerIds)];
  const [categories, mappings, placements] = ids.length
    ? await Promise.all([
        db.category.findMany({
          where: { userId: { in: ids }, archivedAt: null },
          select: categorySelect,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        db.categoryMapping.findMany({
          where: { viewerId: { in: ids } },
          select: {
            viewerId: true,
            sourceCategoryId: true,
            targetCategoryId: true,
          },
        }),
        db.transactionPlacement.findMany({
          where: { viewerId: { in: ids } },
          select: { viewerId: true, transactionId: true, categoryId: true },
        }),
      ])
    : [[], [], []];

  return new Map(
    ids.map((viewerId) => [
      viewerId,
      buildResolver(
        viewerId,
        categories.filter((category) => category.owner.id === viewerId),
        mappings.filter((mapping) => mapping.viewerId === viewerId),
        placements.filter((placement) => placement.viewerId === viewerId),
      ),
    ]),
  );
}

function buildResolver(
  viewerId: string,
  categories: Category[],
  mappings: { sourceCategoryId: string; targetCategoryId: string | null }[],
  placements: { transactionId: string; categoryId: string }[],
): CategoryResolver {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const byName = new Map<string, Category>();
  // Oldest first, so the first category with a given name is the one kept.
  for (const category of categories) {
    const key = normalizeCategoryName(category.name);
    if (!byName.has(key)) byName.set(key, category);
  }
  const explicit = new Map(
    mappings.map((mapping) => [
      mapping.sourceCategoryId,
      mapping.targetCategoryId,
    ]),
  );
  const placed = new Map(
    placements.map((placement) => [
      placement.transactionId,
      placement.categoryId,
    ]),
  );
  const matchByName = (name: string) => byName.get(normalizeCategoryName(name));

  return {
    viewerId,
    categories,
    matchByName,
    resolve(category, transactionId) {
      // A pick under a category the viewer has since archived falls through.
      const pick = transactionId ? placed.get(transactionId) : undefined;
      const picked = pick ? byId.get(pick) : undefined;
      if (picked) return picked;
      if (!category) return null;
      if (category.owner.id === viewerId) {
        if (category.archivedAt) return null;
        return byId.get(category.id) ?? (category as Category);
      }
      const targetId = explicit.get(category.id);
      // Removed on purpose. Falling through to the name match would put it
      // straight back under the category it was just removed from.
      if (targetId === null) return null;
      const target = targetId ? byId.get(targetId) : undefined;
      if (target) return target;
      // A deleted category keeps what it was explicitly mapped to, but never
      // starts matching a category of the viewer's by name.
      if (category.archivedAt) return null;
      return matchByName(category.name) ?? null;
    },
  };
}

