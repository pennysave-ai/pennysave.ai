import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, availableCategories } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Remove data URL prefix if present
    const base64Image = imageBase64.startsWith("data:")
      ? imageBase64.split(",")[1]
      : imageBase64;

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
  "address": "store address or name",
  "currency": "currency code",
  "total": 0.00,
  "potential_category": "${availableCategories
    .map((item: string) => `"${item}"`)
    .join(" | ")}",
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "price": 0.00
    }
  ]
}`,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API error:", response.status, errorText);
      throw new Error(`HF API error: ${response.status} - ${errorText}`);
    }

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

    // Try to extract JSON object if there's extra text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    let receipt;
    try {
      receipt = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", cleanJson);

      // Return raw text for debugging
      return NextResponse.json(
        {
          error: "Failed to parse JSON",
          rawResponse: jsonStr,
          cleanedResponse: cleanJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      {
        error: "OCR failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: null,
      },
      { status: 500 }
    );
  }
}
