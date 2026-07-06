/**
 * Convert email HTML into readable plain text for the assistant context.
 *
 * Many emails (marketing/notification templates like Amazon Jobs) ship HTML
 * only, with no text/plain MIME part — so `bodyText` is empty and the assistant
 * would otherwise see just the subject. This strips markup, drops script/style
 * content, turns block boundaries into newlines, and decodes common entities.
 *
 * Pure string operations only: no DOM, so it runs identically on the client
 * (where the assistant context is built) and the server.
 */
const BLOCK_CLOSE_TAG =
  /<\/(p|div|h[1-6]|li|ul|ol|tr|table|blockquote|section|article|header|footer)\s*>/gi;

export function htmlToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  return (
    html
      // Remove <script>/<style> blocks along with their contents.
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      // Preserve line structure from <br> and block-level closings.
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(BLOCK_CLOSE_TAG, "\n")
      // Strip every remaining tag.
      .replace(/<[^>]+>/g, "")
      // Decode entities. &amp; is decoded LAST to avoid double-decoding.
      .replace(/&nbsp;/gi, " ")
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, "&")
      // Tidy whitespace: collapse runs of spaces and excess blank lines.
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
