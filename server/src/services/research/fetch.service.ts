import axios, { AxiosError } from 'axios';
import { validateExternalUrl } from './url.service.js';

export type FetchedPage = {
  url: string;
  title: string;
  text: string;
  links: {
    href: string;
    text: string;
  }[];
  contentType: string;
};

/*
 * Keep a safety limit, but allow reasonably large company pages.
 * 2 MB is large enough for most HTML pages while preventing
 * unexpectedly huge responses.
 */
const MAX_BYTES = 2_000_000;

export async function fetchPage(
  rawUrl: string
): Promise<FetchedPage> {
  const url = await validateExternalUrl(
    rawUrl,
    process.env.ALLOW_LOCAL_RESEARCH === 'true'
  );

  try {
    const response = await axios.get<string>(url.href, {
      timeout: 12_000,

      /*
       * Prevent very large responses from consuming memory.
       */
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,

      /*
       * Allow a few normal redirects.
       */
      maxRedirects: 3,

      responseType: 'text',

      validateStatus: status =>
        status >= 200 && status < 400,

      headers: {
        'User-Agent':
          'TraoInterviewPrepBot/1.0 (+assessment research)',
        Accept:
          'text/html,application/xhtml+xml',
      },
    });

    const contentType = String(
      response.headers['content-type'] ?? ''
    );

    /*
     * Only HTML/XHTML pages are useful for the crawler.
     */
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml')
    ) {
      throw new Error(
        `Unsupported content type: ${contentType || 'unknown'}`
      );
    }

    const cheerio = await import('cheerio');

    const $ = cheerio.load(
      String(response.data)
    );

    const title = $('title')
      .first()
      .text()
      .trim();

    const links = $('a[href]')
      .map((_index, element) => ({
        href: $(element).attr('href') ?? '',
        text: $(element)
          .text()
          .replace(/\s+/g, ' ')
          .trim(),
      }))
      .get();

    /*
     * Remove non-content elements before extracting text.
     */
    $(
      'script, style, noscript, svg, template'
    ).remove();

    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 45_000);

    return {
      url: url.href,
      title,
      text,
      links,
      contentType,
    };
  } catch (error) {
    const e = error as AxiosError;

    const status = e.response?.status;

    throw new Error(
      status
        ? `HTTP ${status} while fetching ${rawUrl}`
        : `Unable to fetch ${rawUrl}: ${
            e.message ?? 'request failed'
          }`
    );
  }
}