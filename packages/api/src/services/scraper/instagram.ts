import { cleanInstagram, extractInstagramFromHtml } from "../../utils/social.js";

export async function extractInstagramUsername(
  website?: string,
  instagram?: string
): Promise<string | null> {
  if (instagram) return cleanInstagram(instagram);

  if (website) {
    try {
      const response = await fetch(website, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const html = await response.text();
        return extractInstagramFromHtml(html);
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}
