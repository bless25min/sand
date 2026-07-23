import { GAME_GENOME_JSON_SCHEMA } from './game-genome-schema';

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

const SYSTEM_PROMPT = `你是 SYSTEM BREAKER 世界設計器。將主題轉成一個七回合、可驗證的系統。
只輸出符合 JSON schema 的資料，不輸出 Markdown、程式碼或公式。
只能使用 schema 內的 trigger、effect、role、target、rule、modifier ID。
12 個模組角色數固定為 PRODUCER 3、AMPLIFIER 2、STABILIZER 2、DEFENSE 3、CONVERTER 2。
第 7 個 threat 必須是 BOSS，modifier 為 LOCK_TOP_OUTPUT，phaseTwoModifier 為
REVERSE_HORIZONTAL 或 PUNISH_REPEAT。所有顯示文字使用繁體中文。`;

export const createAiGameGenome: GenerateDraft = async (input, bindings) => {
  if (!bindings?.AI) throw new Error('AI_BINDING_UNAVAILABLE');
  const output = await bindings.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `主題：${input.prompt}\n固定 seed：${input.seed}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: GAME_GENOME_JSON_SCHEMA,
    },
    max_tokens: 2200,
  });
  const response =
    output && typeof output === 'object' && 'response' in output
      ? (output as { response: unknown }).response
      : output;
  return typeof response === 'string' ? JSON.parse(response) : response;
};
