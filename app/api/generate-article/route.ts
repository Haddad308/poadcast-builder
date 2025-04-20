import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const articleSchema = z.object({
  content: z.string(),
});

export async function POST(req: Request) {
  try {
    const { transcriptionText } = await req.json();
    if (!transcriptionText) {
      return new Response(
        JSON.stringify({
          error: "Transcription text is required.",
        }),
        { status: 400 }
      );
    }

    const result = await generateObject({
      temperature: 0.7,
      model: google("gemini-2.0-flash-exp"),
      system:
        "You are a professional content writer. Based on the transcript, create a structured article with a title, and multiple headings each followed by a paragraph.",
      schema: articleSchema,
      messages: [
        {
          role: "user",
          content: `Generate a well-structured article based on this transcript: "${transcriptionText.substring(
            0,
            4000
          )}"`,
        },
      ],
    });
    return result.toJsonResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Failed to process request: ${
          error instanceof Error ? error.message : "Invalid JSON payload"
        }`,
      }),
      { status: 400 }
    );
  }
}
