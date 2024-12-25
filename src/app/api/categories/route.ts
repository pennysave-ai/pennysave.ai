import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { v4 as uuid } from "uuid";
import { categorySchema } from "@/schemas";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  const categories = await db.category.findMany({
    select: { id: true, name: true, description: true },
    where: { userId: user.id },
  });
  const count = await db.category.count({ where: { userId: user.id } });
  return NextResponse.json({ data: categories, meta: { count } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const validationResult = categorySchema.safeParse({
    name: body.name,
  });
  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const category = await db.category.create({
    data: {
      id: uuid(),
      name: body.name,
      userId: user.id,
      plaidId: body.plaidId,
      description: body.description,
    },
  });
  return NextResponse.json({ data: category });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.ids) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }

  const categories = await db.category.deleteMany({
    where: { id: { in: body.ids }, userId: user.id },
  });

  return NextResponse.json({ data: categories });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json("Bad Request", { status: 400 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const validationResult = categorySchema.safeParse({
    name: body.name,
  });

  if (!validationResult.success) {
    return NextResponse.json("Bad Request", { status: 400 });
  }

  const category = await db.category.update({
    where: { id: body.id, userId: user.id },
    data: {
      name: body.name,
      plaidId: body.plaidId,
      description: body.description,
    },
  });

  return NextResponse.json({ data: category });
}
