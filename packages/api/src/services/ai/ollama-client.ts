import { config } from "../../config.js";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${config.ollama.url}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.embedModel,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${response.status}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const results: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    results.push(embedding);
  }

  return results;
}

export async function chatWithOllama(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await fetch(`${config.ollama.url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollama.chatModel,
      prompt,
      system: systemPrompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat error: ${response.status}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}
