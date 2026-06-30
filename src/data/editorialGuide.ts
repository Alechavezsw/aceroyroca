import { EDITORIAL_SYSTEM_PROMPT } from '../../shared/editorialPrompt';

export { EDITORIAL_SYSTEM_PROMPT };

export const IMAGE_FILE_SUFFIX = '.acero-y-roca.webp';

export const NOTE_GOALS = {
  informativa: { min: 700, max: 1000, photos: '3–4' },
  investigacion: { min: 1000, max: 1500, photos: '5–7' }
} as const;
export type NoteEditorialType = keyof typeof NOTE_GOALS;

export interface ColumnTemplate {
  id: string;
  name: string;
  description: string;
  noteType: NoteEditorialType;
  content: string;
}

function formatNoteDate(date = new Date()): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function buildInformativeNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const fecha = formatNoteDate(date);
  return `# Título de la nota con aproximadamente catorce palabras informativas y con gancho periodístico

**Por ${author}**  
**${fecha}**

**Copete de unas cuarenta palabras: protagonista, lugar, dato clave e importancia del tema en una sola frase contundente.**

## LO ESENCIAL EN 10 SEGUNDOS

Resumen de unas setenta palabras con los datos clave: quién, qué, dónde, cuándo, por qué importa, cuánto implica y para quién está dirigido.

## Primer subtítulo H2

Desarrollo inicial con contexto, protagonista, lugar, fecha y dato fuerte.

## Segundo subtítulo H2

Desarrollo con información central, cifras, antecedentes y explicación simple.

### Subtítulo H3 si corresponde

Detalle complementario o bloque específico.

### Recuadro sugerido

**Frase corta destacada en negrita para colocar en recuadro visual.**

## Tercer subtítulo H2

Impacto económico, social, territorial, minero o comunitario.

## Cierre

Cierre con mirada editorial, sin exagerar ni sonar institucional.

**Fuente:** fuente principal de la información.

---

## IMÁGENES SUGERIDAS

**Imagen destacada:** descripción de la escena principal.  
**Nombre de archivo:** nombre-descriptivo${IMAGE_FILE_SUFFIX}  
**Alt text:** descripción clara con protagonista y lugar.  
**Caption:** epígrafe que aporta información sin repetir el alt.  
**Leyenda si es creación propia:** Contenido exclusivo de Acero y Roca. Prohibida su reproducción.

**Imagen 2:** descripción.  
**Nombre de archivo:** nombre-descriptivo-2${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.

**Imagen 3:** descripción.  
**Nombre de archivo:** nombre-descriptivo-3${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.

---

## ENTRADA WORDPRESS

**Extracto:**  
Máximo veinte palabras con el dato central de la nota.

**Categoría:**  
Minería

**Tags:**  
Tag 1, Tag 2, Tag 3, Tag 4, Tag 5

**Frase clave:**  
Máximo cuatro palabras

**Título SEO:**  
Máximo siete palabras

**Slug:**  
noticias/slug-conciso-de-la-nota

**Metadescripción:**  
Máximo quince palabras.`;
}

export function buildInvestigationNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const base = buildInformativeNoteTemplate(author, date);
  const extraImages = `
**Imagen 4:** descripción.  
**Nombre de archivo:** nombre-descriptivo-4${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.

**Imagen 5:** descripción.  
**Nombre de archivo:** nombre-descriptivo-5${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.
`;
  return base.replace(
    '**Imagen 3:** descripción.',
    `**Imagen 3:** descripción.${extraImages}`
  ).replace(
    '## Tercer subtítulo H2',
    `## Cuarto subtítulo H2

Profundización, antecedentes o conflicto central del tema.

## Quinto subtítulo H2

Análisis territorial, económico o comunitario con más datos duros.

## Tercer subtítulo H2`
  );
}

export function buildCourseNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const fecha = formatNoteDate(date);
  return `# Título del curso o capacitación con gancho periodístico de unas catorce palabras

**Por ${author}**  
**${fecha}**

**Copete de unas cuarenta palabras: nombre del curso, para quién es, modalidad y por qué importa en el sector minero.**

## LO ESENCIAL EN 10 SEGUNDOS

Resumen con nombre del curso, fechas, duración, modalidad, precio o gratuidad, cupos y cómo inscribirse.

## El curso en detalle

- **Nombre del curso:**
- **Fecha de inicio:**
- **Cierre de inscripción:**
- **Duración:**
- **Horarios:**
- **Modalidad:** presencial / virtual / mixta
- **Lugar:**
- **Precio:** / Gratuito
- **Cupos:**
- **Destinatarios:**
- **Requisitos:**
- **Certificación:**
- **Organiza:**
- **Avala / certifica:**
- **Teléfono:**
- **Mail:**
- **Link de inscripción:**

## Por qué importa para el sector

Desarrollo con contexto territorial, minero o formativo.

### Recuadro sugerido

**Frase destacada de un referente o del organizador sobre el valor del curso.**

## Cierre

Cierre claro indicando para quién es, cuánto cuesta, cuánto dura y cómo inscribirse.

**Fuente:** organizador o institución que brinda la información.

---

## IMÁGENES SUGERIDAS

**Imagen destacada:** actividad, aula o referente del curso.  
**Nombre de archivo:** curso-nombre${IMAGE_FILE_SUFFIX}  
**Alt text:** descripción con lugar y actividad.  
**Caption:** epígrafe informativo.

**Imagen 2:** descripción.  
**Nombre de archivo:** curso-nombre-2${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.

**Imagen 3:** descripción.  
**Nombre de archivo:** curso-nombre-3${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Caption:** epígrafe.

---

## ENTRADA WORDPRESS

**Extracto:**  
Máximo veinte palabras.

**Categoría:**  
Capacitación

**Tags:**  
curso, minería, formación, San Juan, capacitación

**Frase clave:**  
Máximo cuatro palabras

**Título SEO:**  
Máximo siete palabras

**Slug:**  
noticias/slug-del-curso

**Metadescripción:**  
Máximo quince palabras.`;
}

export function getColumnTemplates(author = 'Redacción Acero y Roca'): ColumnTemplate[] {
  return [
    {
      id: 'informativa',
      name: 'Nota informativa',
      description: `700–1000 palabras · ${NOTE_GOALS.informativa.photos} fotos · estructura oficial Acero y Roca`,
      noteType: 'informativa',
      content: buildInformativeNoteTemplate(author)
    },
    {
      id: 'investigacion',
      name: 'Nota de investigación',
      description: `1000–1500 palabras · ${NOTE_GOALS.investigacion.photos} fotos · informe especial`,
      noteType: 'investigacion',
      content: buildInvestigationNoteTemplate(author)
    },
    {
      id: 'curso',
      name: 'Nota sobre curso',
      description: 'Capacitación con horarios, precio, modalidad y contacto obligatorios',
      noteType: 'informativa',
      content: buildCourseNoteTemplate(author)
    }
  ];
}

/** Compatibilidad con import existente */
export const COLUMN_TEMPLATES: ColumnTemplate[] = getColumnTemplates();
