import * as cheerio from "cheerio";
import { config } from "../../config.js";
import { RateLimiter } from "../../utils/rate-limiter.js";
import { BROWSER_USER_AGENT } from "../../utils/consts.js";
import { extractSocialLinks } from "../../utils/social.js";

const limiter = new RateLimiter(config.scraper.directoryRateLimitMs);

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

export async function scrapeWebsite(url: string): Promise<WebData | null> {
  try {
    await limiter.wait();

    const response = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
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
    const allLinks = $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="tiktok.com"]')
      .map((_, el) => $(el).attr("href") || "")
      .get()
      .join(" ");
    const socialLinks = extractSocialLinks(allLinks);

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
