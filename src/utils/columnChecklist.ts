import type { GlossaryTerm } from '../context/AppContext';
import { IMAGE_FILE_SUFFIX, IMAGE_PIE_CIERRE } from '../data/editorialGuide';

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

function hasComparte(content: string): boolean {
  return /Comparte la noticia/i.test(content);
}

function hasImagenPrincipal(content: string): boolean {
  return (
    /Imagen principal:/i.test(content) &&
    /Nombre de archivo:/i.test(content) &&
    content.includes(IMAGE_FILE_SUFFIX)
  );
}

function hasCopete(content: string): boolean {
  const blocks = extractBoldBlocks(content);
  const copete = blocks.find(
    b =>
      !/^Por\s/i.test(b) &&
      !/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}$/i.test(b) &&
      !/^Fuente:/i.test(b) &&
      !/^Imagen/i.test(b) &&
      b.length > 20 &&
      !b.startsWith('Extracto:') &&
      !b.startsWith('Categoría:')
  );
  if (!copete) return false;
  const words = countWords(copete);
  return words >= 25 && words <= 48;
}

function hasLoEsencial(content: string): boolean {
  const section = extractSection(content, 'LO ESENCIAL EN 10 SEGUNDOS');
  if (!section) return false;
  const words = countWords(section.replace(/\*\*/g, ''));
  return words >= 30 && words <= 58;
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
  return signals.filter(re => re.test(content)).length >= 3;
}

function hasCitas(content: string): boolean {
  const hasQuotedItalic = /\*["«][^*"»]+["»]\*/.test(content) || /\*".*?"\*/.test(content);
  const hasVerb = /(explica|señala|afirma|sostiene|advierte|plantea|remarca|recuerda|describe)/i.test(content);
  return hasQuotedItalic || hasVerb;
}

function hasLeeTambien(content: string): boolean {
  const section = extractSection(content, 'LEÉ TAMBIÉN');
  if (!section) return false;
  const links = section.match(/aceroyroca\.com/gi) || [];
  return links.length >= 1 && links.length <= 3;
}

function hasFuente(content: string): boolean {
  return /\*\*Fuente:\*\*/i.test(content) || /^Fuente:/im.test(content);
}

function hasImagenesNota(content: string): boolean {
  const section =
    extractSection(content, 'IMÁGENES PARA LA NOTA') ||
    extractSection(content, 'IMÁGENES SUGERIDAS');
  if (!section) return false;
  return (
    /alt text:/i.test(section) &&
    (section.includes(IMAGE_FILE_SUFFIX) || section.includes('.webp')) &&
    (section.match(/\*\*Imagen/gi) || []).length >= 1
  );
}

function hasEntradaWordpress(content: string): boolean {
  const section = extractSection(content, 'ENTRADA WORDPRESS');
  if (!section) return false;
  const tagsLine = section.match(/Tags:\s*([\s\S]*?)(?:\n\*\*|$)/i)?.[1] || '';
  const tagCount = tagsLine.split(',').map(t => t.trim()).filter(Boolean).length;
  const meta = section.match(/Metadescripción:\s*([\s\S]*?)$/i)?.[1]?.trim() || '';
  return (
    /Extracto:/i.test(section) &&
    /Categoría:/i.test(section) &&
    /Slug:/i.test(section) &&
    /noticias\//i.test(section) &&
    tagCount >= 8 &&
    meta.length >= 100
  );
}

function hasClosing(content: string): boolean {
  return /##\s+Cierre/i.test(content);
}

function hasPieCierre(content: string): boolean {
  return content.includes(IMAGE_PIE_CIERRE) || /Contenido Original de ACERO Y ROCA/i.test(content);
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
      label: 'Título H1 (máx. 14 palabras)',
      hint: titleWords ? `Actual: ${titleWords} palabras` : 'Falta # Título',
      done: titleWordCountOk(content)
    },
    {
      id: 'firma',
      label: 'Firma, fecha y compartir',
      hint: '**Por …**, fecha y "Comparte la noticia"',
      done: hasFirma(content) && hasComparte(content)
    },
    {
      id: 'copete',
      label: 'Copete (máx. 40 palabras)',
      hint: 'Qué, quién, dónde y por qué importa',
      done: hasCopete(content)
    },
    {
      id: 'imagen-principal',
      label: 'Imagen principal',
      hint: `Archivo, alt y pie con ${IMAGE_FILE_SUFFIX}`,
      done: hasImagenPrincipal(content)
    },
    {
      id: 'lo-esencial',
      label: 'Lo esencial en 10 segundos',
      hint: 'Máx. ~50 palabras con datos clave',
      done: hasLoEsencial(content)
    },
    {
      id: 'structure',
      label: 'Cuerpo H2 y H3',
      hint: 'Solo mayúscula inicial en títulos',
      done: hasStructure(content) && hasH3(content)
    },
    {
      id: 'datos',
      label: 'Datos duros',
      hint: 'Fechas, cifras, %, inversión, contactos',
      done: hasDatosDuros(content)
    },
    {
      id: 'citas',
      label: 'Citas textuales',
      hint: '*"frase"*, afirma / explica / señala',
      done: hasCitas(content)
    },
    {
      id: 'lee-tambien',
      label: 'Leé también',
      hint: '1–3 enlaces reales a aceroyroca.com',
      done: hasLeeTambien(content)
    },
    {
      id: 'closing',
      label: 'Cierre analítico',
      hint: 'Impacto territorial/industrial, sin chivo',
      done: hasClosing(content)
    },
    {
      id: 'sources',
      label: 'Fuente',
      hint: 'Entrevista, documento u organismo',
      done: hasFuente(content)
    },
    {
      id: 'images',
      label: 'Imágenes para la nota',
      hint: `Archivos ${IMAGE_FILE_SUFFIX} + pie obligatorio`,
      done: hasImagenesNota(content) && hasPieCierre(content)
    },
    {
      id: 'wordpress',
      label: 'Entrada WordPress',
      hint: 'Extracto 25–35 pal., 10 tags, meta 140–155 car.',
      done: hasEntradaWordpress(content)
    },
    {
      id: 'technical',
      label: 'Tecnicismos explicados',
      hint: detectedTerms.length
        ? `${detectedTerms.length} término(s) del glosario`
        : 'Sin tecnicismos del glosario aún',
      done: technicalTermsExplained(content, detectedTerms)
    }
  ];
}

export { glossaryTermsInContent };
