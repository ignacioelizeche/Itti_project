import { RateLimiter } from "../../utils/rate-limiter.js";

interface SocialData {
  platform: string;
  handle?: string;
  followers?: number;
  following?: number;
  posts?: number;
  bio?: string;
  isVerified?: boolean;
  recentPostCount?: number;
  averageLikes?: number;
}

const limiter = new RateLimiter(3000);

export async function scrapeInstagramProfile(
  username: string
): Promise<SocialData | null> {
  try {
    await limiter.wait();

    const url = `https://www.instagram.com/${username}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-PY,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract JSON-LD data
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    let bio: string | undefined;

    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        bio = data.description;
      } catch {
        // ignore parse errors
      }
    }

    // Extract meta tags
    const metaDescMatch = html.match(
      /<meta\s+(?:name|property)="description"\s+content="([^"]*)"/
    );
    if (!bio && metaDescMatch) {
      bio = metaDescMatch[1];
    }

    // Try to extract follower count from meta
    const followerMatch = html.match(
      /"edge_followed_by":\{"count":(\d+)\}/
    );
    const followingMatch = html.match(/"edge_follow":\{"count":(\d+)\}/);
    const postMatch = html.match(
      /"edge_owner_to_timeline_media":\{"count":(\d+)/
    );

    return {
      platform: "instagram",
      handle: username,
      bio,
      followers: followerMatch ? parseInt(followerMatch[1]) : undefined,
      following: followingMatch ? parseInt(followingMatch[1]) : undefined,
      posts: postMatch ? parseInt(postMatch[1]) : undefined,
    };
  } catch (error) {
    console.error(`Error scraping Instagram @${username}:`, error);
    return null;
  }
}

export async function scrapeFacebookPage(
  pageId: string
): Promise<SocialData | null> {
  try {
    await limiter.wait();

    const url = `https://www.facebook.com/${pageId}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-PY,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Facebook makes scraping very hard, extract what we can from meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/);
    const descMatch = html.match(
      /<meta\s+(?:name|property)="description"\s+content="([^"]*)"/
    );

    return {
      platform: "facebook",
      handle: pageId,
      bio: descMatch?.[1] || titleMatch?.[1],
    };
  } catch (error) {
    console.error(`Error scraping Facebook page ${pageId}:`, error);
    return null;
  }
}
