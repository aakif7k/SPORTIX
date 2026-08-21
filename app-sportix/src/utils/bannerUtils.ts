/**
 * bannerUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean sport banner fallback helper for SPORTiX Mobile.
 * Ensures every event card and detail hero always renders a pristine, high-res stadium banner.
 */

export const SPORT_BANNERS: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&q=80',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80',
  running: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&q=80',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
  mma: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
  futsal: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
  squash: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&q=80',
};

export function getValidBannerUrl(url?: string | null, sport?: string): string {
  const sportKey = (sport || 'football').toLowerCase();
  const fallback = SPORT_BANNERS[sportKey] || SPORT_BANNERS.football;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  // Check for concatenated duplicate URLs like https://...jpghttps://...
  const trimmed = url.trim();
  if (trimmed.indexOf('http', 8) !== -1) {
    const firstUrl = trimmed.substring(0, trimmed.indexOf('http', 8));
    return firstUrl || fallback;
  }

  return trimmed;
}
