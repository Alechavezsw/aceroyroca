import type { GlossaryTerm } from '../context/AppContext';
import { IMAGE_FILE_SUFFIX } from '../data/editorialGuide';

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  done: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || '';
}

function extractBoldBlocks(content: string): string[] {
  const blocks: string[] = [];
  const re = /\*\*([^*\n][^*]*)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

function extractSection(content: string, heading: string): string {
  const re = new RegExp(
    `^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`,
    'im'
  );
  const match = content.match(re);
  return match?.[1]?.trim() || '';
}

function hasFirma(content: string): boolean {
  return /\*\*Por\s+[^*\n]+\*\*/i.test(content);
}

function hasCopete(content: string): boolean {
  const blocks = extractBoldBlocks(content);
  const copete = blocks.find(
    b =>
      !/^Por\s/i.test(b) &&
      !/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}$/i.test(b) &&
      !/^Fuente:/i.test(b) &&
      b.length > 20 &&
      !b.startsWith('Extracto:') &&
      !b.startsWith('Categoría:')
  );
  if (!copete) return false;
  const words = countWords(copete);
  return words >= 25 && words <= 55;
}

function hasLoEsencial(content: string): boolean {
  const section = extractSection(content, 'LO ESENCIAL EN 10 SEGUNDOS');
  if (!section) return false;
  const words = countWords(section.replace(/\*\*/g, ''));
  return words >= 50 && words <= 95;
}

function hasStructure(content: string): boolean {
  const h2 = content.match(/^##\s+/gm) || [];
  return h2.length >= 3;
}

function hasH3(content: string): boolean {
  return /^###\s+/m.test(content);
}

function hasDatosDuros(content: string): boolean {
  const signals = [
    /\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i,
    /\d+[\d.,]*\s*(%|por ciento|km|metros|hectáreas|ha|empleados|millones|USD|u\$s|\$)/i,
    /\d{1,2}:\d{2}/,
    /\d+[\d.,]*/,
    /tel[eé]fono|mail|@|whatsapp/i
  ];
  const hits = signals.filter(re => re.test(content)).length;
  return hits >= 3;
}

function hasFuente(content: string): boolean {
  return /\*\*Fuente:\*\*/i.test(content) || /^Fuente:/im.test(content);
}

function hasImagenesSugeridas(content: string): boolean {
  if (!/##\s+IMÁGENES SUGERIDAS/i.test(content)) return false;
  const section = extractSection(content, 'IMÁGENES SUGERIDAS');
  const hasAlt = /alt text:/i.test(section);
  const hasFile = section.includes(IMAGE_FILE_SUFFIX);
  const imageCount = (section.match(/\*\*Imagen/gi) || []).length;
  return hasAlt && hasFile && imageCount >= 3;
}

function hasEntradaWordpress(content: string): boolean {
  const section = extractSection(content, 'ENTRADA WORDPRESS');
  if (!section) return false;
  return (
    /Extracto:/i.test(section) &&
    /Categoría:/i.test(section) &&
    /Tags:/i.test(section) &&
    /Slug:/i.test(section) &&
    /noticias\//i.test(section)
  );
}

function hasRecuadroNotBlockquote(content: string): boolean {
  const usesBlockquote = /^>\s/m.test(content);
  const hasRecuadro = /###\s+Recuadro sugerido/i.test(content);
  return hasRecuadro && !usesBlockquote;
}

function hasClosing(content: string): boolean {
  return /##\s+Cierre/i.test(content) || /\*\*Fuente:\*\*/i.test(content);
}

function hasSources(content: string): boolean {
  return hasFuente(content) || /(según|informó|comunicó|reportó|http|www\.)/i.test(content);
}

function glossaryTermsInContent(content: string, glossary: GlossaryTerm[]): GlossaryTerm[] {
  const lower = content.toLowerCase();
  return glossary.filter(g => {
    const term = g.term.toLowerCase();
    if (term.length < 4) return false;
    return lower.includes(term);
  });
}

function technicalTermsExplained(content: string, terms: GlossaryTerm[]): boolean {
  if (terms.length === 0) return true;
  const explained = terms.filter(t => {
    const term = t.term.toLowerCase();
    const idx = content.toLowerCase().indexOf(term);
    if (idx === -1) return true;
    const window = content.slice(idx, idx + term.length + 120);
    return window.length > term.length + 30 || /(\(|—|:| es | significa | se refiere)/i.test(window);
  });
  return explained.length >= Math.ceil(terms.length * 0.6);
}

function titleWordCountOk(content: string): boolean {
  const title = extractTitle(content);
  if (!title) return false;
  const words = countWords(title);
  return words >= 10 && words <= 18;
}

export function buildColumnChecklist(
  content: string,
  wordsCount: number,
  wordGoalMin: number,
  wordGoalMax: number,
  glossary: GlossaryTerm[]
): ChecklistItem[] {
  const detectedTerms = glossaryTermsInContent(content, glossary);
  const titleWords = countWords(extractTitle(content));

  return [
    {
      id: 'words',
      label: `Extensión (${wordGoalMin}–${wordGoalMax} palabras)`,
      hint: `Actual: ${wordsCount} palabras`,
      done: wordsCount >= wordGoalMin && wordsCount <= wordGoalMax + 100
    },
    {
      id: 'title',
      label: 'Título H1 (~14 palabras)',
      hint: titleWords ? `Actual: ${titleWords} palabras` : 'Falta # Título',
      done: titleWordCountOk(content)
    },
    {
      id: 'firma',
      label: 'Firma y fecha',
      hint: '**Por …** y **fecha**',
      done: hasFirma(content)
    },
    {
      id: 'copete',
      label: 'Copete (~40 palabras)',
      hint: 'Párrafo en negrita tras la fecha',
      done: hasCopete(content)
    },
    {
      id: 'lo-esencial',
      label: 'Lo esencial en 10 segundos',
      hint: 'Sección ~70 palabras con datos clave',
      done: hasLoEsencial(content)
    },
    {
      id: 'structure',
      label: 'Bloques H2 y H3',
      hint: 'Subtítulos principales y subtemas',
      done: hasStructure(content) && hasH3(content)
    },
    {
      id: 'datos',
      label: 'Datos duros',
      hint: 'Fechas, cifras, %, contactos, plazos',
      done: hasDatosDuros(content)
    },
    {
      id: 'recuadro',
      label: 'Recuadro (sin cita >)',
      hint: '### Recuadro sugerido, no blockquote',
      done: hasRecuadroNotBlockquote(content)
    },
    {
      id: 'sources',
      label: 'Fuente citada',
      hint: '**Fuente:** al cierre del cuerpo',
      done: hasSources(content)
    },
    {
      id: 'images',
      label: 'Imágenes sugeridas',
      hint: `3+ fotos con ${IMAGE_FILE_SUFFIX}`,
      done: hasImagenesSugeridas(content)
    },
    {
      id: 'wordpress',
      label: 'Entrada WordPress',
      hint: 'Extracto, tags, slug noticias/, SEO',
      done: hasEntradaWordpress(content)
    },
    {
      id: 'technical',
      label: 'Tecnicismos explicados',
      hint: detectedTerms.length
        ? `${detectedTerms.length} término(s) del glosario`
        : 'Sin tecnicismos del glosario aún',
      done: technicalTermsExplained(content, detectedTerms)
    },
    {
      id: 'closing',
      label: 'Cierre editorial',
      hint: 'Sección ## Cierre o cierre antes de Fuente',
      done: hasClosing(content)
    }
  ];
}

export { glossaryTermsInContent };
