export function cleanText(input: string): string {
  if (!input) return "";
  // Normalize whitespace and common artifacts
  let text = input.replace(/\r\n?|\n/g, "\n");
  // Collapse multiple blank lines to a single blank line
  text = text.replace(/\n{3,}/g, "\n\n");
  // Replace multiple spaces with a single space (but keep newlines)
  text = text.replace(/[\t ]{2,}/g, " ");
  // Trim surrounding whitespace
  text = text.trim();
  return text;
}
