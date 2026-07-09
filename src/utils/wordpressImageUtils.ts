import JSZip from 'jszip';
import { IMAGE_FILE_SUFFIX } from '../data/editorialGuide';

export interface WordPressImageVariant {
  label: string;
  filename: string;
  width: number;
  height: number;
  blob: Blob;
}

export interface WordPressImageOutput {
  slug: string;
  alt: string;
  caption: string;
  originalName: string;
  variants: WordPressImageVariant[];
  htmlGutenberg: string;
  htmlClassic: string;
  markdown: string;
}

export interface WordPressConvertOptions {
  alt: string;
  caption: string;
  slug?: string;
  quality?: number;
  siteUrl?: string;
}

const WP_SIZES = {
  full: 1920,
  large: 1024,
  medium: 300,
  thumbnail: 150
} as const;

export function slugifyForWordPress(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'imagen-acero-roca';
}

function wpFilename(slug: string, width: number, height: number, isOriginal = false): string {
  if (isOriginal) return `${slug}${IMAGE_FILE_SUFFIX}`;
  return `${slug}-${width}x${height}${IMAGE_FILE_SUFFIX}`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo leer "${file.name}". Usá JPG, PNG o WebP.`));
    };
    img.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('No se pudo exportar la imagen.'))),
      'image/webp',
      quality
    );
  });
}

async function resizeMaxWidth(
  img: HTMLImageElement,
  maxWidth: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible.');
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await canvasToWebp(canvas, quality);
  return { blob, width, height };
}

async function cropThumbnail(
  img: HTMLImageElement,
  size: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.floor((img.naturalWidth - side) / 2);
  const sy = Math.floor((img.naturalHeight - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible.');
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const blob = await canvasToWebp(canvas, quality);
  return { blob, width: size, height: size };
}

function buildUploadPath(siteUrl: string, filename: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${base}/wp-content/uploads/${year}/${month}/${filename}`;
}

function buildGutenbergHtml(
  uploadUrl: string,
  alt: string,
  caption: string,
  width: number,
  height: number
): string {
  const captionBlock = caption.trim()
    ? `\n<figcaption class="wp-element-caption">${escapeHtml(caption.trim())}</figcaption>`
    : '';

  return `<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="${uploadUrl}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" class="wp-image-"/>${captionBlock}
</figure>
<!-- /wp:image -->`;
}

function buildClassicHtml(
  uploadUrl: string,
  alt: string,
  caption: string,
  width: number,
  height: number
): string {
  const captionHtml = caption.trim()
    ? `\n<figcaption class="wp-caption-text">${escapeHtml(caption.trim())}</figcaption>`
    : '';

  return `<figure class="wp-caption aligncenter" style="width: ${width}px">
<img src="${uploadUrl}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" class="size-large wp-image-"/>${captionHtml}
</figure>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function convertImageForWordPress(
  file: File,
  options: WordPressConvertOptions
): Promise<WordPressImageOutput> {
  const quality = options.quality ?? 0.84;
  const img = await loadImageFromFile(file);
  const baseSlug =
    options.slug?.trim() ||
    slugifyForWordPress(options.alt || file.name.replace(/\.[^.]+$/, ''));
  const slug = baseSlug;
  const alt = options.alt.trim() || slug.replace(/-/g, ' ');
  const caption = options.caption.trim();
  const siteUrl = options.siteUrl?.trim() || 'https://aceroyroca.com';

  const variants: WordPressImageVariant[] = [];

  const full = await resizeMaxWidth(img, WP_SIZES.full, quality);
  variants.push({
    label: 'Completa (hasta 1920px)',
    filename: wpFilename(slug, full.width, full.height, true),
    width: full.width,
    height: full.height,
    blob: full.blob
  });

  if (img.naturalWidth > WP_SIZES.large || full.width > WP_SIZES.large) {
    const large = await resizeMaxWidth(img, WP_SIZES.large, quality);
    variants.push({
      label: 'Large (1024px)',
      filename: wpFilename(slug, large.width, large.height),
      width: large.width,
      height: large.height,
      blob: large.blob
    });
  }

  const medium = await resizeMaxWidth(img, WP_SIZES.medium, quality);
  variants.push({
    label: 'Medium (300px)',
    filename: wpFilename(slug, medium.width, medium.height),
    width: medium.width,
    height: medium.height,
    blob: medium.blob
  });

  const thumb = await cropThumbnail(img, WP_SIZES.thumbnail, quality);
  variants.push({
    label: 'Miniatura (150×150)',
    filename: wpFilename(slug, thumb.width, thumb.height),
    width: thumb.width,
    height: thumb.height,
    blob: thumb.blob
  });

  const main = variants[0];
  const uploadUrl = buildUploadPath(siteUrl, main.filename);

  return {
    slug,
    alt,
    caption,
    originalName: file.name,
    variants,
    htmlGutenberg: buildGutenbergHtml(uploadUrl, alt, caption, main.width, main.height),
    htmlClassic: buildClassicHtml(uploadUrl, alt, caption, main.width, main.height),
    markdown: caption
      ? `![${alt}](${uploadUrl})\n*${caption}*`
      : `![${alt}](${uploadUrl})`
  };
}

export async function downloadWordPressZip(outputs: WordPressImageOutput[]): Promise<void> {
  const zip = new JSZip();
  const readme = [
    'Imágenes optimizadas para WordPress — Acero & Roca',
    '',
    '1. En WordPress: Medios → Añadir nuevo → subí el archivo principal (.aceroyroca.webp).',
    '2. WordPress generará sus propios tamaños; estos archivos son respaldo/editorial.',
    '3. Copiá el HTML desde el portal y reemplazá la URL si WordPress asigna otra ruta.',
    '4. Pegá en el editor de bloques (modo código) o en HTML personalizado.',
    '',
    ...outputs.map(o => `- ${o.slug}: ${o.alt}`)
  ].join('\n');

  zip.file('LEEME-wordpress.txt', readme);

  for (const output of outputs) {
    const folder = zip.folder(output.slug);
    if (!folder) continue;
    folder.file('gutenberg.html', output.htmlGutenberg);
    folder.file('classic.html', output.htmlClassic);
    folder.file('markdown.txt', output.markdown);
    for (const variant of output.variants) {
      folder.file(variant.filename, variant.blob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wordpress-imagenes-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSingleVariant(variant: WordPressImageVariant): void {
  const url = URL.createObjectURL(variant.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = variant.filename;
  a.click();
  URL.revokeObjectURL(url);
}
