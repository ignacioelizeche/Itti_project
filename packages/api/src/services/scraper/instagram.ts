export interface InstagramData {
  username: string;
  followers: number;
  following: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  isBusinessAccount: boolean;
  isVerified: boolean;
  profilePicUrl: string;
  bio: string;
  recentPosts: Array<{
    likes: number;
    comments: number;
    timestamp: string;
  }>;
}

export async function scrapeInstagram(username: string): Promise<InstagramData | null> {
  const cleanUsername = username.replace("@", "").trim();
  if (!cleanUsername) return null;

  try {
    // Use Instagram's public web API (no auth needed for basic profile data)
    const response = await fetch(
      `https://www.instagram.com/${cleanUsername}/?__a=1&__d=dis`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "X-IG-App-ID": "936619743392459",
        },
      }
    );

    if (!response.ok) {
      // Fallback: try scraping the HTML page
      return await scrapeInstagramHTML(cleanUsername);
    }

    const data = await response.json() as any;
    const user = data?.graphql?.user || data?.data?.user;

    if (!user) {
      return await scrapeInstagramHTML(cleanUsername);
    }

    const recentPosts = (user.edge_owner_to_timeline_media?.edges || [])
      .slice(0, 12)
      .map((edge: any) => ({
        likes: edge.node?.edge_liked_by?.count || edge.node?.edge_media_preview_like?.count || 0,
        comments: edge.node?.edge_media_to_comment?.count || 0,
        timestamp: edge.node?.taken_at_timestamp
          ? new Date(edge.node.taken_at_timestamp * 1000).toISOString()
          : "",
      }));

    const totalLikes = recentPosts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = recentPosts.reduce((sum, p) => sum + p.comments, 0);
    const avgLikes = recentPosts.length > 0 ? Math.round(totalLikes / recentPosts.length) : 0;
    const avgComments = recentPosts.length > 0 ? Math.round(totalComments / recentPosts.length) : 0;
    const followers = user.edge_followed_by?.count || 0;
    const engagementRate = followers > 0
      ? Math.round(((avgLikes + avgComments) / followers) * 10000) / 100
      : 0;

    return {
      username: cleanUsername,
      followers,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      avgLikes,
      avgComments,
      engagementRate,
      isBusinessAccount: user.is_business_account || false,
      isVerified: user.is_verified || false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
      bio: user.biography || "",
      recentPosts,
    };
  } catch (error) {
    console.error(`Instagram scraping failed for @${cleanUsername}:`, error);
    return await scrapeInstagramHTML(cleanUsername);
  }
}

async function scrapeInstagramHTML(username: string): Promise<InstagramData | null> {
  try {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract meta tags
    const followersMatch = html.match(/content="([\d,.]+[KMkm]?) Followers/);
    const postsMatch = html.match(/content="([\d,.]+[KMkm]?) Posts/);
    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);

    const parseCount = (str: string): number => {
      if (!str) return 0;
      str = str.replace(/,/g, "");
      if (str.endsWith("K") || str.endsWith("k")) return Math.round(parseFloat(str) * 1000);
      if (str.endsWith("M") || str.endsWith("m")) return Math.round(parseFloat(str) * 1000000);
      return parseInt(str) || 0;
    };

    return {
      username,
      followers: parseCount(followersMatch?.[1] || "0"),
      following: 0,
      posts: parseCount(postsMatch?.[1] || "0"),
      avgLikes: 0,
      avgComments: 0,
      engagementRate: 0,
      isBusinessAccount: false,
      isVerified: false,
      profilePicUrl: "",
      bio: descriptionMatch?.[1] || "",
      recentPosts: [],
    };
  } catch {
    return null;
  }
}

export async function extractInstagramUsername(
  website?: string,
  instagram?: string
): Promise<string | null> {
  // If Instagram username is already provided
  if (instagram) {
    return instagram.replace("@", "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").split("/")[0];
  }

  // Try to find Instagram link from website
  if (website) {
    try {
      const response = await fetch(website, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const html = await response.text();
        const instagramMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (instagramMatch) return instagramMatch[1];
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}
