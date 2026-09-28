import { subMonths } from "date-fns";
import { db } from "@/db";
import { categorySelect } from "@/data/categories";
import { cosineSimilarity, embedTexts } from "@/lib/embeddings";
import { normalizeCategoryName, normalizeMatchKey } from "@/lib/utils";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";
import {
  Category,
  CategoryMappingItem,
  CategoryMappingSuggestion,
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
 * Cut-offs for the payee-overlap suggestion. One shared payee is enough: the
 * share below is what keeps a payee you file all over the place from deciding.
 */
const SUGGEST_HISTORY_MONTHS = 6;
const SUGGEST_MIN_SHARED_KEYS = 1;
const SUGGEST_MIN_SHARE = 0.6;
/**
 * Cut-offs for the meaning suggestion. Category names are a word or two, so
 * even a clear match scores well below 0.9: on real data "Pet" vs "Dog" was
 * 0.63 while every unrelated category stayed at 0.38 or under. So the best
 * match is taken when it is plausible at all and stands clearly apart from the
 * runner-up, rather than above a fixed high bar it never reaches.
 */
const SUGGEST_MIN_MEANING_SIMILARITY = 0.5;
const SUGGEST_MIN_MEANING_LEAD = 0.15;
const SUGGEST_MAX_RESULTS = 3;

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

/**
 * Build the resolver for one viewer.
 * @param {String} viewerId - Viewer user ID
 * @returns {Promise<CategoryResolver>}
 */
export async function getCategoryResolver(
  viewerId: string,
): Promise<CategoryResolver> {
  return (await getCategoryResolvers([viewerId])).get(viewerId)!;
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

/**
 * Keep partners' rows where they are when a category is renamed.
 *
 * A same-name match is worked out on every read, so renaming "Food" to
 * "Groceries" would quietly move a partner's rows out of their "Food". Before
 * the rename, every co-member whose rows here match by the old name, and who
 * has no mapping of their own, gets that match stored as an explicit mapping.
 * Call it before writing the new name; a rename that keeps the normalized name
 * is a no-op.
 * @param {String} categoryId - The category being renamed
 * @param {String} ownerId - Its owner
 * @param {String} newName - The name it is about to get
 */
export async function freezeNameMatchesBeforeRename(
  categoryId: string,
  ownerId: string,
  newName: string,
) {
  const category = await db.category.findFirst({
    where: { id: categoryId, userId: ownerId, archivedAt: null },
    select: { name: true },
  });
  if (
    !category ||
    normalizeCategoryName(category.name) === normalizeCategoryName(newName)
  ) {
    return;
  }
  const coMemberIds = await getCoMemberIds(ownerId);
  if (!coMemberIds.length) return;

  const [resolvers, mapped, seen] = await Promise.all([
    getCategoryResolvers(coMemberIds),
    db.categoryMapping.findMany({
      where: { sourceCategoryId: categoryId, viewerId: { in: coMemberIds } },
      select: { viewerId: true },
    }),
    // Which co-members can see a row filed here at all.
    db.userAccountAccess.findMany({
      where: {
        userId: { in: coMemberIds },
        userAccount: { transactions: { some: { categoryId } } },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  const hasMapping = new Set(mapped.map((mapping) => mapping.viewerId));
  const rows = seen.flatMap(({ userId: viewerId }) => {
    if (hasMapping.has(viewerId)) return [];
    const target = resolvers.get(viewerId)?.matchByName(category.name);
    return target
      ? [
          {
            viewerId,
            sourceCategoryId: categoryId,
            targetCategoryId: target.id,
          },
        ]
      : [];
  });
  if (rows.length) {
    await db.categoryMapping.createMany({ data: rows, skipDuplicates: true });
  }
}

/**
 * Every user who shares at least one account with `userId`, excluding them.
 * @param {String} userId - User ID
 * @returns {Promise<String[]>}
 */
export async function getCoMemberIds(userId: string): Promise<string[]> {
  const rows = await db.userAccountAccess.findMany({
    where: {
      userId: { not: userId },
      userAccount: { userAccess: { some: { userId } } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((row) => row.userId);
}

type PartnerCategoryCheck =
  | { ok: true; category: Category }
  | { ok: false; reason: "not_found" | "own" | "not_shared" };

/**
 * Check that `sourceCategoryId` is a partner category the viewer could see:
 * it exists, someone else owns it, and that someone shares an account with the
 * viewer.
 */
async function checkPartnerCategory(
  viewerId: string,
  sourceCategoryId: string,
): Promise<PartnerCategoryCheck> {
  const category = await db.category.findUnique({
    where: { id: sourceCategoryId },
    select: categorySelect,
  });
  if (!category) return { ok: false, reason: "not_found" };
  if (category.owner.id === viewerId) return { ok: false, reason: "own" };
  const shared = await db.userAccountAccess.findFirst({
    where: {
      userId: viewerId,
      userAccount: { userAccess: { some: { userId: category.owner.id } } },
    },
    select: { userId: true },
  });
  if (!shared) return { ok: false, reason: "not_shared" };
  return { ok: true, category };
}

/**
 * Create or replace the viewer's mapping for one partner category.
 * @param {String} viewerId - Viewer user ID
 * @param {String} sourceCategoryId - The partner's category
 * @param {String} targetCategoryId - The viewer's category it should count under
 * @returns The stored mapping as a list item, or the HTTP status to answer with
 */
export async function upsertCategoryMapping(
  viewerId: string,
  sourceCategoryId: string,
  targetCategoryId: string,
): Promise<
  | {
      ok: true;
      mapping: CategoryMappingItem;
      /**
       * What was stored for this source before, so Undo can put it back:
       * null when nothing was (name matching applied), else the old row —
       * `targetCategoryId: null` being a removal.
       */
      previous: { targetCategoryId: string | null } | null;
    }
  | { ok: false; status: 400 | 403 | 404 }
> {
  // A missing category and someone else's category get the same answer.
  const target = await db.category.findFirst({
    where: { id: targetCategoryId, userId: viewerId, archivedAt: null },
    select: { id: true },
  });
  if (!target) return { ok: false, status: 404 };

  const source = await checkPartnerCategory(viewerId, sourceCategoryId);
  if (!source.ok) {
    return { ok: false, status: source.reason === "not_shared" ? 403 : 400 };
  }

  const previous = await db.categoryMapping.findUnique({
    where: { viewerId_sourceCategoryId: { viewerId, sourceCategoryId } },
    select: { targetCategoryId: true },
  });
  await db.categoryMapping.upsert({
    where: { viewerId_sourceCategoryId: { viewerId, sourceCategoryId } },
    create: { viewerId, sourceCategoryId, targetCategoryId },
    update: { targetCategoryId },
  });
  return {
    ok: true,
    mapping: { source: source.category, targetCategoryId, kind: "explicit" },
    previous,
  };
}

/**
 * Stop counting a partner category under any of the viewer's categories, an
 * explicit mapping and a same-name match alike. Stored as a mapping with no
 * target, so the name match doesn't take over the moment the mapping is gone;
 * mapping it again with upsertCategoryMapping replaces it. Idempotent, and a
 * no-op for a category the viewer couldn't map in the first place.
 *
 * `forget` instead deletes the row, back to "nothing stored": what Undo sends
 * when the mapping it takes back was the first thing stored for this source,
 * so a same-name match applies again as it did before the pick.
 * @param {String} viewerId - Viewer user ID
 * @param {String} sourceCategoryId - The partner's category
 * @param {Object} options - `forget`: delete the row rather than store a removal
 */
export async function deleteCategoryMapping(
  viewerId: string,
  sourceCategoryId: string,
  { forget = false }: { forget?: boolean } = {},
) {
  const source = await checkPartnerCategory(viewerId, sourceCategoryId);
  if (!source.ok) return;
  if (forget) {
    await db.categoryMapping.deleteMany({
      where: { viewerId, sourceCategoryId },
    });
    return;
  }
  await db.categoryMapping.upsert({
    where: { viewerId_sourceCategoryId: { viewerId, sourceCategoryId } },
    create: { viewerId, sourceCategoryId, targetCategoryId: null },
    update: { targetCategoryId: null },
  });
}

/**
 * Every partner category that currently counts under one of the viewer's
 * categories: explicit mappings oldest first, then name matches.
 * @param {String} viewerId - Viewer user ID
 * @returns {Promise<CategoryMappingItem[]>}
 */
export async function listCategoryMappings(
  viewerId: string,
): Promise<CategoryMappingItem[]> {
  const [resolver, coMemberIds, explicit] = await Promise.all([
    getCategoryResolver(viewerId),
    getCoMemberIds(viewerId),
    db.categoryMapping.findMany({
      where: { viewerId },
      select: {
        sourceCategoryId: true,
        targetCategoryId: true,
        sourceCategory: { select: categorySelect },
      },
      orderBy: [{ createdAt: "asc" }, { sourceCategoryId: "asc" }],
    }),
  ]);
  // A mapping whose source owner no longer shares an account is hidden, not
  // deleted, so sharing again later brings it back.
  const coMembers = new Set(coMemberIds);

  const explicitItems: CategoryMappingItem[] = explicit.flatMap((mapping) =>
    // A removed source counts nowhere, so it has nothing to list.
    mapping.targetCategoryId !== null &&
    coMembers.has(mapping.sourceCategory.owner.id)
      ? [
          {
            source: mapping.sourceCategory,
            targetCategoryId: mapping.targetCategoryId,
            kind: "explicit" as const,
          },
        ]
      : [],
  );

  // Partner categories seen on any account the viewer can access, any month.
  // Archived sources never match by name, so they have no name item.
  const partnerCategories = await db.category.findMany({
    where: {
      userId: { in: coMemberIds },
      archivedAt: null,
      id: { notIn: explicit.map((mapping) => mapping.sourceCategoryId) },
      transactions: {
        some: { account: { userAccess: { some: { userId: viewerId } } } },
      },
    },
    select: categorySelect,
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const nameItems: CategoryMappingItem[] = [];
  for (const source of partnerCategories) {
    const target = resolver.matchByName(source.name);
    if (target) {
      nameItems.push({ source, targetCategoryId: target.id, kind: "name" });
    }
  }

  return [...explicitItems, ...nameItems];
}

/**
 * Make sure each category has an embedding for its current name, computing the
 * missing or stale ones in one request, and return them keyed by category ID.
 * Categories whose embedding could not be computed are left out.
 * @param {String[]} categoryIds - Categories to embed
 * @returns {Promise<Map<string, number[]>>}
 */
export async function ensureCategoryEmbeddings(
  categoryIds: string[],
): Promise<Map<string, number[]>> {
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: {
      id: true,
      name: true,
      nameEmbedding: true,
      nameEmbeddingKey: true,
    },
  });
  const embeddings = new Map<string, number[]>();
  const stale = categories.filter((category) => {
    const fresh =
      category.nameEmbedding.length > 0 &&
      category.nameEmbeddingKey === normalizeCategoryName(category.name);
    if (fresh) embeddings.set(category.id, category.nameEmbedding);
    return !fresh;
  });
  if (!stale.length) return embeddings;

  const vectors = await embedTexts(
    stale.map((category) => category.name.trim()),
  );
  if (!vectors) return embeddings;

  await db.$transaction(
    stale.map((category, i) =>
      db.category.update({
        where: { id: category.id },
        data: {
          nameEmbedding: vectors[i],
          nameEmbeddingKey: normalizeCategoryName(category.name),
        },
        select: { id: true },
      }),
    ),
  );
  stale.forEach((category, i) => embeddings.set(category.id, vectors[i]));
  return embeddings;
}

/** The key a transaction is matched on: its payee, or its notes when there is no payee. */
function transactionMatchKey(payee: string | null, notes: string | null) {
  return normalizeMatchKey(payee) || normalizeMatchKey(notes);
}

/**
 * Which of the viewer's categories a partner category probably corresponds to,
 * best first, at most three. Suggestions only — the resolver never uses them.
 * @param {String} viewerId - Viewer user ID
 * @param {String} sourceCategoryId - The partner's category
 * @returns {Promise<CategoryMappingSuggestion[] | null>} - null when the source
 * is not a partner category the viewer can see
 */
export async function suggestCategoryMappings(
  viewerId: string,
  sourceCategoryId: string,
): Promise<CategoryMappingSuggestion[] | null> {
  const source = await checkPartnerCategory(viewerId, sourceCategoryId);
  if (!source.ok) return null;

  const resolver = await getCategoryResolver(viewerId);
  const suggestions: CategoryMappingSuggestion[] = [];
  const suggested = new Set<string>();
  const add = (suggestion: CategoryMappingSuggestion) => {
    if (suggested.has(suggestion.categoryId)) return;
    suggested.add(suggestion.categoryId);
    suggestions.push(suggestion);
  };

  // 1. Payee overlap. Only the source's rows on accounts the viewer can see are
  // used, so a partner's private payees never show up in `reason.payees`.
  const since = subMonths(new Date(), SUGGEST_HISTORY_MONTHS);
  const [sourceRows, viewerRows] = await Promise.all([
    db.transaction.findMany({
      where: {
        categoryId: sourceCategoryId,
        createdAt: { gte: since },
        account: { userAccess: { some: { userId: viewerId } } },
      },
      select: { payee: true, notes: true },
    }),
    db.transaction.findMany({
      where: {
        createdBy: viewerId,
        createdAt: { gte: since },
        category: { userId: viewerId, archivedAt: null },
      },
      select: { payee: true, notes: true, categoryId: true },
    }),
  ]);

  // Normalized key → the name to show for it.
  const sourceKeys = new Map<string, string>();
  for (const row of sourceRows) {
    const key = transactionMatchKey(row.payee, row.notes);
    if (key && !sourceKeys.has(key)) {
      sourceKeys.set(key, (row.payee || row.notes || "").trim());
    }
  }

  if (sourceKeys.size) {
    // Per viewer category: how many matching rows, and how many per key.
    const matches = new Map<string, Map<string, number>>();
    let totalMatches = 0;
    for (const row of viewerRows) {
      const key = transactionMatchKey(row.payee, row.notes);
      if (!row.categoryId || !key || !sourceKeys.has(key)) continue;
      const byKey = matches.get(row.categoryId) ?? new Map<string, number>();
      byKey.set(key, (byKey.get(key) ?? 0) + 1);
      matches.set(row.categoryId, byKey);
      totalMatches += 1;
    }
    const ranked = [...matches.entries()]
      .map(([categoryId, byKey]) => ({
        categoryId,
        byKey,
        count: [...byKey.values()].reduce((sum, n) => sum + n, 0),
      }))
      .sort((a, b) => b.count - a.count);
    const best = ranked[0];
    if (
      best &&
      best.byKey.size >= SUGGEST_MIN_SHARED_KEYS &&
      best.count / totalMatches >= SUGGEST_MIN_SHARE
    ) {
      add({
        categoryId: best.categoryId,
        confidence: Number((best.count / totalMatches).toFixed(2)),
        reason: {
          kind: "payees",
          payees: [...best.byKey.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => sourceKeys.get(key)!),
        },
      });
    }
  }

  // 2. Name.
  const nameMatch = resolver.matchByName(source.category.name);
  if (nameMatch) {
    add({ categoryId: nameMatch.id, confidence: 1, reason: { kind: "name" } });
  }

  // 3. Meaning.
  if (suggestions.length < SUGGEST_MAX_RESULTS && resolver.categories.length) {
    const embeddings = await ensureCategoryEmbeddings([
      sourceCategoryId,
      ...resolver.categories.map((category) => category.id),
    ]);
    const sourceEmbedding = embeddings.get(sourceCategoryId);
    if (sourceEmbedding) {
      const [best, runnerUp] = resolver.categories
        .map((category) => ({
          categoryId: category.id,
          similarity: cosineSimilarity(
            sourceEmbedding,
            embeddings.get(category.id) ?? [],
          ),
        }))
        .sort((a, b) => b.similarity - a.similarity);
      if (
        best &&
        best.similarity >= SUGGEST_MIN_MEANING_SIMILARITY &&
        best.similarity - (runnerUp?.similarity ?? 0) >=
          SUGGEST_MIN_MEANING_LEAD
      ) {
        add({
          categoryId: best.categoryId,
          confidence: Number(best.similarity.toFixed(2)),
          reason: { kind: "meaning" },
        });
      }
    }
  }

  return suggestions.slice(0, SUGGEST_MAX_RESULTS);
}

/**
 * Tell clients that name matches or mappings may have changed, so they refetch
 * transactions and the mapping list. Never throws: the change itself is already
 * saved, and a missed event only delays the refresh.
 * @param {String[]} recipients - Users to notify
 * @param {String} actorId - The user whose action caused the change
 */
export async function notifyCategoryMappingsChanged(
  recipients: string[],
  actorId: string,
) {
  if (!recipients.length) return;
  try {
    await sendWebSocketMessage(
      { type: BroadcastType.CATEGORY_MAPPINGS_CHANGED, recipients },
      actorId,
    );
  } catch {
    // Logged by sendWebSocketMessage.
  }
}
