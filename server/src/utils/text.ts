import sanitizeHtml from 'sanitize-html';
import { decode } from 'html-entities';

export function stripHtml(input: string): string {
  const text = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return decode(text).replace(/\s+/g, ' ').trim();
}

export function toSearchText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength).trimEnd()}…`;
}
