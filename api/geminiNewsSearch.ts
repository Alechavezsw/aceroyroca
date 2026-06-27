import { GoogleGenAI } from '@google/genai';
import { filterExternalNews } from './newsExclude';

export interface SearchNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet: string;
  category: string;
  origin: 'gemini';
}

const SEARCH_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

const DEFAULT_QUERY =
  'noticias minería Argentina San Juan cobre Los Azules Josemaría Veladero litio RIGI última semana';

function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('cobre') || t.includes('copper') || t.includes('azules') || t.includes('josemaría') || t.includes('josemaria') || t.includes('pachón')) {
    return 'Cobre';
  }
  if (t.includes('litio') || t.includes('lithium') || t.includes('cauchari') || t.includes('olaroz')) {
    return 'Litio';
  }
  if (t.includes('oro') || t.includes('gold') || t.includes('veladero') || t.includes('plata') || t.includes('silver')) {
    return 'Oro y Plata';
  }
  if (t.includes('rigi') || t.includes('inversión') || t.includes('regalías') || t.includes('economía')) {
    return 'Economía / RIGI';
  }
  return 'General';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Google Search';
  }
}

function parseNewsJson(text: string): Omit<SearchNewsItem, 'category' | 'origin'>[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x: Record<string, unknown>) => x && typeof x.title === 'string')
      .map((x: Record<string, unknown>) => ({
        title: String(x.title).trim(),
        link: String(x.link || '').trim(),
        source: String(x.source || 'Web').trim(),
        contentSnippet: String(x.contentSnippet || x.snippet || '').trim().slice(0, 280),
        pubDate: x.pubDate ? new Date(String(x.pubDate)).toISOString() : new Date().toISOString()
      }))
      .filter(x => x.title.length > 5);
  } catch {
    return [];
  }
}

function itemsFromGrounding(response: { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }> }): SearchNewsItem[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .filter(c => c.web?.uri || c.web?.title)
    .slice(0, 12)
    .map(c => {
      const title = c.web?.title || 'Noticia minera';
      const link = c.web?.uri || '';
      return {
        title,
        link,
        source: extractDomain(link),
        contentSnippet: '',
        pubDate: new Date().toISOString(),
        category: guessCategory(title),
        origin: 'gemini' as const
      };
    });
}

export async function fetchGeminiSearchNews(
  apiKey: string,
  query?: string,
  model?: string
): Promise<SearchNewsItem[]> {
  const ai = new GoogleGenAI({ apiKey });
  const searchQuery = (query || '').trim() || DEFAULT_QUERY;

  const prompt = `Eres un agregador de noticias mineras para el portal editorial "Acero & Roca" (San Juan, Argentina).

Usa Google Search para encontrar noticias recientes (últimos 10 días) sobre:
${searchQuery}

Devuelve SOLO un JSON array válido (sin markdown, sin \`\`\`), entre 8 y 15 objetos:
[{"title":"título en español","link":"https://url-real-del-medio","source":"nombre del medio","contentSnippet":"resumen de 1-2 oraciones","pubDate":"2025-06-25T12:00:00.000Z"}]

Reglas estrictas:
- Solo noticias de MEDIOS EXTERNOS (diarios, portales mineros, agencias). NUNCA incluir aceroyroca.com ni el magazine Acero y Roca (son publicaciones propias del columnista).
- Solo noticias reales con URLs verificables de terceros
- Títulos y resúmenes en español
- pubDate en ISO 8601
- Enfocate en minería argentina, San Juan, cobre, litio, oro y política minera cuando aplique`;

  const modelsToTry = model ? [model, ...SEARCH_MODELS.filter(m => m !== model)] : SEARCH_MODELS;

  for (const m of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      });

      const parsed = parseNewsJson(response.text || '');
      if (parsed.length > 0) {
        return filterExternalNews(
          parsed.map(item => ({
            ...item,
            source: item.source || 'Google Search',
            category: guessCategory(`${item.title} ${item.contentSnippet}`),
            origin: 'gemini' as const
          }))
        );
      }

      const fromGrounding = itemsFromGrounding(response as Parameters<typeof itemsFromGrounding>[0]);
      if (fromGrounding.length > 0) return filterExternalNews(fromGrounding);
    } catch (error) {
      console.error('Gemini news search error:', m, error);
    }
  }

  return [];
}
