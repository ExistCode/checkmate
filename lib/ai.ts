import { bedrock } from "@ai-sdk/amazon-bedrock";
import { config } from "./config";

// Centralized AI model helpers for Bedrock

// Default Bedrock text model id from env (with reasonable default in config)
export const defaultTextModelId = config.BEDROCK_MODEL_ID;

// Factory for the text-generation model used across the app
export function textModel(modelId?: string) {
  return bedrock(modelId || defaultTextModelId);
}

// Optionally expose the provider for advanced cases
export { bedrock };

// Common generation defaults to keep calls consistent
export const DEFAULT_QUERY_MAX_TOKENS = 100;
export const DEFAULT_QUERY_TEMPERATURE = 0.3;

export const DEFAULT_ANALYSIS_MAX_TOKENS = 2000;
export const DEFAULT_ANALYSIS_TEMPERATURE = 0.1;

export const DEFAULT_CLASSIFY_MAX_TOKENS = 100;
export const DEFAULT_CLASSIFY_TEMPERATURE = 0.1;

export const DEFAULT_SCORE_MAX_TOKENS = 10;
export const DEFAULT_SCORE_TEMPERATURE = 0.1;
