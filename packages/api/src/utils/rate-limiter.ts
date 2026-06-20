export class RateLimiter {
  private lastRequestTime = 0;
  private minDelay: number;

  constructor(minDelayMs: number = 1000) {
    this.minDelay = minDelayMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.minDelay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
