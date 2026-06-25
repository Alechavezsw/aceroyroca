import Parser from 'rss-parser';

const parser = new Parser();

// Curated fallbacks in case feeds are down or return empty
const MOCK_NEWS = [
  {
    title: "San Juan se consolida como el polo del cobre en Argentina con Los Azules y Josemaría",
    link: "https://aceroyroca.com/san-juan-polo-cobre",
    pubDate: new Date().toISOString(),
    source: "Acero y Roca",
    contentSnippet: "Los informes de factibilidad y los avances en la infraestructura vial y eléctrica proyectan a la provincia como líder en la transición energética de Sudamérica.",
    category: "Cobre"
  },
  {
    title: "El impacto del RIGI en las inversiones mineras: expectación en las empresas del sector",
    link: "https://aceroyroca.com/impacto-rigi-mineria",
    pubDate: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    source: "Minería y Desarrollo",
    contentSnippet: "Cámaras empresariales y gobernadores de las provincias mineras debaten las condiciones fiscales del nuevo régimen de incentivo para grandes inversiones.",
    category: "Economía"
  },
  {
    title: "Veladero extiende su vida útil tras optimizaciones operativas y exploraciones en Jáchal",
    link: "https://aceroyroca.com/veladero-vida-util",
    pubDate: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    source: "El Zonda",
    contentSnippet: "La mina de oro y plata de Iglesia prevé continuar operaciones con nuevas fases de lixiviación, asegurando puestos de trabajo clave para la región sanjuanina.",
    category: "Oro"
  },
  {
    title: "Litio en el NOA: Salta, Jujuy y Catamarca coordinan regalías y desarrollo de proveedores",
    link: "https://aceroyroca.com/litio-regalias-noa",
    pubDate: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    source: "Mining Press",
    contentSnippet: "La Mesa del Litio avanza en un esquema tributario unificado y en el fortalecimiento de la cadena de valor local frente al aumento de la demanda global.",
    category: "Litio"
  }
];

export default async function handler(req: any, res: any) {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const newsItems: any[] = [];
    const customFeeds = req.query?.feeds
      ? String(req.query.feeds).split(',').map((f: string) => decodeURIComponent(f.trim())).filter(Boolean)
      : [];

    const googleNewsQuery = encodeURIComponent('mineria argentina OR cobre san juan OR litio argentina OR proyecto josemaria OR los azules');
    const defaultFeeds = [
      `https://news.google.com/rss/search?q=${googleNewsQuery}&hl=es-419&gl=AR&ceid=AR:es-419`,
      'https://www.mining.com/feed/'
    ];
    const feedUrls = customFeeds.length > 0 ? customFeeds : defaultFeeds;

    for (const feedUrl of feedUrls) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed?.items) {
          feed.items.slice(0, 15).forEach((item: any) => {
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
              category: guessCategory(title + ' ' + (item.contentSnippet || ''))
            });
          });
        }
      } catch (e) {
        console.error('Error feed:', feedUrl, e);
      }
    }

    }

    let sortedNews = newsItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    sortedNews = sortedNews.slice(0, 30);

    if (sortedNews.length === 0) {
      sortedNews = MOCK_NEWS;
    }

    res.status(200).json(sortedNews);
  } catch (error: any) {
    console.error('Error en el agregador de noticias:', error);
    res.status(200).json(MOCK_NEWS); // Retornar mock news en caso de fallo general para que la app no rompa
  }
}

// Función auxiliar simple para categorizar noticias por palabras clave
function guessCategory(text: string): string {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('cobre') || lowercaseText.includes('copper') || lowercaseText.includes('azules') || lowercaseText.includes('josemaría') || lowercaseText.includes('pachón')) {
    return 'Cobre';
  }
  if (lowercaseText.includes('litio') || lowercaseText.includes('lithium') || lowercaseText.includes('cauchari') || lowercaseText.includes('solaroz')) {
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
