import { ChatOpenAI } from "@langchain/openai";

export type LLMProvider = {
  model: string;
  apiKey: string;
  baseURL: string;
};

export function getPrimaryProvider(): LLMProvider | null {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || ""; // can be an OpenRouter model name (e.g., google/gemini-1.5-pro)
  const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  if (!apiKey || !model) return null;
  return { apiKey, model, baseURL };
}

export function getFallbackProvider(): LLMProvider | null {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_FALBACK_MODEL || process.env.OPENAI_FALLBACK_MODEL || "";
  const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  if (!apiKey || !model) return null;
  return { apiKey, model, baseURL };
}

export function buildChatModel(provider: LLMProvider, temperature = 0): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: provider.apiKey,
    modelName: provider.model,
    temperature,
    configuration: {
      baseURL: provider.baseURL,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ProfeVision",
      },
    },
  });
}

export interface CallOptions {
  temperature?: number;
  signal?: AbortSignal;
}

export async function withFallback<T>(fn: () => Promise<T>, fallback: (() => Promise<T>) | null): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!fallback) throw e;
    return await fallback();
  }
}
