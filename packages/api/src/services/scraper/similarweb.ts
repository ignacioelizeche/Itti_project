export interface WebTrafficData {
  domain: string;
  monthlyVisits: number;
  monthlyVisitsLabel: string; // e.g., "150K"
  trafficSource: string; // direct, search, social, referral, paid
  topCountries: Array<{ country: string; percentage: number }>;
  bounceRate: number; // percentage
  pagesPerVisit: number;
  avgVisitDuration: number; // seconds
  rank: number; // global rank
}

export async function scrapeSimilarWeb(domain: string): Promise<WebTrafficData | null> {
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();

  if (!cleanDomain) return null;

  try {
    // SimilarWeb has a free API endpoint for basic data
    const response = await fetch(
      `https://www.similarweb.com/website/${cleanDomain}/`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return await scrapeAlternative(cleanDomain);
    }

    const html = await response.text();

    // Extract traffic data from HTML/JSON
    const trafficMatch = html.match(/"TotalVisits":(\d+)/);
    const bounceMatch = html.match(/"BounceRate":([\d.]+)/);
    const pagesMatch = html.match(/"PagesPerVisit":([\d.]+)/);
    const durationMatch = html.match(/"VisitDuration":([\d.]+)/);
    const rankMatch = html.match(/"GlobalRank":(\d+)/);

    const monthlyVisits = trafficMatch ? parseInt(trafficMatch[1]) : 0;

    return {
      domain: cleanDomain,
      monthlyVisits,
      monthlyVisitsLabel: formatNumber(monthlyVisits),
      trafficSource: "unknown",
      topCountries: [],
      bounceRate: bounceMatch ? parseFloat(bounceMatch[1]) * 100 : 0,
      pagesPerVisit: pagesMatch ? parseFloat(pagesMatch[1]) : 0,
      avgVisitDuration: durationMatch ? parseFloat(durationMatch[1]) : 0,
      rank: rankMatch ? parseInt(rankMatch[1]) : 0,
    };
  } catch (error) {
    console.error(`SimilarWeb scraping failed for ${cleanDomain}:`, error);
    return await scrapeAlternative(cleanDomain);
  }
}

async function scrapeAlternative(domain: string): Promise<WebTrafficData | null> {
  try {
    // Try to get basic info from Google cache or other sources
    const response = await fetch(
      `https://web.archive.org/web/2024/https://${domain}/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
      }
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract meta tags for basic info
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);

    return {
      domain,
      monthlyVisits: 0,
      monthlyVisitsLabel: "N/A",
      trafficSource: "unknown",
      topCountries: [],
      bounceRate: 0,
      pagesPerVisit: 0,
      avgVisitDuration: 0,
      rank: 0,
    };
  } catch {
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return String(num);
}

export function extractDomain(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}
