import { EDITORIAL_SYSTEM_PROMPT } from '../../shared/editorialPrompt';

export { EDITORIAL_SYSTEM_PROMPT };

export const IMAGE_FILE_SUFFIX = '.aceroyroca.webp';
export const IMAGE_PIE_CIERRE = 'Contenido Original de ACERO Y ROCA – Prohibida su reproducción';

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

function wpBlock(): string {
  return `## ENTRADA WORDPRESS

**Extracto:**  
Mini bajada de 25 a 35 palabras con conflicto, dato, actor e impacto (no repetir el título).

**Categoría:**  
Minería

**Tags:**  
tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10,

**Frase clave:**  
Máximo cuatro palabras

**Título SEO:**  
Máximo siete palabras

**Slug:**  
noticias/slug-conciso-de-la-nota

**Metadescripción:**  
Entre 140 y 155 caracteres con la keyword principal y el impacto de la nota.`;
}

export function buildInformativeNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const fecha = formatNoteDate(date);
  return `# Título periodístico con gancho de hasta catorce palabras claras y con valor SEO

**Por ${author}**  
**${fecha}**

Comparte la noticia

**Copete de hasta cuarenta palabras: qué pasa, quién lo dice, dónde ocurre y por qué importa.**

**Imagen principal:** descripción de la escena.  
**Nombre de archivo:** titular-descriptivo${IMAGE_FILE_SUFFIX}  
**Alt text:** descripción técnica con protagonista y lugar.  
**Pie de foto:** epígrafe breve e informativo. ${IMAGE_PIE_CIERRE}

## LO ESENCIAL EN 10 SEGUNDOS

Resumen objetivo de hasta cincuenta palabras: qué, quién, cuándo, cómo, dónde, por qué, para qué y cuánto si hay dato duro.

## Primer subtítulo H2

Desarrollo con contexto, protagonista, lugar, fecha y dato fuerte en voz activa.

## Segundo subtítulo H2

Información central con cifras, antecedentes y explicación clara. Citas textuales en cursiva: *"frase del entrevistado"*, señala.

### Subtítulo H3 si corresponde

Detalle complementario del bloque anterior.

## Tercer subtítulo H2

Impacto territorial, industrial, económico o comunitario con datos verificables.

## LEÉ TAMBIÉN

- [Título real de nota relacionada](https://aceroyroca.com/noticias/url-real)
- [Segunda nota real](https://aceroyroca.com/noticias/url-real)
- [Tercera nota real](https://aceroyroca.com/noticias/url-real)

## Cierre

Cierre analítico y objetivo que proyecte impacto en el territorio o el sector. Sin chivo, cita abierta ni remate publicitario.

**Fuente:** entrevista, documento u organismo utilizado.

---

## IMÁGENES PARA LA NOTA

**Imagen H2 1:** descripción.  
**Nombre de archivo:** bloque-1${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}

**Imagen H2 2:** descripción.  
**Nombre de archivo:** bloque-2${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}

---

${wpBlock()}`;
}

export function buildInvestigationNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const base = buildInformativeNoteTemplate(author, date);
  return base
    .replace(
      '## Tercer subtítulo H2',
      `## Cuarto subtítulo H2

Profundización, conflicto o antecedentes con más datos duros.

## Quinto subtítulo H2

Análisis territorial, regulatorio o comunitario ampliado.

## Tercer subtítulo H2`
    )
    .replace(
      '**Imagen H2 2:** descripción.',
      `**Imagen H2 2:** descripción.

**Imagen H2 3:** descripción.  
**Nombre de archivo:** bloque-3${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}`
    );
}

