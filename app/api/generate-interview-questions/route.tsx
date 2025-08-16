import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import process from "process";
import axios from "axios";
import { aj } from "@/utils/arcjet";
import { currentUser } from "@clerk/nextjs/server";

var imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const formData = await request.formData();
  const file = formData.get("resume") as File;
  const jobTitle = formData.get("jobTitle") as File;
  const jobDescription = formData.get("jobDescription") as File;
  const jobExperience = formData.get("jobExperience") as File;

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

  // Upload the file to ImageKit
  try {
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadPdf = await imagekit.upload({
        file: buffer, // File object
        fileName: "resume" + Date.now().toString() + ".pdf", // Name of the file
        isPublished: true,
      });

      const result = await axios.post(
        "https://n8n.srv960131.hstgr.cloud/webhook/generate-interview-questions",
        {
          resumeUrl: uploadPdf.url,
        }
      );
      // Step 1: Extract raw string JSON
      const responseText = result.data?.content?.parts?.[0]?.text;

      // Step 2: Parse string into object
      let parsed;
      try {
        parsed = JSON.parse(responseText); // { questions: [ ... ] }
      } catch (err) {
        console.error("Failed to parse responseText", err, responseText);
        return NextResponse.json(
          { error: "Invalid response from model" },
          { status: 500 }
        );
      }

      // Step 3: Extract only questions
      const questions = (parsed.questions || []).map((item: any) => ({
        question: item.question || "",
        answer: item.answer || "",
      }));

      // Step 4: Return clean JSON
      return NextResponse.json(
        { questions: questions, resumeUrl: uploadPdf.url }, // 👈 only what you want
        { status: 200 }
      );
    } else {
      const result = await axios.post(
        "https://n8n.srv960131.hstgr.cloud/webhook/generate-interview-questions",
        {
          resumeUrl: null,
          jobTitle: jobTitle || "",
          jobDescription: jobDescription || "",
          jobExperience: jobExperience || "",
        }
      );
      // Step 1: Extract raw string JSON
      const responseText = result.data?.content?.parts?.[0]?.text;

      // Step 2: Parse string into object
      let parsed;
      try {
        parsed = JSON.parse(responseText); // { questions: [ ... ] }
      } catch (err) {
        console.error("Failed to parse responseText", err, responseText);
        return NextResponse.json(
          { error: "Invalid response from model" },
          { status: 500 }
        );
      }

      // Step 3: Extract only questions
      const questions = (parsed.questions || []).map((item: any) => ({
        question: item.question || "",
        answer: item.answer || "",
      }));
      return NextResponse.json(
        {
          questions: questions,
          resumeUrl: null,
        },
        {
          status: 200,
        }
      );
    }
  } catch (error) {
    console.log("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}
