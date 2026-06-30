import { buildInformativeNoteTemplate } from '../data/editorialGuide';

export interface DraftSource {
  title: string;
  snippet?: string;
  source?: string;
  link?: string;
  pubDate?: string;
  analysis?: string;
}

function slugFromTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function buildDraftFromNews(item: DraftSource): { title: string; content: string } {
  const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
  const title = item.title.slice(0, 140);
  const slug = slugFromTitle(title);
  const lead = item.snippet || item.analysis || 'Completar con el dato central de la noticia.';
  const fuente = `${item.source || 'Completar fuente'}${item.link && item.link !== '#' ? ` · ${item.link}` : ''}`;

  let content = buildInformativeNoteTemplate('Redacción Acero y Roca', pubDate);
  content = content
    .replace(
      '# Título de la nota con aproximadamente catorce palabras informativas y con gancho periodístico',
      `# ${title}`
    )
    .replace(
      '**Copete de unas cuarenta palabras: protagonista, lugar, dato clave e importancia del tema en una sola frase contundente.**',
      `**${lead.slice(0, 280)}**`
    )
    .replace(
      'Resumen de unas setenta palabras con los datos clave: quién, qué, dónde, cuándo, por qué importa, cuánto implica y para quién está dirigido.',
      `${lead}\n\n${item.link && item.link !== '#' ? `Referencia: ${item.link}` : 'Completar resumen con datos duros (quién, qué, dónde, cuándo, cuánto).'}`
    )
    .replace('**Fuente:** fuente principal de la información.', `**Fuente:** ${fuente}`)
    .replace('noticias/slug-conciso-de-la-nota', `noticias/${slug || 'borrador-noticia'}`);

  return { title: title.slice(0, 120), content };
}

export function buildDraftFromAnalysis(title: string, analysis: string, source?: string): { title: string; content: string } {
  const slug = slugFromTitle(title);
  const trimmedTitle = title.slice(0, 140);

  let content = buildInformativeNoteTemplate('Redacción Acero y Roca');
  content = content
    .replace(
      '# Título de la nota con aproximadamente catorce palabras informativas y con gancho periodístico',
      `# ${trimmedTitle}`
    )
    .replace(
      '## Segundo subtítulo H2\n\nDesarrollo con información central, cifras, antecedentes y explicación simple.',
      `## Segundo subtítulo H2\n\n${analysis.trim()}${source ? `\n\n_Basado en análisis del Agente IA · ${source}_` : ''}`
    )
    .replace('noticias/slug-conciso-de-la-nota', `noticias/${slug || 'borrador-analisis'}`);

  return {
    title: title.slice(0, 120),
    content
  };
}
