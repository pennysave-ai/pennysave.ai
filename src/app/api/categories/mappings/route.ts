import { NextRequest, NextResponse, after } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import {
  listCategoryMappings,
  notifyCategoryMappingsChanged,
  upsertCategoryMapping,
} from "@/data/categoryMappings";
import { upsertCategoryMappingSchema } from "@/schemas";

/**
 * Every partner category that currently counts under one of the viewer's
 * categories: explicit mappings oldest first, then name matches.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const data = await listCategoryMappings(user.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error while fetching category mappings:", error);
    return NextResponse.json("Error while fetching category mappings", {
      status: 500,
    });
  }
}

/**
 * Create or replace the viewer's mapping for one partner category.
 */
export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const validationResult = upsertCategoryMappingSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  try {
    const { sourceCategoryId, targetCategoryId } = validationResult.data;
    const result = await upsertCategoryMapping(
      user.id,
      sourceCategoryId,
      targetCategoryId,
    );
    if (!result.ok) {
      return NextResponse.json("Couldn't save the mapping", {
        status: result.status,
      });
    }
    // The viewer's other devices.
    const userId = user.id;
    after(() => notifyCategoryMappingsChanged([userId], userId));
    return NextResponse.json({ ...result.mapping, previous: result.previous });
  } catch (error) {
    console.error("Error while saving category mapping:", error);
    return NextResponse.json("Error while saving category mapping", {
      status: 500,
    });
  }
}
