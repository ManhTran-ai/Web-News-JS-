import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Article } from '../types/article.js';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = resolve(serverRoot, 'data');
const snapshotPath = resolve(dataDir, 'snapshot.json');

export async function writeSnapshot(articles: Article[]): Promise<void> {
  try {
    await mkdir(dataDir, { recursive: true });
    const payload = JSON.stringify({ savedAt: new Date().toISOString(), articles }, null, 2);
    const tempPath = `${snapshotPath}.tmp`;
    await writeFile(tempPath, payload, 'utf8');
    await rename(tempPath, snapshotPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[snapshot] Không ghi được snapshot: ${message}`);
  }
}

export async function readSnapshot(): Promise<Article[]> {
  try {
    const raw = await readFile(snapshotPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('articles' in parsed)) return [];
    const articles = (parsed as { articles: unknown }).articles;
    if (!Array.isArray(articles)) return [];
    return articles as Article[];
  } catch {
    return [];
  }
}
