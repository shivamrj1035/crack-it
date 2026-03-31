import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      organizationId,
      interviewId,
      candidateId,
      eventType,
      severity,
      description,
      metadata,
      screenshotUrl,
    } = await request.json();

    // Validate required fields
    if (!organizationId || !interviewId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Store the proctoring log in your database (Convex)
    // 2. Send real-time alerts for critical events
    // 3. Update the interview's violation count
    // 4. Potentially trigger auto-submission for repeated violations

    console.log("Proctoring Event Logged:", {
      organizationId,
      interviewId,
      candidateId,
      eventType,
      severity,
      description,
      metadata,
      timestamp: new Date().toISOString(),
      userId: user.id,
    });

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Event logged successfully",
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error logging proctoring event:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    );
  }
}
