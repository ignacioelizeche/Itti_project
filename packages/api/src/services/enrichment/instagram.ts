import { scrapeInstagramViaApify } from "../scraper/instagram-apify.js";
import { extractInstagramUsername } from "../scraper/instagram.js";

export interface InstagramEnrichment {
  username: string;
  followers: number;
  engagementRate: number;
  dataSources: Record<string, unknown>;
}

export async function enrichInstagram(name: string, website: string | null, instagram: string | null): Promise<InstagramEnrichment | null> {
  const igUsername = await extractInstagramUsername(website || undefined, instagram || undefined);
  if (!igUsername) return null;

  const igData = await scrapeInstagramViaApify(igUsername);
  if (!igData) return null;

  const avgLikes =
    igData.recentPosts.length > 0
      ? igData.recentPosts.reduce((s, p) => s + p.likesCount, 0) / igData.recentPosts.length
      : 0;
  const avgComments =
    igData.recentPosts.length > 0
      ? igData.recentPosts.reduce((s, p) => s + p.commentsCount, 0) / igData.recentPosts.length
      : 0;
  const engagementRate =
    igData.followersCount > 0
      ? Math.round(((avgLikes + avgComments) / igData.followersCount) * 10000) / 100
      : 0;

  return {
    username: igUsername,
    followers: igData.followersCount,
    engagementRate,
    dataSources: {
      fullName: igData.fullName,
      biography: igData.biography,
      followersCount: igData.followersCount,
      postsCount: igData.postsCount,
      isBusinessAccount: igData.isBusinessAccount,
      isVerified: igData.isVerified,
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments),
      engagementRate,
      scrapedAt: new Date().toISOString(),
    },
  };
}
