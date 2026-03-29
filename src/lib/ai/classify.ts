import { getOpenAI } from "./openai";
import type { AiClassificationResult } from "@/types/note";

const SYSTEM_PROMPT = `You are a content classification and extraction assistant.

1. Determine the content type: link, text, video, image, or recipe.
2. Extract structured metadata specific to that type.
3. Generate a concise summary (2-3 sentences).
4. Suggest relevant tags (3-8).
5. Suggest 1-3 categories from this list: Technologie, Vaření, Vzdělávání, Cestování, Zdraví, Finance, Zábava, Práce.

Return JSON:
{
  "content_type": string,
  "title": string,
  "summary": string,
  "structured_data": object,
  "suggested_tags": string[],
  "suggested_categories": string[],
  "language": string (ISO 639-1)
}

Rules:
- Keep the original language of the content. Do not translate.
- For recipes: extract ingredients with amounts/units, step-by-step instructions.
- For links/articles: extract key points, author, read time.
- For videos: extract key points, duration, channel.
- Return ONLY valid JSON.`;

export async function classifyContent(input: {
  title: string;
  rawContent: string | null;
  sourceUrl: string | null;
  fetchedHtml: string | null;
}): Promise<AiClassificationResult> {
  const openai = getOpenAI();

  let userMessage = "";
  if (input.sourceUrl) {
    userMessage += `URL: ${input.sourceUrl}\n\n`;
  }
  if (input.title) {
    userMessage += `Title: ${input.title}\n\n`;
  }
  if (input.fetchedHtml) {
    const truncated = input.fetchedHtml.slice(0, 15000);
    userMessage += `Page content:\n${truncated}\n\n`;
  }
  if (input.rawContent) {
    const truncated = input.rawContent.slice(0, 15000);
    userMessage += `User content:\n${truncated}\n\n`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(text) as AiClassificationResult;

  if (!parsed.content_type || !parsed.title || !parsed.summary) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
}
