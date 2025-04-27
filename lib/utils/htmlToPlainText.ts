/**
 * Converts HTML content to plain text by removing all HTML tags
 * This is used for components that don't support HTML rendering
 * such as the @react-pdf/renderer components
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  // Create a new element
  if (typeof document !== "undefined") {
    // Client-side: use DOM
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  } else {
    // Server-side: use regex (less reliable but works in SSR)
    return html
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with spaces
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'"); // Replace &#39; with '
  }
}
