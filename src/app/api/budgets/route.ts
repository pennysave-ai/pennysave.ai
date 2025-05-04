import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} from "@/data/budgets";

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
  try {
    const newBudget = await createBudget(user.id, body);
    return NextResponse.json({ data: newBudget });
  } catch {
    return NextResponse.json("Error while creating budget", { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  const user = session.user;
  if (!user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const budgets = await getBudgets(user.id);
    return NextResponse.json({ data: budgets });
  } catch (e) {
    return NextResponse.json("Error while fetching budgets" + e, {
      status: 500,
    });
  }
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
  try {
    const updatedBudget = await updateBudget(user.id, body.id, body);
    return NextResponse.json({ data: updatedBudget });
  } catch (e) {
    return NextResponse.json(`Error while updating budget ${e}`, {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
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
  try {
    const deletedBudget = await deleteBudget(user.id, body.id);
    return NextResponse.json({ data: deletedBudget });
  } catch (e) {
    return NextResponse.json(`Error while deleting budget ${e}`, {
      status: 500,
    });
  }
}
