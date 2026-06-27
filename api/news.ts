import Parser from 'rss-parser';
import { fetchGeminiSearchNews } from './geminiNewsSearch.js';
import { filterExternalNews, googleNewsQueryWithExclusions, isOwnPublication } from './newsExclude.js';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet: string;
  category: string;
  origin?: 'rss' | 'gemini';
}

const MOCK_NEWS: NewsItem[] = [
  {
    title: 'San Juan se consolida como el polo del cobre en Argentina con Los Azules y Josemaría',
    link: 'https://www.mining.com/copper-argentina-san-juan-projects/',
    pubDate: new Date().toISOString(),
    source: 'Mining.com',
    contentSnippet: 'Los informes de factibilidad y los avances en infraestructura vial y eléctrica proyectan a la provincia como líder en la transición energética de Sudamérica.',
    category: 'Cobre',
    origin: 'rss'
  },
  {
    title: 'El impacto del RIGI en las inversiones mineras: expectación en las empresas del sector',
    link: 'https://www.perfil.com/noticias/economia/rigi-mineria-argentina',
    pubDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    source: 'Perfil',
    contentSnippet: 'Cámaras empresariales y gobernadores de las provincias mineras debaten las condiciones fiscales del nuevo régimen de incentivo para grandes inversiones.',
    category: 'Economía',
    origin: 'rss'
  },
  {
    title: 'Veladero extiende su vida útil tras optimizaciones operativas y exploraciones en Jáchal',
    link: 'https://www.losandes.com.ar/economia/veladero-vida-util/',
    pubDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    source: 'Los Andes',
    contentSnippet: 'La mina de oro y plata de Iglesia prevé continuar operaciones con nuevas fases de lixiviación, asegurando puestos de trabajo clave para la región sanjuanina.',
    category: 'Oro',
    origin: 'rss'
  },
  {
    title: 'Litio en el NOA: Salta, Jujuy y Catamarca coordinan regalías y desarrollo de proveedores',
    link: 'https://www.clarin.com/economia/litio-noa-regalias-proveedores/',
    pubDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    source: 'Clarín',
    contentSnippet: 'La Mesa del Litio avanza en un esquema tributario unificado y en el fortalecimiento de la cadena de valor local frente al aumento de la demanda global.',
    category: 'Litio',
    origin: 'rss'
  }
];

function guessCategory(text: string): string {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('cobre') || lowercaseText.includes('copper') || lowercaseText.includes('azules') || lowercaseText.includes('josemaría') || lowercaseText.includes('josemaria') || lowercaseText.includes('pachón')) {
    return 'Cobre';
  }
  if (lowercaseText.includes('litio') || lowercaseText.includes('lithium') || lowercaseText.includes('cauchari') || lowercaseText.includes('olaroz')) {
    return 'Litio';
  }
  if (lowercaseText.includes('oro') || lowercaseText.includes('gold') || lowercaseText.includes('veladero') || lowercaseText.includes('plata') || lowercaseText.includes('silver')) {
    return 'Oro y Plata';
  }
  if (lowercaseText.includes('rigi') || lowercaseText.includes('inversión') || lowercaseText.includes('regalías') || lowercaseText.includes('dólar') || lowercaseText.includes('economía')) {
    return 'Economía / RIGI';
  }
  return 'General';
}

function normalizeKey(item: NewsItem): string {
  if (item.link) {
    try {
      const u = new URL(item.link);
      return u.hostname + u.pathname;
    } catch {
      return item.link.toLowerCase();
    }
  }
  return item.title.toLowerCase().slice(0, 100);
}

function dedupeNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = normalizeKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchRssNews(feedUrls: string[]): Promise<NewsItem[]> {
  const newsItems: NewsItem[] = [];

  for (const feedUrl of feedUrls) {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed?.items) {
        feed.items.slice(0, 15).forEach((item) => {
          const isGoogle = feedUrl.includes('news.google.com');
          let title = item.title || 'Sin título';
          let source = feed.title || 'RSS';
          if (isGoogle && title.includes(' - ')) {
            const parts = title.split(' - ');
            source = parts.pop() || 'Google News';
            title = parts.join(' - ');
          }
          newsItems.push({
            title,
            link: item.link || '',
            pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source,
            contentSnippet: item.contentSnippet || item.content || '',
            category: guessCategory(title + ' ' + (item.contentSnippet || '')),
            origin: 'rss'
          });
        });
      }
    } catch (e) {
      console.error('Error feed:', feedUrl, e);
    }
  }

  return filterExternalNews(newsItems).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[] | undefined> }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void };
}) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const customFeeds = req.query?.feeds
      ? String(req.query.feeds).split(',').map(f => decodeURIComponent(f.trim())).filter(Boolean)
      : [];

    const googleNewsQuery = encodeURIComponent(
      googleNewsQueryWithExclusions(
        'mineria argentina OR cobre san juan OR litio argentina OR proyecto josemaria OR los azules'
      )
    );
    const defaultFeeds = [
      `https://news.google.com/rss/search?q=${googleNewsQuery}&hl=es-419&gl=AR&ceid=AR:es-419`,
      'https://www.mining.com/feed/'
    ];
    const feedUrls = (customFeeds.length > 0 ? customFeeds : defaultFeeds).filter(
      url => !isOwnPublication(url)
    );

    const geminiQuery = req.query?.q ? String(req.query.q) : undefined;
    const includeRss = req.query?.rss !== '0';
    const includeGemini = req.query?.gemini !== '0';
    const apiKey = process.env.GEMINI_API_KEY;
    const model = req.query?.model ? String(req.query.model) : undefined;

    const [rssItems, geminiItems] = await Promise.all([
      includeRss ? fetchRssNews(feedUrls) : Promise.resolve([] as NewsItem[]),
      includeGemini && apiKey
        ? fetchGeminiSearchNews(apiKey, geminiQuery, model)
        : Promise.resolve([])
    ]);

    let merged = dedupeNews(filterExternalNews([...geminiItems, ...rssItems]));
    merged = merged.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    merged = merged.slice(0, 40);

    if (merged.length === 0) {
      merged = MOCK_NEWS;
    }

    res.status(200).json({
      items: merged,
      meta: {
        total: merged.length,
        rss: merged.filter(i => i.origin === 'rss').length,
        gemini: merged.filter(i => i.origin === 'gemini').length,
        geminiEnabled: Boolean(apiKey),
        query: geminiQuery || null
      }
    });
  } catch (error: unknown) {
    console.error('Error en el agregador de noticias:', error);
    res.status(200).json({
      items: MOCK_NEWS,
      meta: { total: MOCK_NEWS.length, rss: MOCK_NEWS.length, gemini: 0, geminiEnabled: false, query: null }
    });
  }
}
