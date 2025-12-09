/**
 * Formatting utilities for chat panel
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function mdToHtmlLite(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let inCode = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        out.push('<pre><code>');
        inCode = true;
      } else {
        out.push('</code></pre>');
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)/);
    if (h3) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h3>${escapeHtml(h3[1])}</h3>`);
      continue;
    }

    const h2 = line.match(/^##\s+(.*)/);
    if (h2) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h2>${escapeHtml(h2[1])}</h2>`);
      continue;
    }

    const h1 = line.match(/^#\s+(.*)/);
    if (h1) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<h1>${escapeHtml(h1[1])}</h1>`);
      continue;
    }

    // List items
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (li) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      const txt = escapeHtml(li[1])
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      out.push(`<li>${txt}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      out.push('</ul>');
      inList = false;
      continue;
    }

    // Paragraph
    if (line.trim() === '') {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push('');
      continue;
    }

    const txt = escapeHtml(line)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    out.push(`<p>${txt}</p>`);
  }

  if (inList) out.push('</ul>');
  if (inCode) out.push('</code></pre>');

  return out.join('\n');
}

export function formatFileName(name: string, maxLen = 22): string {
  if (!name) return name;
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) {
    return name.length > maxLen ? name.slice(0, maxLen - 1) + "…" : name;
  }
  const base = name.slice(0, lastDot);
  const ext = name.slice(lastDot);
  const budget = Math.max(6, maxLen - ext.length);
  const baseTrunc = base.length > budget ? base.slice(0, budget - 1) + "…" : base;
  return baseTrunc + ext;
}
