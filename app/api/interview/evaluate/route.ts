import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { evaluateAnswer, generateInterviewResult } from "@/lib/ai-interviewer";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === "answer") {
      // Evaluate single answer
      const { question, response, interviewerType } = body;

      if (!question || !response || !interviewerType) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const evaluation = await evaluateAnswer(question, response, interviewerType);

      return NextResponse.json({
        success: true,
        evaluation,
      });
    } else if (type === "final") {
      // Generate final result
      const { evaluations, questions, interviewerType, proctoringScore } = body;

      if (!evaluations || !questions || !interviewerType) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const result = await generateInterviewResult(
        evaluations,
        questions,
        interviewerType,
        proctoringScore || 100
      );

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json({ error: "Invalid evaluation type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in evaluation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate" },
      { status: 500 }
    );
  }
}
