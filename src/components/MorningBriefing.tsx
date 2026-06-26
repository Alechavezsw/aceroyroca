import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Loader2, History, ChevronRight } from 'lucide-react';

/** Modal global de briefing — montar una sola vez en App.tsx */
export const BriefingModal: React.FC = () => {
  const {
    briefingHistory,
    runBriefing,
    autoBriefingOpen,
    setAutoBriefingOpen,
    setActiveSection
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEntry = briefingHistory.find(h => h.dateKey === todayKey);
  const displayEntry = selectedId
    ? briefingHistory.find(h => h.id === selectedId)
    : todayEntry || briefingHistory[0];

  const handleRun = async () => {
    setLoading(true);
    setSelectedId(null);
    await runBriefing({ silent: true });
    setLoading(false);
  };

  React.useEffect(() => {
    const handler = () => {
      setAutoBriefingOpen(true);
      handleRun();
    };
    window.addEventListener('ar:briefing', handler);
    return () => window.removeEventListener('ar:briefing', handler);
  }, []);

  if (!autoBriefingOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setAutoBriefingOpen(false)}>
      <div className="modal-panel briefing-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3 className="panel-header__title">
            <Sparkles size={20} />
            Briefing Matutino
          </h3>
          <button type="button" onClick={() => setAutoBriefingOpen(false)} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="briefing-modal-layout">
          <aside className="briefing-history">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <History size={13} /> Historial
              </span>
              <button type="button" onClick={handleRun} disabled={loading} className="text-[10px] text-accent-gold hover:text-white font-semibold">
                {loading ? 'Generando…' : '+ Nuevo'}
              </button>
            </div>
            <div className="briefing-history__list">
              {briefingHistory.length === 0 ? (
                <p className="text-xs text-text-muted py-4 text-center">Sin briefings guardados</p>
              ) : (
                briefingHistory.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={`briefing-history__item ${(selectedId === h.id || (!selectedId && h.id === displayEntry?.id)) ? 'is-active' : ''}`}
                  >
                    <span className="briefing-history__date">
                      {new Date(h.createdAt).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="briefing-history__preview">{h.content.slice(0, 60)}…</span>
                    <ChevronRight size={12} className="text-text-muted shrink-0" />
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="briefing-modal-content">
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3 text-text-secondary">
                <Loader2 className="animate-spin text-accent-gold" size={32} />
                <p className="text-sm">Gemini preparando tu agenda editorial…</p>
              </div>
            ) : displayEntry ? (
              <div className="briefing-content whitespace-pre-line text-sm leading-relaxed text-text-primary">
                {displayEntry.content}
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted text-sm">
                <p className="mb-4">Todavía no hay briefing para hoy.</p>
                <button type="button" onClick={handleRun} className="glass-button active text-sm">
                  <Sparkles size={14} /> Generar ahora
                </button>
              </div>
            )}

            {!loading && displayEntry && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button type="button" className="glass-button active text-sm" onClick={() => { setActiveSection('editor'); setAutoBriefingOpen(false); }}>
                  Ir a redactar
                </button>
                <button type="button" className="glass-button text-sm" onClick={() => { setActiveSection('agent'); setAutoBriefingOpen(false); }}>
                  Analizar con Agente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Botón para abrir el briefing desde cualquier vista */
export const BriefingButton: React.FC = () => {
  const { setAutoBriefingOpen, briefingHistory, runBriefing } = useApp();
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setAutoBriefingOpen(true);
    const today = new Date().toISOString().slice(0, 10);
    if (!briefingHistory.some(h => h.dateKey === today)) {
      setBusy(true);
      await runBriefing({ silent: true });
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={open} disabled={busy} className="glass-button steel text-sm">
      <Sparkles size={16} /> {busy ? 'Generando…' : 'Briefing del día'}
    </button>
  );
};
