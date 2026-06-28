export function cleanInstagram(input: string | null | undefined): string | null {
  if (!input) return null;
  return input
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace("@", "")
    .split("/")[0]
    .split("?")[0]
    .trim() || null;
}

export function cleanFacebook(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input
    .replace(/^https?:\/\/(www\.)?facebook\.com\//, "")
    .split("?")[0]
    .trim();

  if (!cleaned || ["profile.php", "pages", "login", "signup", "recover", "help", "policies", "groups"].includes(cleaned)) {
    return null;
  }
  return cleaned;
}

export function extractInstagramFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
  return match ? match[1] : null;
}

export function extractFacebookFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/facebook\.com\/([a-zA-Z0-9.]+)(?:\/|\?|$)/);
  if (!match) return null;
  return cleanFacebook(match[1]);
}

export function extractTwitterFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/(?:twitter|x)\.com\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function extractTiktokFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/tiktok\.com\/@([^/?#]+)/);
  return match ? match[1] : null;
}

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

export function extractSocialLinks(html: string): SocialLinks {
  return {
    instagram: extractInstagramFromHtml(html) ?? undefined,
    facebook: extractFacebookFromHtml(html) ?? undefined,
    twitter: extractTwitterFromHtml(html) ?? undefined,
    tiktok: extractTiktokFromHtml(html) ?? undefined,
  };
}
