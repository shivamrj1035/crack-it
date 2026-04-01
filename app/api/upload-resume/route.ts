import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import process from "process";
import { aj } from "@/utils/arcjet";
import { currentUser } from "@clerk/nextjs/server";

var imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("resume") as File;

  const decision = await aj.protect(request, {
    requested: 2,
  }); 

  // @ts-ignore
  if (decision?.reason?.remaining === 0) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        reason: decision.reason,
      },
      { status: 429 }
    );
  }

  if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadPdf = await imagekit.upload({
      file: buffer,
      fileName: "resume_" + Date.now().toString() + ".pdf",
      isPublished: true,
    });

    return NextResponse.json({ resumeUrl: uploadPdf.url }, { status: 200 });
  } catch (error) {
    console.error("Error uploading resume:", error);
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
  }
}
