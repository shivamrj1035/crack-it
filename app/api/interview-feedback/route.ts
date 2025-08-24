import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const result = await axios.post(
    "https://n8n.srv960131.hstgr.cloud/webhook/811f470b-6d49-410e-8166-7ae136617916",
    {
      messages,  // ✅ send as object, not stringified
    }
  );

  // Step 1: Extract raw string JSON
  const responseText = result.data?.content?.parts?.[0]?.text;

  // Step 2: Parse string into object
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse responseText", err, responseText);
    return NextResponse.json(
      { error: "Invalid response from model" },
      { status: 500 }
    );
  }

  // Step 3: Extract feedback (example structure)
  const feedback = {
    feedback: parsed.feedback || "",
    suggestions: parsed.suggestions || "",
    rating: parsed.rating || 0,
  };

  return NextResponse.json({ feedback });
}
