import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { generateQuestions } from "@/lib/ai-interviewer";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      interviewerType,
      resumeText,
      jobTitle,
      jobDescription,
      experience,
      questionCount,
    } = await request.json();

    // Validate required fields
    if (!interviewerType) {
      return NextResponse.json(
        { error: "Interviewer type is required" },
        { status: 400 }
      );
    }

    // Generate questions using specialized AI interviewer
    const questions = await generateQuestions(
      interviewerType,
      resumeText || null,
      jobTitle || "Software Developer",
      jobDescription || "",
      experience || "mid",
      questionCount || 10
    );

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 }
    );
  }
}
