import { env } from '../../config/env.js';

export class LlmError extends Error { constructor(message: string) { super(message); this.name = 'LlmError'; } }

async function callGemini(prompt: string) {
  if (!env.geminiApiKey) throw new LlmError('GEMINI_API_KEY is not configured.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } })
    });
    if (response.ok) {
      const data = await response.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
      if (!text) throw new LlmError('LLM returned an empty response.');
      return text;
    }
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
      throw new LlmError(`LLM request failed with HTTP ${response.status}.`);
    }
    await new Promise(r => setTimeout(r, 800 * 2 ** attempt));
  }
  throw new LlmError('LLM request failed after retries.');
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(cleaned) as T; }
  catch { throw new LlmError('LLM returned invalid JSON.'); }
}

export async function generateJson<T>(prompt: string) {
  return parseJson<T>(await callGemini(prompt));
}
