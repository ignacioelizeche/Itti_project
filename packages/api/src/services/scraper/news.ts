import { RateLimiter } from "../../utils/rate-limiter.js";

interface NewsResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
}

const limiter = new RateLimiter(2000);

export async function searchNews(
  query: string,
  maxResults: number = 10
): Promise<NewsResult[]> {
  const results: NewsResult[] = [];

  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + " Paraguay")}&tbm=nws&num=${maxResults}&hl=es`;
    await limiter.wait();

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PY,es;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return results;

    const html = await response.text();

    // Simple regex-based extraction from Google News results
    const titleRegex = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
    const snippetRegex = /<span[^>]*class="[^"]*st[^"]*"[^>]*>([\s\S]*?)<\/span>/g;

    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      if (title && title.length > 10) {
        results.push({
          title,
          snippet: "",
          url: "",
          source: "google_news",
        });
      }
    }

    // Limit results
    return results.slice(0, maxResults);
  } catch (error) {
    console.error(`Error searching news for "${query}":`, error);
  }

  return results;
}
