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

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const formData = await request.formData();
  const file = formData.get("resume") as File;
  const jobTitle = formData.get("jobTitle") as string | null;
  const jobDescription = formData.get("jobDescription") as string | null;
  const jobExperience = formData.get("jobExperience") as string | null;

  const decision = await aj.protect(request, {
    requested: 5,
  }); // Deduct 5 tokens from the bucket

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
    let resumeText: string | null = null;
    let resumeUrl: string | null = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload the file to ImageKit
      const uploadPdf = await imagekit.upload({
        file: buffer,
        fileName: "resume" + Date.now().toString() + ".pdf",
        isPublished: true,
      });

      resumeUrl = uploadPdf.url;

      // Try to extract text from PDF if possible
      // Note: For complex PDFs, we'll use the URL-based approach
      // The LLM will generate questions based on job details
      // In production, you might want to use a PDF parsing service
    }

    // Generate questions using Groq AI (Llama 3.1)
    const questions = await generateInterviewQuestions(
      resumeText,
      jobTitle || "",
      jobDescription || "",
      jobExperience || ""
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
