import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export interface WebTrafficData {
  domain: string;
  dailyVisitors: number;
  monthlyVisits: number;
  monthlyVisitsLabel: string;
  estimatedValue: number;
  bounceRate: number;
  pagesPerVisit: number;
  avgVisitDuration: number;
  rank: number;
  source: string;
  title?: string;
  description?: string;
  hasEshop?: boolean;
  hasContact?: boolean;
  hasWhatsApp?: boolean;
  socialLinks?: string[];
  language?: string;
}

export async function scrapeSimilarWeb(domain: string): Promise<WebTrafficData | null> {
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();

  if (!cleanDomain) return null;

  const urls = [
    `https://${cleanDomain}`,
    `https://www.${cleanDomain}`,
    `http://${cleanDomain}`,
    `http://www.${cleanDomain}`,
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-PY,es;q=0.9,en;q=0.8",
        },
        timeout: 8000,
        maxRedirects: 5,
        httpsAgent,
      });

      if (response.status !== 200) continue;

      const $ = cheerio.load(response.data);
      const bodyText = $("body").text();
      const html = response.data;

      const title = $("title").text().trim().slice(0, 200);
      const description =
        $('meta[name="description"]').attr("content")?.trim().slice(0, 300) || "";
      const language =
        $("html").attr("lang") ||
        (/[áéíóúñ]/i.test(bodyText) ? "es" : "en");

      const hasEshop =
        /tienda|shop|carrito|cart|comprar|checkout|producto/i.test(html);
      const hasContact =
        /contacto|telefono|teléfono|whatsapp|email|correo/i.test(html);
      const hasWhatsApp =
        /wa\.me|api\.whatsapp\.com|whatsapp/i.test(html);

      const socialLinks: string[] = [];
      $('a[href*="instagram.com"]').each((_, el) => {
        const href = $(el).attr("href");
        if (href && !socialLinks.includes("instagram")) socialLinks.push("instagram");
      });
      $('a[href*="facebook.com"]').each((_, el) => {
        const href = $(el).attr("href");
        if (href && !socialLinks.includes("facebook")) socialLinks.push("facebook");
      });
      $('a[href*="tiktok.com"]').each((_, el) => {
        if (!socialLinks.includes("tiktok")) socialLinks.push("tiktok");
      });
      $('a[href*="twitter.com"], a[href*="x.com"]').each((_, el) => {
        if (!socialLinks.includes("twitter")) socialLinks.push("twitter");
      });

      const links = $("a[href]").length;
      const images = $("img").length;

      const qualityScore = calculateQualityScore({
        title,
        description,
        hasEshop,
        hasContact,
        hasWhatsApp,
        socialLinksCount: socialLinks.length,
        links,
        images,
        bodyTextLength: bodyText.length,
      });

      return {
        domain: cleanDomain,
        dailyVisitors: 0,
        monthlyVisits: 0,
        monthlyVisitsLabel: "N/A",
        estimatedValue: 0,
        bounceRate: 0,
        pagesPerVisit: 0,
        avgVisitDuration: 0,
        rank: 0,
        source: "direct-scraper",
        title,
        description,
        hasEshop,
        hasContact,
        hasWhatsApp,
        socialLinks,
        language,
        qualityScore,
      } as WebTrafficData & { qualityScore: number };
    } catch {
      continue;
    }
  }

  return null;
}

function calculateQualityScore(data: {
  title: string;
  description: string;
  hasEshop: boolean;
  hasContact: boolean;
  hasWhatsApp: boolean;
  socialLinksCount: number;
  links: number;
  images: number;
  bodyTextLength: number;
}): number {
  let score = 0;
  if (data.title && data.title.length > 5) score += 15;
  if (data.description && data.description.length > 20) score += 15;
  if (data.hasEshop) score += 15;
  if (data.hasContact) score += 10;
  if (data.hasWhatsApp) score += 10;
  if (data.socialLinksCount > 0) score += 10;
  if (data.socialLinksCount > 2) score += 5;
  if (data.links > 10) score += 5;
  if (data.images > 3) score += 5;
  if (data.bodyTextLength > 1000) score += 10;
  if (data.bodyTextLength > 5000) score += 5;
  return Math.min(score, 100);
}

export function extractDomain(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}
