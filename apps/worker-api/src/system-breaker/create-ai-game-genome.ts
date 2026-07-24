import { createGameGenomeThemeContext } from './create-game-genome-theme-context';
import { GAME_GENOME_THEME_JSON_SCHEMA } from './game-genome-schema';

export interface GenerateDraftInput {
  prompt: string;
  seed: string;
}

interface WorkersAi {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface SystemBreakerBindings {
  AI: WorkersAi;
}

export type GenerateDraft = (
  input: GenerateDraftInput,
  bindings?: SystemBreakerBindings,
) => Promise<unknown>;

const SYSTEM_PROMPT =
  '你是 SYSTEM BREAKER 世界文案設計器。只輸出符合 JSON schema 的繁體中文主題文案，不要 Markdown、程式碼、公式或 schema 之外的欄位。既定 mechanics 只供文案依陣列索引對齊，不可回傳或改寫。';

export const createAiGameGenome: GenerateDraft = async (input, bindings) => {
  if (!bindings?.AI) throw new Error('AI_BINDING_UNAVAILABLE');
  const output = await bindings.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `世界概念：${input.prompt}\n既定 mechanics：\n${createGameGenomeThemeContext(input)}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: GAME_GENOME_THEME_JSON_SCHEMA,
    },
    max_tokens: 1600,
  });
  const response =
    output && typeof output === 'object' && 'response' in output
      ? (output as { response: unknown }).response
      : output;
  return typeof response === 'string' ? JSON.parse(response) : response;
};
