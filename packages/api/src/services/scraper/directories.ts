import * as cheerio from "cheerio";
import { RateLimiter } from "../../utils/rate-limiter.js";
import { BROWSER_USER_AGENT } from "../../utils/consts.js";

interface DirectoryResult {
  name: string;
  address: string;
  phone?: string;
  category?: string;
  website?: string;
  source: string;
}

const limiter = new RateLimiter(2000);

const ASUNCION_COORDS = {
  latitude: -25.2637,
  longitude: -57.5759,
};

export async function scrapePaginasAmarillas(
  category: string,
  page: number = 1
): Promise<DirectoryResult[]> {
  const results: DirectoryResult[] = [];

  try {
    const searchUrl = `https://www.paginasamarillas.com.py/buscar/${encodeURIComponent(category)}?page=${page}`;
    await limiter.wait();

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PY,es;q=0.9",
      },
    });

    if (!response.ok) return results;

    const html = await response.text();
    const $ = cheerio.load(html);

    $(".business-card, .listing-item, .result-item").each((_, el) => {
      const name = $(el).find(".business-name, h2, h3").first().text().trim();
      const address = $(el).find(".address, .location").first().text().trim();
      const phone = $(el).find(".phone, .telefono").first().text().trim();
      const website = $(el).find("a[href*='http']").first().attr("href");

      if (name) {
        results.push({
          name,
          address,
          phone: phone || undefined,
          category,
          website,
          source: "paginas_amarillas",
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping Paginas Amarillas for "${category}":`, error);
  }

  return results;
}

export async function scrapeGuiaCommercial(
  category: string
): Promise<DirectoryResult[]> {
  const results: DirectoryResult[] = [];

  try {
    const searchUrl = `https://www.guiacomercial.com.py/buscar?q=${encodeURIComponent(category)}`;
    await limiter.wait();

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PY,es;q=0.9",
      },
    });

    if (!response.ok) return results;

    const html = await response.text();
    const $ = cheerio.load(html);

    $(".company-card, .result, .listing").each((_, el) => {
      const name = $(el).find(".company-name, h2, h3").first().text().trim();
      const address = $(el).find(".address, .location").first().text().trim();
      const phone = $(el).find(".phone").first().text().trim();
      const website = $(el).find("a[href*='http']").first().attr("href");

      if (name) {
        results.push({
          name,
          address,
          phone: phone || undefined,
          category,
          website,
          source: "guia_commercial",
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping Guía Commercial for "${category}":`, error);
  }

  return results;
}

export { ASUNCION_COORDS };
