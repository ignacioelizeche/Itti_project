import { ApifyClient } from "apify-client";
import { cleanFacebook, extractFacebookFromHtml } from "../../utils/social.js";

export interface FacebookData {
  pageId: string;
  name: string;
  followers: number;
  likes: number;
  rating: string;
  reviewCount: number;
  category: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
}

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (client) return client;
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not configured");
  client = new ApifyClient({ token });
  return client;
}

export async function scrapeFacebookPages(
  urls: string[]
): Promise<FacebookData[]> {
  if (urls.length === 0) return [];

  const apify = getClient();
  const run = await apify.actor("apify~facebook-pages-scraper").call({
    startUrls: urls.map((url) => ({ url })),
  });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  return items.map((item: any) => ({
    pageId: item.id || item.url || "",
    name: item.name || "",
    followers: item.followers || 0,
    likes: item.likes || 0,
    rating: item.rating || "",
    reviewCount: item.reviewCount || 0,
    category: item.category || "",
    description: item.about || "",
    website: item.website || "",
    phone: item.phone || "",
    email: item.email || "",
    address: item.address || "",
    hours: item.hours || "",
  }));
}

export async function scrapeFacebookByName(
  companyName: string,
  facebookHandle?: string
): Promise<FacebookData | null> {
  if (!facebookHandle) return null;

  const url = facebookHandle.startsWith("http")
    ? facebookHandle
    : `https://www.facebook.com/${facebookHandle.replace(/^\/+/, "")}/`;

  const results = await scrapeFacebookPages([url]);
  return results.length > 0 ? results[0] : null;
}

export { extractFacebookFromHtml as extractFacebookUrl, cleanFacebook };
