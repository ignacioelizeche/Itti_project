export interface FacebookData {
  pageId: string;
  name: string;
  followers: number;
  likes: number;
  rating: number;
  reviewCount: number;
  areLikesEnabled: boolean;
  isVerified: boolean;
  category: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
}

export async function scrapeFacebook(pageName: string): Promise<FacebookData | null> {
  const cleanName = pageName
    .replace(/^https?:\/\/(www\.)?facebook\.com\//, "")
    .split("?")[0]
    .split("/")[0]
    .trim();

  if (!cleanName) return null;

  try {
    // Facebook's mobile page is more scrape-friendly
    const response = await fetch(`https://www.facebook.com/${cleanName}/about`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract data from meta tags and JSON-LD
    const followersMatch = html.match(/"followersCount":(\d+)/);
    const likesMatch = html.match(/"likesCount":(\d+)/);
    const ratingMatch = html.match(/"ratingValue":([\d.]+)/);
    const reviewMatch = html.match(/"reviewCount":(\d+)/);
    const nameMatch = html.match(/"name":"([^"]+)"/);
    const categoryMatch = html.match(/"category":"([^"]+)"/);
    const descriptionMatch = html.match(/"description":"([^"]+)"/);
    const websiteMatch = html.match(/"website":"([^"]+)"/);
    const phoneMatch = html.match(/"telephone":"([^"]+)"/);
    const emailMatch = html.match(/"email":"([^"]+)"/);
    const addressMatch = html.match(/"streetAddress":"([^"]+)"/);

    return {
      pageId: cleanName,
      name: nameMatch?.[1] || cleanName,
      followers: followersMatch ? parseInt(followersMatch[1]) : 0,
      likes: likesMatch ? parseInt(likesMatch[1]) : 0,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
      reviewCount: reviewMatch ? parseInt(reviewMatch[1]) : 0,
      areLikesEnabled: true,
      isVerified: html.includes('"isVerified":true'),
      category: categoryMatch?.[1] || "",
      description: descriptionMatch?.[1] || "",
      website: websiteMatch?.[1] || "",
      phone: phoneMatch?.[1] || "",
      email: emailMatch?.[1] || "",
      address: addressMatch?.[1] || "",
      hours: "",
    };
  } catch (error) {
    console.error(`Facebook scraping failed for ${cleanName}:`, error);
    return null;
  }
}

export function extractFacebookUrl(text: string): string | null {
  const match = text.match(/facebook\.com\/([a-zA-Z0-9.]+)(?:\/|\?|$)/);
  if (!match) return null;
  const page = match[1];
  // Ignore generic Facebook pages
  if (["profile.php", "pages", "login", "signup", "recover", "help", "policies", "groups"].includes(page)) {
    return null;
  }
  return page;
}
