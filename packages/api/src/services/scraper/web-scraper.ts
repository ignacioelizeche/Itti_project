import * as cheerio from "cheerio";
import { RateLimiter } from "../../utils/rate-limiter.js";

interface WebData {
  description?: string;
  services?: string[];
  targetAudience?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
  emails: string[];
  phoneNumbers: string[];
}

const limiter = new RateLimiter(2000);

export async function scrapeWebsite(url: string): Promise<WebData | null> {
  try {
    await limiter.wait();

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PY,es;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract meta description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $("title").text().trim() ||
      undefined;

    // Extract social links
    const socialLinks: WebData["socialLinks"] = {};
    const socialPatterns: Record<string, RegExp> = {
      instagram: /instagram\.com\/([^/?#]+)/,
      facebook: /facebook\.com\/([^/?#]+)/,
      twitter: /(?:twitter|x)\.com\/([^/?#]+)/,
      tiktok: /tiktok\.com\/@([^/?#]+)/,
    };

    $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="tiktok.com"]').each(
      (_, el) => {
        const href = $(el).attr("href") || "";
        for (const [platform, pattern] of Object.entries(socialPatterns)) {
          const match = href.match(pattern);
          if (match) {
            socialLinks[platform as keyof typeof socialLinks] = match[1];
          }
        }
      }
    );

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = $.text();
    const emails = [...new Set(bodyText.match(emailRegex) || [])];

    // Extract phone numbers (Paraguay format)
    const phoneRegex = /(?:\+?595|0)(?:21|9[6-9]\d{2})\d{6}/g;
    const phoneNumbers = [...new Set(bodyText.match(phoneRegex) || [])];

    // Try to extract services from common sections
    const services: string[] = [];
    $("h2, h3, h4").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 50 && text.length > 2) {
        services.push(text);
      }
    });

    return {
      description,
      services: services.slice(0, 10),
      socialLinks,
      emails: emails.slice(0, 5),
      phoneNumbers: phoneNumbers.slice(0, 3),
    };
  } catch (error) {
    console.error(`Error scraping website ${url}:`, error);
    return null;
  }
}