export function buildInterviewNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const fecha = formatNoteDate(date);
  return `# Título de la entrevista con gancho periodístico de hasta catorce palabras

**Por ${author}**  
**${fecha}**

Comparte la noticia

**Copete de hasta cuarenta palabras: quién es el protagonista, de qué se habla, dónde y por qué importa hoy.**

**Imagen principal:** retrato o escena del entrevistado.  
**Nombre de archivo:** entrevista-nombre-apellido${IMAGE_FILE_SUFFIX}  
**Alt text:** Nombre Apellido en contexto del tema.  
**Pie de foto:** cargo y lugar. ${IMAGE_PIE_CIERRE}

## LO ESENCIAL EN 10 SEGUNDOS

Hasta cincuenta palabras con lo central de la entrevista y el dato más relevante.

## Presentación del entrevistado

Nombre completo, cargo, lugar, trayectoria y relación con el hecho noticioso.

## La conversación

### Sobre el contexto del sector

Desarrollo con cita textual: *"frase"*, explica **Nombre Apellido**.

### Sobre el proyecto o la operación

Desarrollo con datos duros y cita: *"frase"*, afirma.

### Sobre desafíos (agua, comunidad, regulación)

Desarrollo con cita: *"frase"*, advierte.

## LEÉ TAMBIÉN

- [Nota real relacionada](https://aceroyroca.com/noticias/url-real)

## Cierre

Proyección analítica del impacto territorial, industrial o económico de lo expuesto.

**Fuente:** entrevista a [Nombre Apellido], [cargo], [fecha].

---

## IMÁGENES PARA LA NOTA

**Imagen adicional:** descripción.  
**Nombre de archivo:** entrevista-detalle${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}

---

${wpBlock().replace('noticias/slug-conciso-de-la-nota', 'noticias/slug-entrevista')}`;
}

export function buildCourseNoteTemplate(author = 'Redacción Acero y Roca', date = new Date()): string {
  const fecha = formatNoteDate(date);
  return `# Título del curso o capacitación con gancho de hasta catorce palabras

**Por ${author}**  
**${fecha}**

Comparte la noticia

**Copete de hasta cuarenta palabras: nombre del curso, para quién es, modalidad y por qué importa en minería.**

**Imagen principal:** actividad o aula del curso.  
**Nombre de archivo:** curso-nombre${IMAGE_FILE_SUFFIX}  
**Alt text:** descripción con lugar.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}

## LO ESENCIAL EN 10 SEGUNDOS

Nombre, fechas, duración, modalidad, precio o gratuidad, cupos y cómo inscribirse (máx. 50 palabras).

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
- **Teléfono:**
- **Mail:**
- **Link de inscripción:**

## Por qué importa para el sector

Contexto territorial, minero o formativo con datos concretos.

## Cierre

Para quién es, cuánto cuesta, cuánto dura y cómo inscribirse.

**Fuente:** organizador o institución.

---

## IMÁGENES PARA LA NOTA

**Imagen 2:** descripción.  
**Nombre de archivo:** curso-2${IMAGE_FILE_SUFFIX}  
**Alt text:** texto alternativo.  
**Pie de foto:** epígrafe. ${IMAGE_PIE_CIERRE}

---

${wpBlock().replace('Minería', 'Capacitación').replace('noticias/slug-conciso-de-la-nota', 'noticias/slug-del-curso')}`;
}

export function getColumnTemplates(author = 'Redacción Acero y Roca'): ColumnTemplate[] {
  return [
    {
      id: 'informativa',
      name: 'Nota informativa',
      description: `700–1000 palabras · estructura oficial Acero y Roca`,
      noteType: 'informativa',
      content: buildInformativeNoteTemplate(author)
    },
    {
      id: 'investigacion',
      name: 'Nota de investigación',
      description: `1000–1500 palabras · informe especial`,
      noteType: 'investigacion',
      content: buildInvestigationNoteTemplate(author)
    },
    {
      id: 'entrevista',
      name: 'Nota de entrevista',
      description: 'Citas textuales, presentación del entrevistado y cierre analítico',
      noteType: 'informativa',
      content: buildInterviewNoteTemplate(author)
    },
    {
      id: 'curso',
      name: 'Nota sobre curso',
      description: 'Horarios, precio, modalidad y contacto obligatorios',
      noteType: 'informativa',
      content: buildCourseNoteTemplate(author)
    }
  ];
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = getColumnTemplates();
