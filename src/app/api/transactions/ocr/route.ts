import { NextRequest, NextResponse } from "next/server";
import { convertAmountToMilliunits } from "@/lib/utils";
import { getAuthenticatedUser } from "@/auth.helper";
import { createTransaction } from "@/data/transactions";
import { getUsersWithAccessToAccount } from "@/data/userAccounts";
import { sendWebSocketMessage } from "@/lib/websocket";
import { BroadcastType } from "@/wstypes";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.id) {
      return NextResponse.json("Unautorized", { status: 401 });
    }
    const { imageBase64, categories, account } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const categoryMap = new Map<
      string,
      { id: string; icon: string; name: string }
    >(
      categories.map((c: { id: string; name: string; icon: string }) => [
        c.name.toLowerCase(),
        { id: c.id, icon: c.icon, name: c.name },
      ])
    );

    const availableCategories = Array.from(categoryMap.keys());

    // Remove data URL prefix if present
    const base64Image = imageBase64.startsWith("data:")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // Step 1: Validate if image is a receipt (pre-check)
    // TODO - implement a queue system for handling receipt parsing items with prices
    // to be able to add it to redis to comapre prices later in vektor db
    // and also to avoid long waiting times for the user
    // add the following to the prompt
    // "items": [
    //     {
    //       "name": "item name",
    //       "quantity": 1,
    //       "price": 0.00
    //     }
    // ]
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-VL-7B-Instruct",
          messages: [
            {
              role: "system",
              content:
                "You are a precise receipt parser. Extract structured data from receipt images. Always respond with valid JSON only, no markdown, no explanations.",
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
                {
                  type: "text",
                  text: `Parse this receipt and return ONLY this JSON structure (no markdown, no code blocks):
{
  "payee": "merchant name",
  "total": number,
  "datetime": "YYYY-MM-DD HH:MM:SS",
  "potential_category": "${availableCategories.join('" | "')}",
  "type": "receipt" | "invoice",
}`,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0,
        }),
      }
    );

    const data = await response.json();

    const jsonStr = data.choices?.[0]?.message?.content?.trim();

    if (!jsonStr) {
      console.error("No content in response:", data);
      throw new Error("No content in response");
    }

    // Try multiple cleanup strategies
    let cleanJson = jsonStr;

    // Remove markdown code blocks
    cleanJson = cleanJson.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    let receipt = JSON.parse(cleanJson);

    // O(1) lookup using Map
    const category = categoryMap.get(receipt.potential_category?.toLowerCase());

    const milliunits =
      convertAmountToMilliunits(parseFloat(receipt?.total)) || null;

    const amount =
      receipt.type === "receipt"
        ? milliunits
          ? -milliunits
          : 0
        : milliunits
          ? milliunits
          : 0;

    // Parse and format datetime
    let formattedDate: string;
    if (receipt?.datetime) {
      try {
        const parsedDate = new Date(receipt.datetime);

        // Check if valid date
        if (!isNaN(parsedDate.getTime())) {
          // ✅ Format as ISO 8601: 2025-12-13T20:36:50.314Z
          formattedDate = parsedDate.toISOString();
        } else {
          // Fallback to current time if invalid
          formattedDate = new Date().toISOString();
        }
      } catch {
        // Fallback to current time on error
        formattedDate = new Date().toISOString();
      }
    } else {
      // No datetime in receipt, use current time
      formattedDate = new Date().toISOString();
    }

    // Creating the payload for transaction creation
    const payload = {
      amount,
      payee: receipt?.payee || null,
      accountId: account?.id,
      categoryId: category?.id || null,
      createdAt: formattedDate,
      notes: receipt?.payee || "",
    };

    // If Amount or Category id is missing, we will not create the transaction
    if (!amount || !payload?.categoryId) {
      return NextResponse.json({
        success: true,
        data: {
          id: "",
          amount,
          payee: payload.payee,
          notes: payload.payee,
          createdAt: payload.createdAt,
          account: {
            id: account?.id || "",
            name: account?.name || "",
            last4: null,
            institutionName: "",
            currency: {
              symbol: account?.currency?.symbol || "",
              name: account?.currency?.name || "",
              id: account?.currency?.id || "",
              exchangeRate: account?.currency?.exchangeRate || 0,
            },
            institution: {
              name: account?.institution?.name || "",
            },
          },
          category: {
            id: category?.id || null,
            name: category?.name || null,
            icon: category?.icon || null,
          },
          createdByUser: {
            id: user.id!,
            name: user.name || "",
            email: user.email || "",
            image: user.image || null,
          },
        },
      });
    }

    // Create transaction
    const newTransaction = await createTransaction(
      payload,
      user.email!,
      user?.name || "Customer",
      user.id
    );
    // Fetch users who have access to the account
    const usersWithAccess = await getUsersWithAccessToAccount(
      payload.accountId
    );

    // Send WebSocket message to notify clients about the new transaction
    // Only send to the who has access to this account
    // for now our wss server is free and can be in hybernate mode
    // waiting for the response can take too long and cause timeouts and 504 response for this API
    // that's why we do not await this function
    // we can improve this later by using a queue system like RabbitMQ or similar
    sendWebSocketMessage(
      {
        type: BroadcastType.TRANSACTION_CREATED,
        recipients: usersWithAccess,
        data: {
          ...newTransaction,
        },
      },
      user.id
    );
    return NextResponse.json({ success: true, data: newTransaction });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      {
        success: false,
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: null,
      },
      { status: 500 }
    );
  }
}
