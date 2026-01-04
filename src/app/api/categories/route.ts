import { NextRequest, NextResponse } from "next/server";
import {
  getUserCategories,
  createCategory,
  getCategoriesCount,
  deleteCategories,
  updateCategory,
} from "@/data/categories";
import { categorySchema } from "@/schemas";
import { getAuthenticatedUser } from "@/auth.helper";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const categories = await getUserCategories(user.id);
    const count = await getCategoriesCount(user.id);
    return NextResponse.json({ data: categories, meta: { count } });
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
      body.icon
    );
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
    const category = await updateCategory(
      body.id,
      user.id,
      body.name,
      body.description,
      body.icon
    );
    return NextResponse.json(category);
  } catch {
    return NextResponse.json("Error while updating categories", {
      status: 500,
    });
  }
}
