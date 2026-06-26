import type { GlossaryTerm } from '../context/AppContext';

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  done: boolean;
}

function hasHook(content: string): boolean {
  const body = content.replace(/^#\s.+$/m, '').trim();
  const firstBlock = body.split(/\n\n+/)[0]?.replace(/^>\s.+/gm, '').trim() || '';
  return firstBlock.length >= 80;
}

function hasClosing(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /##\s*(opinión|conclusión|cierre)/i.test(content) ||
    (content.split(/\n\n+/).filter(Boolean).length >= 3 &&
      /(en conclusión|en definitiva|el desafío|la oportunidad|san juan|argentina debe)/i.test(lower.slice(-600)))
  );
}

function hasSources(content: string): boolean {
  return /(fuente|http|www\.|según|de acuerdo con|informó|comunicó|reportó)/i.test(content);
}

function hasStructure(content: string): boolean {
  return /^##\s/m.test(content);
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

export function buildColumnChecklist(
  content: string,
  wordsCount: number,
  wordGoalMin: number,
  wordGoalMax: number,
  glossary: GlossaryTerm[]
): ChecklistItem[] {
  const detectedTerms = glossaryTermsInContent(content, glossary);

  return [
    {
      id: 'words',
      label: `Meta de palabras (${wordGoalMin}–${wordGoalMax})`,
      hint: `Actual: ${wordsCount} palabras`,
      done: wordsCount >= wordGoalMin
    },
    {
      id: 'hook',
      label: 'Gancho inicial',
      hint: 'Primer párrafo con al menos 80 caracteres',
      done: hasHook(content)
    },
    {
      id: 'structure',
      label: 'Estructura con secciones',
      hint: 'Usá ## para subtítulos',
      done: hasStructure(content)
    },
    {
      id: 'sources',
      label: 'Fuentes citadas',
      hint: 'Mencioná fuente, enlace o atribución',
      done: hasSources(content)
    },
    {
      id: 'technical',
      label: 'Tecnicismos explicados',
      hint: detectedTerms.length
        ? `${detectedTerms.length} término(s) del glosario detectado(s)`
        : 'Sin tecnicismos del glosario aún',
      done: technicalTermsExplained(content, detectedTerms)
    },
    {
      id: 'closing',
      label: 'Cierre con opinión',
      hint: 'Sección de opinión o párrafo conclusivo',
      done: hasClosing(content)
    }
  ];
}

export { glossaryTermsInContent };
