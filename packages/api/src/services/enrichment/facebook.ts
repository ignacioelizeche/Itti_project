import { scrapeFacebookByName, extractFacebookUrl } from "../scraper/facebook.js";

export interface FacebookEnrichment {
  username: string;
  followers: number;
  dataSources: Record<string, unknown>;
}

export async function enrichFacebook(name: string, facebook: string | null, website: string | null, description: string | null): Promise<FacebookEnrichment | null> {
  const fbUsername = facebook || extractFacebookUrl(website || "") || extractFacebookUrl(description || "");
  if (!fbUsername) return null;

  const fbData = await scrapeFacebookByName(name, fbUsername);
  if (!fbData) return null;

  return {
    username: fbUsername,
    followers: fbData.followers,
    dataSources: {
      name: fbData.name,
      followers: fbData.followers,
      likes: fbData.likes,
      rating: fbData.rating,
      category: fbData.category,
      phone: fbData.phone,
      email: fbData.email,
      website: fbData.website,
      address: fbData.address,
      scrapedAt: new Date().toISOString(),
    },
  };
}
