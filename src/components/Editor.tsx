import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Note } from '../context/AppContext';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Sparkles, 
  Eye, 
  FileEdit,
  Loader2,
  LayoutTemplate,
  History,
  FileDown,
  Copy,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  Link as LinkIcon
} from 'lucide-react';
import { getColumnTemplates, buildInformativeNoteTemplate } from '../data/editorialGuide';
import { getNoteVersions, saveNoteVersion } from '../hooks/useNoteVersions';
import { downloadWordDoc, copyCmsHtml, copyToClipboard } from '../utils/exportUtils';
import { SyncIndicator } from './SyncIndicator';
import { EditorChecklist } from './EditorChecklist';
import { VoiceRecorder } from './VoiceRecorder';
import { buildColumnChecklist, glossaryTermsInContent } from '../utils/columnChecklist';
import type { GlossaryTerm } from '../context/AppContext';

export const Editor: React.FC = () => {
  const { 
    notes, 
    activeNoteId, 
    setActiveNoteId, 
    createNote, 
    updateNote, 
    deleteNote, 
    config,
    glossary,
    toggleNotePublished,
    paymentEntries
  } = useApp();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ReturnType<typeof getNoteVersions>>([]);
  const [copyMsg, setCopyMsg] = useState('');
  const [glossaryPreview, setGlossaryPreview] = useState<GlossaryTerm | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const wordPct = activeNote
    ? Math.min(100, Math.round((activeNote.words_count / config.wordGoalMax) * 100))
    : 0;

  const checklistItems = activeNote
    ? buildColumnChecklist(activeNote.content, activeNote.words_count, config.wordGoalMin, config.wordGoalMax, glossary)
    : [];

  const detectedTerms = activeNote ? glossaryTermsInContent(activeNote.content, glossary) : [];

  const linkedPayment = activeNote
    ? paymentEntries.find(e => e.noteId === activeNote.id)
    : undefined;
  const isPublished =
    linkedPayment?.published ?? activeNote?.status === 'published';

  useEffect(() => {
    if (activeNoteId) setVersions(getNoteVersions(activeNoteId));
  }, [activeNoteId, activeNote?.updated_at]);

  useEffect(() => {
    const onSave = () => {
      if (activeNote) saveNoteVersion(activeNote.id, activeNote.title, activeNote.content);
      setVersions(getNoteVersions(activeNote?.id || ''));
    };
    window.addEventListener('ar:save-note', onSave);
    return () => window.removeEventListener('ar:save-note', onSave);
  }, [activeNote]);

  const applyTemplate = async (content: string, title: string) => {
    const body = content.replace(/\{\{author\}\}/g, config.authorName);
    await createNote(title, body);
    setShowTemplates(false);
  };

  const restoreVersion = (content: string, title: string) => {
    if (activeNote && window.confirm('¿Restaurar esta versión? Se perderá el texto actual no guardado en historial.')) {
      updateNote(activeNote.id, { content, title });
      setShowVersions(false);
    }
  };

  // Auto-crear una nota si no hay ninguna
  useEffect(() => {
    if (notes.length === 0) {
      createNote('Nueva nota', buildInformativeNoteTemplate());
    } else if (!activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeNote) {
      updateNote(activeNote.id, { title: e.target.value });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeNote) {
      updateNote(activeNote.id, { content: e.target.value });
    }
  };

  const appendTranscription = (text: string) => {
    if (!activeNote || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeNote.content;
    const needsBreak = start > 0 && current[start - 1] !== '\n';
    const prefix = start === 0 ? '' : needsBreak ? '\n\n' : '';
    const insert = `${prefix}${text}`;
    const newText = current.slice(0, start) + insert + current.slice(end);
    updateNote(activeNote.id, { content: newText });
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + insert.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const handleStatusChange = (status: Note['status']) => {
    if (activeNote) {
      updateNote(activeNote.id, { status });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este borrador?')) {
      await deleteNote(id);
    }
  };

  const insertFormatting = (before: string, after: string = '') => {
    if (!activeNote || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeNote.content;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    
    updateNote(activeNote.id, { content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Convertidor simple de Markdown a HTML para previsualización e impresión
  const renderMarkdown = (md: string) => {
    if (!md) return '';
    let html = md;
    
    // Escapar caracteres básicos
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Títulos
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Citas
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');
    
    // Negrita
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Cursiva
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Listas con viñetas
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    // Limpieza de ul anidados múltiples
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Saltos de línea en párrafos
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h1') || 
        trimmed.startsWith('<h2') || 
        trimmed.startsWith('<h3') || 
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('</ul')
      ) {
        return line;
      }
      return `<p>${line}</p>`;
    });
    
    return processedLines.filter(Boolean).join('\n');
  };

  // Solicitar ayuda a Gemini sobre la nota
  const queryAiOnNote = async (promptText: string) => {
    if (!activeNote) return;
    setAiLoading(true);
    setAiResponse('');
    
    try {
      const systemContext = `El usuario está escribiendo un artículo con el título "${activeNote.title}".
Contenido actual de la nota:
"""
${activeNote.content}
"""

Responde a la siguiente solicitud de manera directa, corta y aplicable para el escritor:`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `${systemContext}\n\nSolicitud: ${promptText}` }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error('Error de conexión con Gemini');
      const data = await res.json();
      setAiResponse(data.content);
    } catch (e) {
      console.error(e);
      setAiResponse('Error al comunicarse con el agente de IA. Verifica que el servidor de desarrollo esté corriendo y la API Key esté configurada.');
    } finally {
      setAiLoading(false);
    }
  };

  // Exportación a PDF nativa por navegador
  const triggerPdfPrint = () => {
    window.print();
  };

  return (
    <div className="main-content main-content--editor animate-fade-in">
      {/* Editor Layout Split Grid */}
      <div className={`editor-layout ${!showAiAssistant ? 'editor-layout--solo' : ''}`}>
        {/* Left Side: Sidebar of notes and Editor Container */}
        <div className="flex gap-3 min-h-0 editor-inner-container">
          {/* Notes Sidebar List */}
          <div className="notes-list-sidebar no-print">
            <div className="flex justify-between items-center mb-2 notes-sidebar-header">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Mis Columnas</span>
              <button 
                onClick={() => createNote('Nueva Columna', '# Nueva Columna\n\n')}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-accent-gold transition-colors"
                title="Nueva Nota"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto pr-1 notes-scroll-container flex-1 min-h-0">

              {notes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`note-list-item group ${
                    note.id === activeNoteId 
                      ? 'bg-accent-gold/10 border-accent-gold/40 text-white' 
                      : 'bg-white/[0.01] text-text-secondary hover:bg-white/5'
                  }`}
                >
                  <span className="note-list-item__title">{note.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent-red text-text-muted transition-opacity"
                    title="Eliminar borrador"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Core Editor */}
          {activeNote ? (
            <div className="editor-main-with-checklist">
            <div className="editor-core">
              {/* Header stats and controls */}
              <div className="flex justify-between items-center pb-2 border-b border-border-color no-print">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-text-secondary">
                    Palabras: <b className="text-white">{activeNote.words_count}</b>
                    <span className="text-text-muted"> / meta {config.wordGoalMin}–{config.wordGoalMax}</span>
                  </span>
                  <div className="word-goal-bar" title="Progreso hacia columna dominical">
                    <div className="word-goal-bar__fill" style={{ width: `${wordPct}%` }} />
                  </div>
                  <SyncIndicator />
                </div>
                
                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  {['draft', 'review', 'published'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status as Note['status'])}
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded transition-colors ${
                        activeNote.status === status
                          ? status === 'published'
                            ? 'bg-accent-emerald text-black'
                            : status === 'review'
                            ? 'bg-accent-steel text-white'
                            : 'bg-accent-gold text-black'
                          : 'bg-white/5 text-text-muted hover:bg-white/10'
                      }`}
                    >
                      {status === 'published' ? 'Publicado' : status === 'review' ? 'Revisión' : 'Borrador'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <input 
                type="text" 
                value={activeNote.title}
                onChange={handleTitleChange}
                placeholder="Título del Artículo..."
                className="editor-title-input no-print"
              />

              {/* Editor Tabs & Actions Toolbar */}
              <div className="editor-actions-bar no-print">
                <div className="editor-actions-bar__group">
                  <button 
                    onClick={() => setActiveTab('editor')}
                    className={`glass-button text-xs py-1.5 ${activeTab === 'editor' ? 'active' : ''}`}
                  >
                    <FileEdit size={14} /> Editor
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={`glass-button text-xs py-1.5 ${activeTab === 'preview' ? 'active' : ''}`}
                  >
                    <Eye size={14} /> Vista de Impresión
                  </button>
                  <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="glass-button text-xs py-1.5">
                    <LayoutTemplate size={14} /> Plantillas
                  </button>
                  <button type="button" onClick={() => setShowVersions(!showVersions)} className="glass-button text-xs py-1.5">
                    <History size={14} /> Historial
                  </button>
                </div>

                <div className="editor-actions-bar__group">
                  <button 
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className={`glass-button text-xs py-1.5 ${showAiAssistant ? 'steel active' : ''}`}
                  >
                    <Sparkles size={14} /> Copiloto IA
                  </button>
                  <button 
                    onClick={triggerPdfPrint}
                    className="glass-button text-xs py-1.5 active"
                  >
                    <Printer size={14} /> PDF
                  </button>
                  <button 
                    onClick={() => activeNote && downloadWordDoc(activeNote, config.authorName)}
                    className="glass-button text-xs py-1.5"
                  >
                    <FileDown size={14} /> Word
                  </button>
                  <button 
                    onClick={async () => {
                      if (!activeNote) return;
                      await copyToClipboard(copyCmsHtml(activeNote, config.authorName));
                      setCopyMsg('HTML copiado');
                      setTimeout(() => setCopyMsg(''), 2000);
                    }}
                    className="glass-button text-xs py-1.5"
                  >
                    <Copy size={14} /> CMS
                  </button>
                </div>
              </div>

              {copyMsg && <p className="text-xs text-accent-gold no-print">{copyMsg}</p>}

              {showTemplates && (
                <div className="glass-panel p-4 grid grid-cols-1 md:grid-cols-2 gap-2 no-print">
                  {getColumnTemplates(config.authorName).map(t => (
                    <button key={t.id} type="button" onClick={() => applyTemplate(t.content, t.name)} className="list-row text-left flex-col items-start !transform-none">
                      <span className="font-semibold text-white text-sm">{t.name}</span>
                      <span className="text-xs text-text-muted">{t.description}</span>
                    </button>
                  ))}
                </div>
              )}

              {showVersions && (
                <div className="glass-panel p-4 max-h-40 overflow-y-auto no-print">
                  {versions.length === 0 ? (
                    <p className="text-xs text-text-muted">Sin versiones. Usa Ctrl+S para guardar un snapshot.</p>
                  ) : versions.map(v => (
                    <button key={v.id} type="button" onClick={() => restoreVersion(v.content, v.title)} className="list-row w-full mb-1 !transform-none">
                      <span className="text-sm text-white truncate">{v.title}</span>
                      <span className="text-xs text-text-muted shrink-0">{new Date(v.savedAt).toLocaleString('es-AR')}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'editor' ? (
                <div className="flex flex-col flex-1 min-h-0 border border-border-color rounded-xl overflow-hidden bg-white/[0.01] transition-colors focus-within:border-accent-gold focus-within:bg-white/[0.02] focus-within:shadow-[0_0_15px_rgba(204,255,0,0.05)]">
                  <div className="flex items-center gap-1 p-2 border-b border-border-color bg-black/20 no-print overflow-x-auto">
                    <button onClick={() => insertFormatting('**', '**')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Negrita"><Bold size={14} /></button>
                    <button onClick={() => insertFormatting('*', '*')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Cursiva"><Italic size={14} /></button>
                    <div className="w-px h-4 bg-border-color mx-1"></div>
                    <button onClick={() => insertFormatting('# ', '')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Título 1"><Heading1 size={14} /></button>
                    <button onClick={() => insertFormatting('## ', '')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Título 2"><Heading2 size={14} /></button>
                    <div className="w-px h-4 bg-border-color mx-1"></div>
                    <button onClick={() => insertFormatting('### Recuadro sugerido\n\n**', '**')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Recuadro editorial"><Quote size={14} /></button>
                    <button onClick={() => insertFormatting('- ', '')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Lista"><List size={14} /></button>
                    <div className="w-px h-4 bg-border-color mx-1"></div>
                    <button onClick={() => insertFormatting('[', '](url)')} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors" title="Enlace"><LinkIcon size={14} /></button>
                  </div>
                  <div className="editor-voice-bar no-print">
                    <VoiceRecorder
                      label="Dictado por voz (se inserta en el cursor)"
                      onTranscription={appendTranscription}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={activeNote.content}
                    onChange={handleContentChange}
                    placeholder="Estructura Acero y Roca: título, copete, Lo esencial en 10 segundos, H2/H3, imágenes y entrada WordPress…"
                    className="editor-text-area border-0 rounded-none bg-transparent focus:bg-transparent focus:shadow-none no-print w-full flex-1 p-4 outline-none resize-none"
                  />
                </div>
              ) : (
                <div className="w-full flex-1 bg-white border border-border-color rounded-xl overflow-y-auto no-print">
                  {/* Vista previa simulada de impresión en pantalla */}
                  <div className="p-8 font-serif text-black bg-white max-w-2xl mx-auto text-justify leading-relaxed">
                    <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                      <div className="font-display font-extrabold text-xl tracking-tight uppercase text-black">
                        ACERO & ROCA
                      </div>
                      <div className="text-right text-[10px] text-gray-500 font-sans">
                        <div>Sección: Opinión</div>
                        <div>Fecha: {new Date(activeNote.updated_at).toLocaleDateString('es-AR')}</div>
                      </div>
                    </div>
                    <h1 className="font-display text-3xl font-bold mb-2 text-black leading-tight">{activeNote.title}</h1>
                    <div className="font-sans text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-2 mb-6">
                      Por {config.authorName}
                    </div>
                    <div 
                      className="text-sm prose text-black"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(activeNote.content) }}
                    />
                  </div>
                </div>
              )}
            </div>

            <EditorChecklist
              items={checklistItems}
              detectedTerms={detectedTerms}
              onTermClick={setGlossaryPreview}
              noteNumber={linkedPayment?.number}
              publishedItem={
                activeNote
                  ? {
                      done: isPublished,
                      onToggle: () => toggleNotePublished(activeNote.id, !isPublished)
                    }
                  : undefined
              }
            />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              Crea o selecciona una nota para comenzar a redactar.
            </div>
          )}
        </div>

        {/* Right Side: Copilot Panel */}
        {showAiAssistant && activeNote && (
          <div className="glass-panel glass-panel--scrollable p-5 flex flex-col h-full chat-sidebar no-print">
            <div className="chat-sidebar-body">
              <div className="flex items-center justify-between border-b border-border-color pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-accent-steel animate-pulse" size={18} />
                  <h3 className="font-display font-bold text-white text-md">Copiloto Gemini</h3>
                </div>
                <button 
                  onClick={() => setShowAiAssistant(false)}
                  className="text-text-muted hover:text-white text-xs"
                >
                  Ocultar
                </button>
              </div>

              {/* Botones de Acción de Redacción Rápida */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => queryAiOnNote('Sugiere 5 titulares periodísticos atractivos e impactantes para este artículo.')}
                  className="glass-button text-[11px] py-2 px-1 text-center justify-center"
                  disabled={aiLoading}
                >
                  Sugerir Titulares
                </button>
                <button 
                  onClick={() => queryAiOnNote('Revisa este artículo buscando errores de ortografía, gramática o fluidez del texto.')}
                  className="glass-button text-[11px] py-2 px-1 text-center justify-center"
                  disabled={aiLoading}
                >
                  Corregir Texto
                </button>
                <button 
                  onClick={() => queryAiOnNote('Genera una introducción y un párrafo de gancho editorial potente para este tema.')}
                  className="glass-button text-[11px] py-2 px-1 text-center justify-center"
                  disabled={aiLoading}
                >
                  Escribir Introducción
                </button>
                <button 
                  onClick={() => queryAiOnNote('Explica los términos geológicos o técnicos de minería presentes en este texto para que un público general los entienda.')}
                  className="glass-button text-[11px] py-2 px-1 text-center justify-center"
                  disabled={aiLoading}
                >
                  Explicar Términos
                </button>
              </div>

              {/* Campo para Prompt Personalizado */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-semibold text-text-secondary">Instrucción personalizada:</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej: Escribe un párrafo de conclusión..."
                    className="glass-input text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiPrompt.trim()) {
                        queryAiOnNote(aiPrompt);
                        setAiPrompt('');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (aiPrompt.trim()) {
                        queryAiOnNote(aiPrompt);
                        setAiPrompt('');
                      }
                    }}
                    className="glass-button text-xs py-2 active"
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    Pedir
                  </button>
                </div>
              </div>

              {/* Área de Respuesta de la IA */}
              <div className="editor-ai-response-box">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-text-secondary text-xs">
                    <Loader2 className="animate-spin text-accent-steel" size={24} />
                    <span>Gemini analizando tu nota...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="text-xs leading-relaxed text-text-primary whitespace-pre-line prose-invert">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="text-xs text-text-muted text-center py-12">
                    Las sugerencias del agente experto aparecerán aquí. Selecciona un comando rápido o escribe una instrucción.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {glossaryPreview && (
        <div className="glossary-popover-overlay no-print" onClick={() => setGlossaryPreview(null)}>
          <div className="glossary-popover" onClick={e => e.stopPropagation()}>
            <span className="glossary-popover__category">{glossaryPreview.category}</span>
            <h4 className="glossary-popover__term">{glossaryPreview.term}</h4>
            <p className="glossary-popover__def">{glossaryPreview.definition}</p>
            {glossaryPreview.example && (
              <p className="glossary-popover__example"><strong>Ej:</strong> {glossaryPreview.example}</p>
            )}
            <button type="button" className="glass-button text-xs mt-3" onClick={() => setGlossaryPreview(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* RENDERIZADO IMPRESO (ESTO SE CONVIERTE A PDF POR WINDOW.PRINT()) */}
      {activeNote && (
        <div className="printable-note-wrapper hidden">
          <div className="printable-note">
            <div className="printable-header">
              <div className="printable-logo">ACERO & ROCA</div>
              <div className="printable-metadata">
                <div>Suplemento: Opinión y Minería</div>
                <div>Fecha de Redacción: {new Date(activeNote.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            
            <h1 className="printable-title">{activeNote.title}</h1>
            
            <div className="printable-author">
              Por {config.authorName} | Columnista Especializado en Minería
            </div>
            
            <div 
              className="printable-body" 
              dangerouslySetInnerHTML={{ __html: renderMarkdown(activeNote.content) }} 
            />
            
            <div className="printable-footer">
              <span>Portal de Colaboradores - Diario Acero y Roca (aceroyroca.com)</span>
              <span>Página 1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
