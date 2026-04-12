import { describe, it, expect } from 'vitest';
import { cleanHtml } from '../src/extraction/readability.js';

describe('cleanHtml', () => {
  it('extracts the article text from a simple page', () => {
    const html = `
      <html><head><title>Pasta</title></head>
      <body>
        <nav>Home About</nav>
        <article>
          <h1>Pasta Recipe</h1>
          <p>Boil water. Add salt. Cook the pasta for 9 minutes.</p>
          <p>Serve immediately with olive oil.</p>
        </article>
        <footer>Copyright</footer>
      </body></html>`;
    const result = cleanHtml(html, 'https://example.com/pasta');
    expect(result.title).toContain('Pasta');
    expect(result.text).toContain('Boil water');
    expect(result.text).toContain('Cook the pasta');
    expect(result.text).not.toContain('Copyright');
  });

  it('returns null text on empty input', () => {
    const result = cleanHtml('<html><body></body></html>', 'https://x');
    expect(result.text).toBe('');
  });
});
