import { fetchPage, type FetchedPage } from './fetch.service.js';

const MAX_PAGES = 8;

async function robotsAllowed(rawUrl: string) {
  try {
    const base = new URL(rawUrl);

    const robots = await fetchPageText(
      new URL('/robots.txt', base).href
    );

    if (!robots) return true;

    const lines = robots.split(/\r?\n/);

    let applies = false;
    const disallowed: string[] = [];

    for (const line of lines) {
      const [rawKey, rawValue] = line.split(':', 2);

      const key = rawKey?.trim().toLowerCase();
      const value = rawValue?.trim() ?? '';

      if (key === 'user-agent') {
        applies =
          value === '*' ||
          /TraoInterviewPrepBot/i.test(value);
      }

      if (key === 'disallow' && applies && value) {
        disallowed.push(value);
      }
    }

    return !disallowed.some(rule =>
      base.pathname.startsWith(rule)
    );
  } catch {
    // If robots.txt cannot be retrieved, do not crash the
    // complete generation pipeline.
    return true;
  }
}

async function fetchPageText(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TraoInterviewPrepBot/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

const KEYWORDS: Record<string, number> = {
  careers: 12,
  career: 12,
  jobs: 12,
  hiring: 12,
  interview: 12,
  'work-with-us': 10,
  'join-us': 10,
  about: 7,
  company: 6,
  engineering: 6,
  handbook: 8,
  culture: 5,
  blog: 2,
};

function absoluteUrl(base: string, href: string) {
  try {
    const u = new URL(href, base);

    if (!['http:', 'https:'].includes(u.protocol)) {
      return null;
    }

    return u.href.split('#')[0];
  } catch {
    return null;
  }
}

function scoreLink(href: string, text: string) {
  const hay = `${href} ${text}`.toLowerCase();

  return Object.entries(KEYWORDS).reduce(
    (score, [word, weight]) =>
      score + (hay.includes(word) ? weight : 0),
    0
  );
}

export async function crawlCompany(startUrl: string) {
  const pages: FetchedPage[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  let homepage: FetchedPage | null = null;

  /*
   * Check robots.txt before crawling.
   */
  if (!(await robotsAllowed(startUrl))) {
    throw new Error(
      'Robots.txt disallows crawling the company site.'
    );
  }

  /*
   * Fetch homepage.
   *
   * If the homepage is unavailable/too large, the whole
   * generation should not crash without a useful message.
   */
  try {
    homepage = await fetchPage(startUrl);

    pages.push(homepage);
    seen.add(homepage.url);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    errors.push(`${startUrl}: ${message}`);

    /*
     * The homepage is necessary for discovering relative
     * links. If it cannot be fetched, return an empty
     * research result rather than crashing the entire kit.
     */
    return {
      pages,
      errors,
      hiringPage: null,
      aboutPage: null,
      pagesUsed: [],
    };
  }

  /*
   * Discover candidate links from the homepage.
   */
  const candidates = homepage.links
    .map(link => ({
      ...link,
      url: absoluteUrl(homepage!.url, link.href),
    }))
    .filter(
      (
        x
      ): x is typeof x & {
        url: string;
      } => Boolean(x.url)
    )
    .filter(
      x =>
        new URL(x.url).origin ===
        new URL(homepage!.url).origin
    )
    .map(x => ({
      ...x,
      score: scoreLink(x.url, x.text),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  /*
   * Crawl only a bounded number of pages.
   */
  for (const candidate of candidates) {
    if (pages.length >= MAX_PAGES) {
      break;
    }

    if (seen.has(candidate.url)) {
      continue;
    }

    seen.add(candidate.url);

    try {
      const allowed = await robotsAllowed(candidate.url);

      if (!allowed) {
        errors.push(
          `${candidate.url}: blocked by robots.txt`
        );
        continue;
      }

      const page = await fetchPage(candidate.url);

      pages.push(page);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * One bad page must not stop the complete crawl.
       */
      errors.push(
        `${candidate.url}: ${message}`
      );
    }
  }

  /*
   * Try to identify the most useful hiring page.
   */
  const hiring = pages.find(page =>
    /career|job|hiring|interview|work with us/i.test(
      `${page.url} ${page.title} ${page.text.slice(0, 5000)}`
    )
  );

  /*
   * Try to identify an about/company page.
   */
  const about = pages.find(page =>
    /about|company/i.test(
      `${page.url} ${page.title}`
    )
  );

  return {
    pages,
    errors,
    hiringPage: hiring?.url ?? null,
    aboutPage: about?.url ?? null,
    pagesUsed: pages.map(page => page.url),
  };
}