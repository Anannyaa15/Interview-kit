import axios from 'axios';

export type PublicResearchResult = { query: string; title: string; url: string; snippet: string }[];

export async function searchPublicInterviewDiscussion(company: string): Promise<PublicResearchResult> {
  const q = `${company} interview process interview experience hiring`;
  try {
    const html = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q }, timeout: 10_000, headers: { 'User-Agent': 'Mozilla/5.0' }
    }).then(r => String(r.data));
    const { load } = await import('cheerio');
    const $ = load(html);
    const results: PublicResearchResult = [];
    $('.result').each((_i, el) => {
      if (results.length >= 6) return;
      const a = $(el).find('.result__a').first();
      const snippet = $(el).find('.result__snippet').first().text().replace(/\s+/g, ' ').trim();
      const href = a.attr('href');
      const title = a.text().replace(/\s+/g, ' ').trim();
      if (href && title) results.push({ query: q, title, url: href, snippet });
    });
    return results;
  } catch {
    return [];
  }
}
