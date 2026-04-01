import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import process from "process";
import { aj } from "@/utils/arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { generateInterviewQuestions } from "@/lib/groq";

var imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("resume") as File;
  const jobTitle = formData.get("jobTitle") as string | null;
  const jobDescription = formData.get("jobDescription") as string | null;
  const jobExperience = formData.get("jobExperience") as string | null;
  const interviewerTypeId = formData.get("interviewerTypeId") as string | null;

  const decision = await aj.protect(request, {
    requested: 5,
  }); 

  // @ts-ignore
  if (decision?.reason?.remaining === 0) {
    return NextResponse.json(
      {
        error: "No free credit remaining, Try again after 24hours",
        reason: decision.reason,
      },
      { status: 429 }
    );
  }

  try {
    // 1. Fetch User and Org from Convex
    const convexUser = await convex.query(api.user.getByClerkId, { clerkId: user.id });
    let aiConfig = undefined;
    let customSystemPrompt = undefined;

    if (convexUser?.organizationId) {
      // 2. Fetch default BYOK key for this organization
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

      // 3. Fetch Specialized Interviewer Type if requested
      if (interviewerTypeId && interviewerTypeId !== "") {
        try {
          const type = await convex.query(api.interviewerTypes.getById, { 
            id: interviewerTypeId as any 
          });
          if (type) {
            customSystemPrompt = type.systemPrompt;
          }
        } catch (err) {
          console.error("Error fetching interviewer type:", err);
        }
      }
    }

    let resumeText: string | null = null;
    let resumeUrl: string | null = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadPdf = await imagekit.upload({
        file: buffer,
        fileName: "resume" + Date.now().toString() + ".pdf",
        isPublished: true,
      });

      resumeUrl = uploadPdf.url;
    }

    // Generate questions using Config (BYOK if available, else System Default)
    // and custom system prompt if specialized role was selected
    const questions = await generateInterviewQuestions(
      resumeText,
      jobTitle || "",
      jobDescription || "",
      jobExperience || "",
      aiConfig,
      customSystemPrompt
    );

    return NextResponse.json(
      { questions: questions, resumeUrl: resumeUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return NextResponse.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
