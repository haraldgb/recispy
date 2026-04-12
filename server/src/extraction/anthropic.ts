import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env.js';
import { SAVE_RECIPE_TOOL } from './schema.js';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt.js';

export type AnthropicLike = {
  messages: {
    create: (args: any) => Promise<any>;
  };
};

export function createAnthropicClient(): AnthropicLike {
  return new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
}

export async function callExtractionModel(
  client: AnthropicLike,
  text: string,
  sourceUrl: string | null,
): Promise<unknown> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [SAVE_RECIPE_TOOL],
    tool_choice: { type: 'tool', name: SAVE_RECIPE_TOOL.name },
    messages: [{ role: 'user', content: buildUserMessage(text, sourceUrl) }],
  });
  const toolUse = (response.content ?? []).find((c: any) => c.type === 'tool_use');
  if (!toolUse) throw new Error('Model did not return a tool use');
  return toolUse.input;
}
