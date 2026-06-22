import { createOpenAI } from "@ai-sdk/openai";

const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";
const VERCEL_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export function createDedalusClient(apiKey: string) {
  return createOpenAI({ baseURL: DEDALUS_BASE_URL, apiKey });
}

export function createVercelGatewayClient(apiKey: string) {
  return createOpenAI({ baseURL: VERCEL_GATEWAY_BASE_URL, apiKey });
}
