/** Dominios propios: no deben aparecer en "Actualidad minera" (solo fuentes externas). */
export const EXCLUDED_NEWS_DOMAINS = [
  'aceroyroca.com',
  'aceroyroca.vercel.app'
];

const EXCLUDED_SOURCE_PATTERNS = [/acero\s*[&y]?\s*roca/i, /magazine minero/i];

export function isOwnPublication(link: string, source?: string): boolean {
  if (link) {
    try {
      const host = new URL(link).hostname.replace(/^www\./, '').toLowerCase();
      if (EXCLUDED_NEWS_DOMAINS.some(d => host === d || host.endsWith(`.${d}`))) {
        return true;
      }
    } catch {
      if (link.toLowerCase().includes('aceroyroca.com')) return true;
    }
  }

  const src = (source || '').trim();
  if (!src) return false;
  return EXCLUDED_SOURCE_PATTERNS.some(re => re.test(src));
}

export function filterExternalNews<T extends { link: string; source?: string }>(items: T[]): T[] {
  return items.filter(item => !isOwnPublication(item.link, item.source));
}

export function googleNewsQueryWithExclusions(baseQuery: string): string {
  const exclusions = EXCLUDED_NEWS_DOMAINS.map(d => `-site:${d}`).join(' ');
  return `${baseQuery} ${exclusions}`.trim();
}
