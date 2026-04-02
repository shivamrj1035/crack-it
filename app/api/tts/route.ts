import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { currentUser } from "@clerk/nextjs/server";
import process from "process";
import { aj } from "@/utils/arcjet";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decision = await aj.protect(request, { requested: 1 }); 
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { text, organizationId } = await request.json();

    if (!text || !organizationId) {
      return new NextResponse("Missing text or organizationId", { status: 400 });
    }

    // Fetch the BYOK key specifically for OpenAI
    const openAiKeyObj = await convex.query(api.aiProviders.getProviderKey, { 
      // @ts-ignore
      organizationId: organizationId,
      provider: "openai"
    });

    if (!openAiKeyObj || !openAiKeyObj.apiKey) {
      // 404 indicates to the frontend to fallback to browser TTS
      return new NextResponse("No OpenAI key found for this organization", { status: 404 });
    }

    // Use baseUrl if provided for custom endpoints, otherwise default to OpenAI
    const endpoint = openAiKeyObj.baseUrl || "https://api.openai.com/v1/audio/speech";

    // Call OpenAI TTS API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKeyObj.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "alloy", // Natural conversational voice
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI TTS Error:", errorData);
        return new NextResponse("Failed to generate audio from OpenAI", { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (error) {
    console.error("TTS API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
