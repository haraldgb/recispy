import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export type CleanedArticle = {
  title: string | null;
  text: string;
  imageUrl: string | null;
};

export function cleanHtml(html: string, url: string): CleanedArticle {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) return { title: null, text: '', imageUrl: null };
  const text = (article.textContent ?? '').replace(/\s+/g, ' ').trim();
  return {
    title: article.title ?? null,
    text,
    imageUrl: extractFirstImage(dom.window.document),
  };
}

function extractFirstImage(doc: Document): string | null {
  const og = doc.querySelector('meta[property="og:image"]');
  if (og) {
    const content = og.getAttribute('content');
    if (content) return content;
  }
  const img = doc.querySelector('article img, main img, img');
  return img?.getAttribute('src') ?? null;
}
