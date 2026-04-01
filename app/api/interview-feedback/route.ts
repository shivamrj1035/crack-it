import { NextRequest, NextResponse } from "next/server";
import { generateInterviewFeedback } from "@/lib/groq";

import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    let aiConfig = undefined;
    if (user) {
      const convexUser = await convex.query(api.user.getByClerkId, { clerkId: user.id });
      if (convexUser?.organizationId) {
        const byokKey = await convex.query(api.aiProviders.getDefaultKey, { 
          organizationId: convexUser.organizationId 
        });
        
        if (byokKey) {
          aiConfig = {
            apiKey: byokKey.apiKey,
            model: byokKey.preferredModel,
            provider: byokKey.provider
          };
        }
      }
    }

    // Generate feedback using Config (BYOK if available, else System Default)
    const feedback = await generateInterviewFeedback(messages, aiConfig);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error generating interview feedback:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
