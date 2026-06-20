import Groq from "groq-sdk";
import { config } from "../../config.js";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: config.groq.apiKey });
  }
  return client;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: options.model || "llama-3.3-70b-versatile",
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2048,
    ...(options.responseFormat && { response_format: options.responseFormat }),
  });

  return response.choices[0]?.message?.content || "";
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

  return JSON.parse(response) as T;
}
