import { ApiError } from '../errors.js';
import { fetchHtml } from './fetch.js';
import { cleanHtml } from './readability.js';
import { callExtractionModel, createAnthropicClient, type AnthropicLike } from './anthropic.js';
import { recipePayloadSchema, type RecipePayload } from '../recipes/types.js';

let cachedClient: AnthropicLike | null = null;
function getClient(): AnthropicLike {
  if (!cachedClient) cachedClient = createAnthropicClient();
  return cachedClient;
}
export function setAnthropicClientForTests(client: AnthropicLike | null): void {
  cachedClient = client;
}

export type ExtractInput = { url?: string; text?: string };

export async function extractRecipe(input: ExtractInput): Promise<RecipePayload> {
  let articleText: string;
  let sourceUrl: string | null = null;
  let imageUrl: string | null = null;

  if (input.url) {
    sourceUrl = input.url;
    const html = await fetchHtml(input.url);
    const cleaned = cleanHtml(html, input.url);
    articleText = cleaned.text;
    imageUrl = cleaned.imageUrl;
    if (!articleText) {
      throw new ApiError(422, 'fetch_failed', 'Could not extract article text from URL');
    }
  } else if (input.text) {
    articleText = input.text;
  } else {
    throw new ApiError(400, 'invalid_input', 'url or text required');
  }

  let raw: unknown;
  try {
    raw = await callExtractionModel(getClient(), articleText, sourceUrl);
  } catch (e) {
    throw new ApiError(422, 'extraction_invalid', `Model call failed: ${(e as Error).message}`);
  }

  const merged = {
    ...(raw as object),
    image_url: (raw as any).image_url ?? imageUrl ?? null,
    source_url: sourceUrl,
  };

  const result = recipePayloadSchema.safeParse(merged);
  if (!result.success) {
    throw new ApiError(422, 'extraction_invalid', `Model output invalid: ${result.error.message}`);
  }
  return result.data;
}
