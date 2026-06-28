import { ApifyClient } from "apify-client";

const INSTAGRAM_SCRAPER_ACTOR = "apify/instagram-scraper";

let client: ApifyClient | null = null;

function getClient(): ApifyClient | null {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn("APIFY_API_TOKEN not set - Instagram scraping disabled");
    return null;
  }
  if (!client) {
    client = new ApifyClient({ token });
  }
  return client;
}

export interface ApifyInstagramData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  isBusinessAccount: boolean;
  isVerified: boolean;
  profilePicUrl: string;
  externalUrl: string | null;
  businessCategoryName: string | null;
  recentPosts: Array<{
    shortCode: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    timestamp: string;
    displayUrl: string;
  }>;
}

export async function scrapeInstagramViaApify(
  username: string
): Promise<ApifyInstagramData | null> {
  const apify = getClient();
  if (!apify) return null;

  const cleanUsername = username.replace("@", "").trim();
  if (!cleanUsername) return null;

  try {
    console.log(`[Apify] Scraping @${cleanUsername}...`);

    const run = await apify.actor(INSTAGRAM_SCRAPER_ACTOR).call(
      {
        resultsType: "details",
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsLimit: 1,
      },
      { waitSecs: 60 }
    );

    const { items } = await apify
      .dataset(run.defaultDatasetId)
      .listItems();

    if (!items || items.length === 0) {
      console.log(`[Apify] No results for @${cleanUsername}`);
      return null;
    }

    const profile = items[0] as any;

    const recentPosts = (profile.latestPosts || [])
      .slice(0, 12)
      .map((post: any) => ({
        shortCode: post.shortCode || "",
        caption: post.caption || "",
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        timestamp: post.timestamp || "",
        displayUrl: post.displayUrl || "",
      }));

    const totalLikes = recentPosts.reduce(
      (sum: number, p: any) => sum + p.likesCount,
      0
    );
    const totalComments = recentPosts.reduce(
      (sum: number, p: any) => sum + p.commentsCount,
      0
    );

    console.log(
      `[Apify] @${cleanUsername}: ${profile.followersCount} followers, ${profile.postsCount} posts`
    );

    return {
      username: profile.username || cleanUsername,
      fullName: profile.fullName || "",
      biography: profile.biography || "",
      followersCount: profile.followersCount || 0,
      followsCount: profile.followsCount || 0,
      postsCount: profile.postsCount || 0,
      isBusinessAccount: profile.isBusinessAccount || false,
      isVerified: profile.verified || false,
      profilePicUrl: profile.profilePicUrl || "",
      externalUrl: profile.externalUrl || null,
      businessCategoryName: profile.businessCategoryName || null,
      recentPosts,
    };
  } catch (error: any) {
    console.error(
      `[Apify] Instagram scraping failed for @${cleanUsername}:`,
      error.message || error
    );
    return null;
  }
}

