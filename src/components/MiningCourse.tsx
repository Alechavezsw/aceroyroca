import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MINING_COURSE, getTotalModules } from '../data/miningCourse';
import { GraduationCap, CheckCircle, Circle, ChevronRight, BookOpen, Sparkles } from 'lucide-react';

export const MiningCourse: React.FC = () => {
  const { courseProgress, markModuleComplete, setActiveSection } = useApp();
  const [activeStageId, setActiveStageId] = useState(MINING_COURSE[0].id);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const total = getTotalModules();
  const completed = courseProgress.completedModules.length;
  const pct = Math.round((completed / total) * 100);

  const activeStage = MINING_COURSE.find(s => s.id === activeStageId) || MINING_COURSE[0];
  const activeModule = activeModuleId
    ? activeStage.modules.find(m => m.id === activeModuleId)
    : null;

  const isDone = (id: string) => courseProgress.completedModules.includes(id);

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={i} className="font-bold text-white mt-3 mb-1">{trimmed.slice(2, -2)}</p>;
      }
      const html = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- /, '• ');
      return <p key={i} className="text-sm text-text-secondary leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h2 className="dashboard-hero__title flex items-center gap-3">
            <GraduationCap className="text-accent-gold" size={28} />
            <span>Curso de <span className="text-gradient-lime">Minería</span></span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Formación especializada en etapas para dominar geología, procesos, economía y periodismo minero.
          </p>
          <div className="course-progress-bar mt-4">
            <div className="course-progress-bar__track">
              <div className="course-progress-bar__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-text-muted mt-1 block">{completed} de {total} módulos completados ({pct}%)</span>
          </div>
        </div>
      </header>

      <div className="course-layout">
        <aside className="glass-panel p-4 course-stages-list">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Etapas</p>
          {MINING_COURSE.map(stage => {
            const stageDone = stage.modules.every(m => isDone(m.id));
            const stageActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => { setActiveStageId(stage.id); setActiveModuleId(null); }}
                className={`course-stage-btn ${stageActive ? 'is-active' : ''}`}
              >
                <span className="course-stage-num">{stage.number}</span>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white block truncate">{stage.title}</span>
                  <span className="text-[10px] text-text-muted">{stage.modules.length} módulos</span>
                </div>
                {stageDone ? <CheckCircle size={16} className="text-accent-emerald shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />}
              </button>
            );
          })}
        </aside>

        <div className="course-main">
          {!activeModule ? (
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold font-display text-white mb-1">Etapa {activeStage.number}: {activeStage.title}</h3>
              <p className="text-text-secondary text-sm mb-6">{activeStage.subtitle}</p>
              <div className="flex flex-col gap-2">
                {activeStage.modules.map((mod, idx) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModuleId(mod.id)}
                    className="list-row text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isDone(mod.id) ? <CheckCircle size={18} className="text-accent-emerald" /> : <Circle size={18} className="text-text-muted" />}
                      <div>
                        <span className="text-sm font-semibold text-white">Módulo {idx + 1}: {mod.title}</span>
                        <span className="text-xs text-text-muted block">{mod.duration}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel course-module-panel flex flex-col">
              <button type="button" className="text-xs text-accent-gold hover:underline self-start" onClick={() => setActiveModuleId(null)}>
                ← Volver a {activeStage.title}
              </button>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeModule.title}</h3>
                  <span className="text-xs text-text-muted">{activeModule.duration} · Etapa {activeStage.number}</span>
                </div>
                {isDone(activeModule.id) && (
                  <span className="text-xs bg-accent-emerald/15 text-accent-emerald px-2 py-1 rounded-full border border-accent-emerald/30">Completado</span>
                )}
              </div>
              <div className="course-module-content">{renderContent(activeModule.content)}</div>
              {activeModule.keyTerms.length > 0 && (
                <div className="glass-panel p-4 bg-black/20">
                  <p className="text-xs font-bold uppercase text-text-muted mb-2 flex items-center gap-2">
                    <BookOpen size={14} /> Términos clave
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeModule.keyTerms.map(t => (
                      <span key={t} className="text-xs bg-accent-gold/10 text-accent-gold px-2.5 py-1 rounded-full border border-accent-gold/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {activeModule.practicePrompt && (
                <div className="p-4 rounded-xl border border-accent-steel/20 bg-accent-steel/5">
                  <p className="text-xs font-bold text-accent-steel mb-2 flex items-center gap-2">
                    <Sparkles size={14} /> Práctica
                  </p>
                  <p className="text-sm text-text-secondary">{activeModule.practicePrompt}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {!isDone(activeModule.id) && (
                  <button type="button" className="glass-button active text-sm" onClick={() => markModuleComplete(activeModule.id)}>
                    <CheckCircle size={16} /> Marcar como completado
                  </button>
                )}
                <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('agent')}>
                  Consultar al Agente
                </button>
                <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('editor')}>
                  Ir al Editor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
