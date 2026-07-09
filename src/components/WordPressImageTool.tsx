import React, { useCallback, useRef, useState } from 'react';
import {
  ImageIcon,
  Upload,
  Loader2,
  Download,
  Copy,
  Check,
  Trash2,
  FileArchive,
  Code2
} from 'lucide-react';
import {
  convertImageForWordPress,
  downloadSingleVariant,
  downloadWordPressZip,
  slugifyForWordPress,
  type WordPressImageOutput
} from '../utils/wordpressImageUtils';
import { copyToClipboard } from '../utils/exportUtils';

interface QueueItem {
  id: string;
  file: File;
  alt: string;
  caption: string;
  slug: string;
  output?: WordPressImageOutput;
  error?: string;
}

const PreviewThumb: React.FC<{ file: File }> = ({ file }) => {
  const [src, setSrc] = useState('');

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!src) return <div className="wp-image-tool__preview wp-image-tool__preview--empty" />;
  return (
    <div className="wp-image-tool__preview">
      <img src={src} alt="" />
    </div>
  );
};

export const WordPressImageTool: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [siteUrl, setSiteUrl] = useState('https://aceroyroca.com');
  const [copyMsg, setCopyMsg] = useState('');
  const [htmlMode, setHtmlMode] = useState<'gutenberg' | 'classic'>('gutenberg');

  const showCopyMsg = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(''), 2200);
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;

    setQueue(prev => [
      ...prev,
      ...list.map(file => {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        return {
          id: crypto.randomUUID(),
          file,
          alt: base.trim(),
          caption: '',
          slug: slugifyForWordPress(base)
        };
      })
    ]);
  }, []);

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const processAll = async () => {
    if (!queue.length) return;
    setProcessing(true);

    const next: QueueItem[] = [];
    for (const item of queue) {
      try {
        const output = await convertImageForWordPress(item.file, {
          alt: item.alt,
          caption: item.caption,
          slug: item.slug,
          siteUrl
        });
        next.push({ ...item, output, error: undefined });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al convertir.';
        next.push({ ...item, output: undefined, error: message });
      }
    }

    setQueue(next);
    setProcessing(false);
  };

  const readyOutputs = queue.filter(item => item.output).map(item => item.output!);

  const copyHtmlBundle = async () => {
    const html = readyOutputs
      .map(o => (htmlMode === 'gutenberg' ? o.htmlGutenberg : o.htmlClassic))
      .join('\n\n');
    if (!html) return;
    await copyToClipboard(html);
    showCopyMsg('HTML copiado para WordPress');
  };

  const copyMarkdownBundle = async () => {
    const md = readyOutputs.map(o => o.markdown).join('\n\n');
    if (!md) return;
    await copyToClipboard(md);
    showCopyMsg('Markdown copiado');
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <header className="dashboard-hero stagger-1">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">
            <ImageIcon size={12} /> Publicación web
          </span>
          <h2 className="dashboard-hero__title">
            Fotos para <span className="dashboard-hero__title-accent">WordPress</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Convertí fotos a WebP optimizado (.aceroyroca.webp), tamaños WP y HTML listo para aceroyroca.com.
          </p>
        </div>
      </header>

      <div className="wp-image-tool stagger-2">
        <div className="wp-image-tool__settings glass-panel">
          <label className="form-field">
            <span>URL del sitio WordPress</span>
            <input
              className="glass-input"
              value={siteUrl}
              onChange={e => setSiteUrl(e.target.value)}
              placeholder="https://aceroyroca.com"
            />
          </label>
          <p className="wp-image-tool__hint">
            Se usa para armar la ruta de subida en el HTML (`/wp-content/uploads/año/mes/`). Ajustala después en WP si hace falta.
          </p>
        </div>

        <div
          className="wp-image-tool__dropzone glass-panel"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <Upload size={28} className="text-accent-gold" />
          <p className="wp-image-tool__drop-title">Arrastrá fotos o hacé clic para elegir</p>
          <p className="wp-image-tool__drop-sub">JPG, PNG, WebP · se exportan como JPEG optimizado</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            className="sr-only"
            onChange={e => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {queue.length > 0 && (
          <div className="wp-image-tool__queue">
            {queue.map(item => (
              <article key={item.id} className="wp-image-tool__card glass-panel">
                <PreviewThumb file={item.file} />
                <div className="wp-image-tool__fields">
                  <div className="wp-image-tool__card-head">
                    <strong className="text-sm truncate">{item.file.name}</strong>
                    <button
                      type="button"
                      className="wp-image-tool__icon-btn"
                      onClick={() => removeItem(item.id)}
                      title="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <label className="form-field">
                    <span>Texto alternativo (alt) *</span>
                    <input
                      className="glass-input text-xs"
                      value={item.alt}
                      onChange={e => {
                        const alt = e.target.value;
                        updateItem(item.id, {
                          alt,
                          slug: item.slug || slugifyForWordPress(alt)
                        });
                      }}
                    />
                  </label>

                  <label className="form-field">
                    <span>Pie de foto (caption)</span>
                    <input
                      className="glass-input text-xs"
                      value={item.caption}
                      onChange={e => updateItem(item.id, { caption: e.target.value })}
                      placeholder="Opcional — aparece bajo la imagen en WP"
                    />
                  </label>

                  <label className="form-field">
                    <span>Nombre de archivo (slug)</span>
                    <input
                      className="glass-input text-xs"
                      value={item.slug}
                      onChange={e => updateItem(item.id, { slug: slugifyForWordPress(e.target.value) })}
                    />
                  </label>

                  {item.error && <p className="text-[11px] text-red-400">{item.error}</p>}

                  {item.output && (
                    <div className="wp-image-tool__variants">
                      <p className="text-[11px] text-text-secondary font-semibold">Tamaños generados</p>
                      <ul>
                        {item.output.variants.map(v => (
                          <li key={v.filename}>
                            <span>{v.label} · {v.width}×{v.height}</span>
                            <button
                              type="button"
                              className="wp-image-tool__link-btn"
                              onClick={() => downloadSingleVariant(v)}
                            >
                              <Download size={12} /> {v.filename}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {queue.length > 0 && (
          <div className="wp-image-tool__actions glass-panel">
            <button
              type="button"
              className="glass-button steel"
              disabled={processing || queue.some(i => !i.alt.trim())}
              onClick={processAll}
            >
              {processing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Convirtiendo…
                </>
              ) : (
                <>
                  <ImageIcon size={14} /> Convertir para WordPress
                </>
              )}
            </button>

            {readyOutputs.length > 0 && (
              <>
                <div className="wp-image-tool__html-toggle">
                  <button
                    type="button"
                    className={`wp-image-tool__toggle ${htmlMode === 'gutenberg' ? 'active' : ''}`}
                    onClick={() => setHtmlMode('gutenberg')}
                  >
                    <Code2 size={12} /> Bloques Gutenberg
                  </button>
                  <button
                    type="button"
                    className={`wp-image-tool__toggle ${htmlMode === 'classic' ? 'active' : ''}`}
                    onClick={() => setHtmlMode('classic')}
                  >
                    <Code2 size={12} /> HTML clásico
                  </button>
                </div>

                <button type="button" className="glass-button" onClick={copyHtmlBundle}>
                  <Copy size={14} /> Copiar HTML ({readyOutputs.length})
                </button>
                <button type="button" className="glass-button" onClick={copyMarkdownBundle}>
                  <Copy size={14} /> Copiar Markdown
                </button>
                <button
                  type="button"
                  className="glass-button active"
                  onClick={() => downloadWordPressZip(readyOutputs)}
                >
                  <FileArchive size={14} /> Descargar ZIP
                </button>
              </>
            )}
          </div>
        )}

        {copyMsg && (
          <p className="wp-image-tool__toast">
            <Check size={14} /> {copyMsg}
          </p>
        )}

        <section className="wp-image-tool__help glass-panel">
          <h3>Cómo publicar en WordPress</h3>
          <ol>
            <li>Completá el <strong>alt</strong> (accesibilidad y SEO minero).</li>
            <li>Convertí y descargá el ZIP o la imagen principal (`nombre.jpg`).</li>
            <li>En WP: <strong>Medios → Añadir nuevo</strong> y subí el JPG principal.</li>
            <li>Copiá el HTML y pegalo en el editor (modo código / bloque HTML).</li>
            <li>Si la URL final difiere, reemplazala en el bloque de imagen.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};
