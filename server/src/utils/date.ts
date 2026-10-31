export function parseDate(value: string | undefined | null): string | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  if (year < 2000 || year > 2100) return null;

  return parsed.toISOString();
}

export function isValidIsoDate(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}
