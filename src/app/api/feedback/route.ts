import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/auth.helper";
import { feedbackSchema } from "@/schemas";
import { createFeedback } from "@/data/feedback";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id) {
    return NextResponse.json("Unautorized", { status: 401 });
  }
  try {
    const body = await req.json();

    // Validate and sanitize input
    const validationResult = feedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid input",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { message, deviceInfo } = validationResult.data;
    await createFeedback({
      userId: user.id,
      message,
      deviceInfo,
    });
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process feedback." },
      { status: 500 }
    );
  }
}
