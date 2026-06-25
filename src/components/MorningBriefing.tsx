import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Loader2 } from 'lucide-react';

export const MorningBriefing: React.FC = () => {
  const { notes, tasks, events, config, setActiveSection } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState('');

  const runBriefing = async () => {
    setLoading(true);
    setBriefing('');
    setOpen(true);

    const pendingTasks = tasks.filter(t => t.status !== 'published').slice(0, 5);
    const nextDelivery = events
      .filter(e => e.type === 'delivery' && new Date(e.start_date) > new Date())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    const context = `Eres el asistente editorial de Carlos Fernández (Acero & Roca).

DATOS DEL DÍA:
- Borradores activos: ${notes.length}
- Tareas pendientes: ${pendingTasks.map(t => t.title).join('; ') || 'ninguna'}
- Próxima entrega: ${nextDelivery ? `${nextDelivery.title} (${nextDelivery.start_date})` : 'sin entregas programadas'}
- Palabras totales redactadas: ${notes.reduce((s, n) => s + n.words_count, 0)}

Genera un BRIEFING MATUTINO en español con:
1. Resumen ejecutivo (2 líneas)
2. Tres ideas concretas de columna para hoy (título + ángulo en una línea cada una)
3. Una alerta o tendencia del sector minero argentino a monitorear
4. Prioridad editorial sugerida para la jornada

Sé directo, periodístico y accionable. Máximo 350 palabras.`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: context }],
          model: config.geminiModel
        })
      });
      const data = await res.json();
      setBriefing(data.content || 'No se pudo generar el briefing.');
    } catch {
      setBriefing('Error de conexión. Verifica que el servidor y GEMINI_API_KEY estén activos.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handler = () => runBriefing();
    window.addEventListener('ar:briefing', handler);
    return () => window.removeEventListener('ar:briefing', handler);
  }, [notes, tasks, events, config.geminiModel]);

  return (
    <>
      <button type="button" onClick={runBriefing} className="glass-button steel text-sm">
        <Sparkles size={16} /> Briefing del día
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-panel briefing-modal" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <h3 className="panel-header__title">
                <Sparkles size={20} />
                Briefing Matutino — Acero & Roca
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3 text-text-secondary">
                <Loader2 className="animate-spin text-lime" size={32} />
                <p className="text-sm">Gemini preparando tu agenda editorial...</p>
              </div>
            ) : (
              <div className="briefing-content whitespace-pre-line text-sm leading-relaxed text-text-primary">
                {briefing}
              </div>
            )}
            {!loading && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button type="button" className="glass-button active text-sm" onClick={() => { setActiveSection('editor'); setOpen(false); }}>
                  Ir a redactar
                </button>
                <button type="button" className="glass-button text-sm" onClick={() => { setActiveSection('agent'); setOpen(false); }}>
                  Analizar con Agente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
