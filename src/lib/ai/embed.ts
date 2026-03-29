import { getOpenAI } from "./openai";

const MAX_INPUT_LENGTH = 30000;

export async function generateEmbedding(input: {
  title: string;
  summary: string;
  content: string | null;
}): Promise<number[]> {
  const openai = getOpenAI();

  let text = `${input.title} ${input.summary}`;
  if (input.content) {
    text += ` ${input.content}`;
  }

  if (text.length > MAX_INPUT_LENGTH) {
    text = text.slice(0, MAX_INPUT_LENGTH);
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
