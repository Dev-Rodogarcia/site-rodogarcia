export function sanitizeText(value, maxLength = 500) {
  const text = typeof value === 'string' ? value : '';
  return text
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  const input = value.trim();
  if (!input) return '';

  if (input.startsWith('/')) return input.slice(0, 300);
  if (input.startsWith('#')) return input.slice(0, 100);

  try {
    const parsed = new URL(input);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 400);
    }
  } catch {
    return '';
  }

  return '';
}

export function toBoolean(value) {
  return Boolean(value);
}
