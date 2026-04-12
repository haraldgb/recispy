import { ApiError } from '../errors.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

export async function fetchHtml(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
  } catch (e) {
    throw new ApiError(422, 'fetch_failed', `Could not fetch URL: ${(e as Error).message}`);
  }
  if (!res.ok) {
    throw new ApiError(422, 'fetch_failed', `URL returned ${res.status}`);
  }
  return await res.text();
}
