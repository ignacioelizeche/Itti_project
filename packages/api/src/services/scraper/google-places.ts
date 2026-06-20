import { config } from "../../config.js";
import { RateLimiter } from "../../utils/rate-limiter.js";

interface PlaceResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  phoneNumber?: string;
  website?: string;
  googleRating?: number;
  googleReviews?: number;
  businessStatus?: string;
  types: string[];
}

interface PlaceSearchOptions {
  query: string;
  locationBias?: { latitude: number; longitude: number; radius: number };
  maxResults?: number;
  languageCode?: string;
}

const limiter = new RateLimiter(500);

export async function searchPlaces(options: PlaceSearchOptions): Promise<PlaceResult[]> {
  const { query, locationBias, maxResults = 20, languageCode = "es" } = options;

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: Math.min(maxResults, 20),
    languageCode,
  };

  if (locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: locationBias.latitude,
          longitude: locationBias.longitude,
        },
        radius: locationBias.radius,
      },
    };
  }

  await limiter.wait();

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.google.mapsApiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
      nationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      businessStatus?: string;
    }>;
  };

  if (!data.places) return [];

  return data.places.map((place) => ({
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    category: place.types?.[0] || "UNKNOWN",
    phoneNumber: place.nationalPhoneNumber,
    website: place.websiteUri,
    googleRating: place.rating,
    googleReviews: place.userRatingCount,
    businessStatus: place.businessStatus,
    types: place.types || [],
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  await limiter.wait();

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": config.google.mapsApiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,types,nationalPhoneNumber,websiteUri,rating,userRatingCount,businessStatus,regularOpeningHours,reviews",
      },
    }
  );

  if (!response.ok) return null;

  const place = (await response.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    types?: string[];
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    businessStatus?: string;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    reviews?: Array<{
      authorAttribution?: { displayName: string };
      text?: { text: string };
      rating?: number;
      publishTime: string;
    }>;
  };

  return {
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    category: place.types?.[0] || "UNKNOWN",
    phoneNumber: place.nationalPhoneNumber,
    website: place.websiteUri,
    googleRating: place.rating,
    googleReviews: place.userRatingCount,
    businessStatus: place.businessStatus,
    types: place.types || [],
  };
}
