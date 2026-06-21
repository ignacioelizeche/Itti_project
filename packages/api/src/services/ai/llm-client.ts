import { config } from "../../config.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ollamaRequestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < maxRetries - 1) {
        const waitMs = 3000 + attempt * 5000;
        console.log(`[LLM] Error: ${error.message?.substring(0, 100)}, retrying in ${waitMs}ms (${attempt + 1}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

function extractJSON(text: string): string {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return cleaned;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "json_object" };
  } = {}
): Promise<string> {
  const model = options.model || config.ollama.chatModel;

  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsg = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n\n");

  const response = await ollamaRequestWithRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    try {
      const res = await fetch(`${config.ollama.url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          system: options.responseFormat
            ? `${systemMsg}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no code fences.`
            : systemMsg,
          prompt: userMsg,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.3,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}`);
      }

      return await res.json() as Promise<{ response: string }>;
    } finally {
      clearTimeout(timeout);
    }
  });

  return response.response || "";
}

export async function chatCompletionJSON<T>(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<T> {
  const response = await chatCompletion(messages, {
    ...options,
    responseFormat: { type: "json_object" },
  });

  const cleaned = extractJSON(response);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON: ${cleaned.substring(0, 300)}`);
  }
}
