export async function extractInstagramUsername(
  website?: string,
  instagram?: string
): Promise<string | null> {
  // If Instagram username is already provided
  if (instagram) {
    return instagram.replace("@", "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").split("/")[0];
  }

  // Try to find Instagram link from website
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
        const instagramMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (instagramMatch) return instagramMatch[1];
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}
