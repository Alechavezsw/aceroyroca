export interface DraftSource {
  title: string;
  snippet?: string;
  source?: string;
  link?: string;
  pubDate?: string;
  analysis?: string;
}

export function buildDraftFromNews(item: DraftSource): { title: string; content: string } {
  const dateStr = item.pubDate
    ? new Date(item.pubDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-AR');

  return {
    title: item.title.slice(0, 120),
    content: `# ${item.title}

> **Fuente:** ${item.source || 'Sin fuente'} · ${dateStr}
${item.link && item.link !== '#' ? `> **Enlace:** ${item.link}` : ''}

## Contexto
${item.snippet || item.analysis || 'Desarrollar el contexto de la noticia aquí.'}

## Implicancias para Argentina
¿Qué significa esto para el sector minero nacional, San Juan o la cadena de valor?

## Datos clave
- 
- 

## Opinión editorial
[Escribe tu posición clara para la columna dominical]
`
  };
}

export function buildDraftFromAnalysis(title: string, analysis: string, source?: string): { title: string; content: string } {
  return {
    title: title.slice(0, 120),
    content: `# ${title}

${source ? `> Basado en análisis del Agente IA · ${source}\n` : ''}
## Análisis del agente
${analysis.trim()}

## Desarrollo editorial
Expandí el análisis anterior con tu voz periodística:

## Opinión
[Tu conclusión y posición editorial]
`
  };
}
