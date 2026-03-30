import { NextRequest, NextResponse } from "next/server";
import { generateInterviewFeedback } from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Generate feedback using Gemini AI
    const feedback = await generateInterviewFeedback(messages);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error generating interview feedback:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
