import { NextRequest, NextResponse, after } from "next/server";
import {
  getUserCategories,
  getCategoriesHistory,
  createCategory,
  getCategoriesCount,
  deleteCategories,
  updateCategory,
} from "@/data/categories";
import {
  ensureCategoryEmbeddings,
  freezeNameMatchesBeforeRename,
  getCategoryResolver,
  getCoMemberIds,
  notifyCategoryMappingsChanged,
} from "@/data/categoryMappings";
import { getUserTimezone } from "@/data/user";
import { categorySchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";

/**
 * After a category is created, renamed or deleted: refresh the embeddings used
 * for mapping suggestions, and tell co-members whose name matches may have
 * moved. Runs after the response so neither can slow it down or fail it.
 */
function afterCategoriesChanged(userId: string, embedCategoryIds: string[]) {
  after(async () => {
    if (embedCategoryIds.length) {
      await ensureCategoryEmbeddings(embedCategoryIds).catch((error) =>
        console.error("Error while embedding categories:", error),
      );
    }
    const coMemberIds = await getCoMemberIds(userId);
    await notifyCategoryMappingsChanged(coMemberIds, userId);
  });
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  // History is opt-in: four of the five screens that call this endpoint never
  // draw a chart, so the aggregation stays off the default path.
  const includeHistory =
    req?.nextUrl?.searchParams
      ?.get("include")
      ?.split(",")
      .map((part) => part.trim())
      .includes("history") ?? false;
  try {
    const categories = await getUserCategories(user.id);
    const count = await getCategoriesCount(user.id);
    if (!includeHistory) {
      return NextResponse.json({ data: categories, meta: { count } });
    }
    const [timezone, resolver] = await Promise.all([
      getUserTimezone(user.id),
      getCategoryResolver(user.id),
    ]);
    const historyByCategory = await getCategoriesHistory(
      user.id,
      categories.map((category) => category.id),
      timezone,
      resolver,
    );
    return NextResponse.json({
      data: categories.map((category) => ({
        ...category,
        history: historyByCategory.get(category.id) ?? [],
      })),
      meta: { count },
    });
  } catch {
    return NextResponse.json("Error while fetching user categories", {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const newCategory = await createCategory(
      body.name,
      user.id,
      body.description,
      body.icon,
    );
    afterCategoriesChanged(user.id, [newCategory.id]);
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Error while creating category:", error);
    return NextResponse.json("Error while creating categories", {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    const categories = await deleteCategories(body.ids, user.id);
    afterCategoriesChanged(user.id, []);
    return NextResponse.json({ data: categories });
  } catch {
    return NextResponse.json("Error while deleting categories", {
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const validationResult = categorySchema.safeParse({
    name: body.name,
  });

  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    // Partners whose rows sit here by name keep them where they are.
    await freezeNameMatchesBeforeRename(body.id, user.id, body.name);
    const category = await updateCategory(
      body.id,
      user.id,
      body.name,
      body.description,
      body.icon,
    );
    afterCategoriesChanged(user.id, [category.id]);
    return NextResponse.json(category);
  } catch {
    return NextResponse.json("Error while updating categories", {
      status: 500,
    });
  }
}
