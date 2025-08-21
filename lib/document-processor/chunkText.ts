export function chunkText(input: string, maxChars = 12000, overlap = 200): string[] {
  if (!input) return [];
  const text = input;
  const chunks: string[] = [];
  let start = 0;

  const len = text.length;
  while (start < len) {
    let end = Math.min(start + maxChars, len);

    // Try to break on paragraph boundary
    if (end < len) {
      const lastNewline = text.lastIndexOf("\n\n", end - 1);
      if (lastNewline > start + 200) {
        end = lastNewline;
      }
    }

    chunks.push(text.slice(start, end).trim());
    if (end === len) break;
    start = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
}
