import type { Note } from '../context/AppContext';

export function noteToPrintHtml(note: Note, authorName: string): string {
  const body = note.content
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, (m) => (m.trim() ? `<p>${m}` : ''));

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${note.title}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 720px; margin: 40px auto; color: #111; line-height: 1.7; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  h2 { font-size: 20px; margin-top: 24px; }
  .meta { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 24px; }
  .brand { font-weight: 800; font-size: 14px; letter-spacing: 0.12em; }
</style></head><body>
<div class="brand">ACERO & ROCA</div>
<h1>${note.title}</h1>
<div class="meta">Por ${authorName} · ${new Date(note.updated_at).toLocaleDateString('es-AR')}</div>
${body}
</body></html>`;
}

export function downloadWordDoc(note: Note, authorName: string) {
  const html = noteToPrintHtml(note, authorName);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title.replace(/[^a-z0-9áéíóúñ\s]/gi, '').trim().slice(0, 60) || 'columna'}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyCmsHtml(note: Note, authorName: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = escape(note.content);
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n\n/g, '</p><p>');
  const wrapped = `<article class="columna-mineria">\n<p><em>Por ${authorName}</em></p>\n<p>${html}</p>\n</article>`;
  return wrapped;
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}
