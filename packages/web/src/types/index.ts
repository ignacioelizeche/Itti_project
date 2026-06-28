export interface DiscoveredCompany {
  id: number;
  name: string;
  category: string;
  address: string;
  googleRating: number | null;
  score: number | null;
  isNew: boolean;
}

export interface CompanyDecision {
  id: number;
  name: string;
  category: string;
  website: string | null;
  instagramFollowers: number | null;
  score: number | null;
  scoreLabel: string | null;
  humanDecision: string | null;
  humanNote: string | null;
  decidedAt: string | null;
}

export interface EnrichedData {
  instagram?: {
    fullName: string;
    biography: string;
    followersCount: number;
    postsCount: number;
    isBusinessAccount: boolean;
    isVerified: boolean;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    scrapedAt: string;
  };
  webTraffic?: {
    monthlyVisits: number;
    bounceRate: number;
    pagesPerVisit: number;
    rank: number;
  };
  facebookData?: {
    followers: number;
    likes: number;
    rating: number;
    reviewCount: number;
  };
}
