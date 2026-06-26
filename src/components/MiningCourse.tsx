import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCourseModuleCount } from '../data/courses';
import {
  GraduationCap, CheckCircle, Circle, ChevronRight, BookOpen,
  Sparkles, Plus, Trash2, X, Layers, BookPlus
} from 'lucide-react';

export const MiningCourse: React.FC = () => {
  const {
    activeCourse, courses, courseProgress, setActiveCourse,
    createCourse, deleteCourse, addCourseStage, addCourseModule,
    markModuleComplete, setActiveSection
  } = useApp();

  const [activeStageId, setActiveStageId] = useState(activeCourse.stages[0]?.id || '');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageSubtitle, setNewStageSubtitle] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleContent, setNewModuleContent] = useState('');

  const isCustom = !activeCourse.isBuiltIn;
  const completed = courseProgress.progressByCourse[activeCourse.id] || [];

  useEffect(() => {
    if (!activeCourse.stages.some(s => s.id === activeStageId)) {
      setActiveStageId(activeCourse.stages[0]?.id || '');
      setActiveModuleId(null);
    }
  }, [activeCourse.id, activeCourse.stages, activeStageId]);

  const total = getCourseModuleCount(activeCourse);
  const pct = total ? Math.round((completed.length / total) * 100) : 0;

  const activeStage = activeCourse.stages.find(s => s.id === activeStageId) || activeCourse.stages[0];
  const activeModule = activeModuleId && activeStage
    ? activeStage.modules.find(m => m.id === activeModuleId)
    : null;

  const isDone = (id: string) => completed.includes(id);

  const switchCourse = (courseId: string) => {
    setActiveCourse(courseId);
    const course = courses.find(c => c.id === courseId);
    setActiveStageId(course?.stages[0]?.id || '');
    setActiveModuleId(null);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    createCourse(newCourseTitle, newCourseDesc);
    setNewCourseTitle('');
    setNewCourseDesc('');
    setShowNewCourse(false);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim()) return;
    addCourseStage(activeCourse.id, newStageTitle, newStageSubtitle || 'Etapa del curso');
    setNewStageTitle('');
    setNewStageSubtitle('');
    setShowAddStage(false);
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !newModuleContent.trim() || !activeStage) return;
    addCourseModule(activeCourse.id, activeStage.id, newModuleTitle, newModuleContent);
    setNewModuleTitle('');
    setNewModuleContent('');
    setShowAddModule(false);
  };

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
      <header className="dashboard-hero stagger-1">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">
            <GraduationCap size={12} /> Academia Minera
          </span>
          <h2 className="dashboard-hero__title">
            <span className="dashboard-hero__title-accent">{activeCourse.title}</span>
          </h2>
          <p className="dashboard-hero__subtitle">{activeCourse.description}</p>
          <div className="course-progress-bar mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-text-muted">{completed.length} de {total} módulos</span>
              <span className="text-xs font-semibold text-accent-gold">{pct}%</span>
            </div>
            <div className="course-progress-bar__track">
              <div className="course-progress-bar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="dashboard-hero__actions">
          <button type="button" className="glass-button active text-sm" onClick={() => setShowNewCourse(true)}>
            <Plus size={16} /> Nuevo curso
          </button>
        </div>
      </header>

      <div className="course-catalog stagger-2">
        {courses.map(c => {
          const cTotal = getCourseModuleCount(c);
          const cDone = (courseProgress.progressByCourse[c.id] || []).length;
          const isActive = c.id === activeCourse.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => switchCourse(c.id)}
              className={`course-catalog-card ${isActive ? 'is-active' : ''}`}
            >
              <div className="course-catalog-card__icon">
                {c.isBuiltIn ? <GraduationCap size={18} /> : <BookPlus size={18} />}
              </div>
              <div className="course-catalog-card__body">
                <span className="course-catalog-card__title">{c.title}</span>
                <span className="course-catalog-card__meta">{cDone}/{cTotal} módulos · {c.stages.length} etapas</span>
              </div>
              {!c.isBuiltIn && (
                <button
                  type="button"
                  className="course-catalog-card__delete"
                  onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar este curso?')) deleteCourse(c.id); }}
                  title="Eliminar curso"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </button>
          );
        })}
      </div>

      <div className="course-layout stagger-3">
        <aside className="glass-panel p-4 course-stages-list">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Etapas</p>
            {isCustom && (
              <button type="button" className="text-accent-gold hover:text-white p-1" onClick={() => setShowAddStage(true)} title="Agregar etapa">
                <Plus size={16} />
              </button>
            )}
          </div>
          {activeCourse.stages.map(stage => {
            const stageDone = stage.modules.length > 0 && stage.modules.every(m => isDone(m.id));
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
            <div className="glass-panel panel-section">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold font-display text-white mb-1">
                    Etapa {activeStage?.number}: {activeStage?.title}
                  </h3>
                  <p className="text-text-secondary text-sm">{activeStage?.subtitle}</p>
                </div>
                {isCustom && activeStage && (
                  <button type="button" className="glass-button text-sm shrink-0" onClick={() => setShowAddModule(true)}>
                    <Plus size={14} /> Módulo
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {activeStage?.modules.length === 0 ? (
                  <div className="empty-state">
                    <Layers size={32} className="text-text-muted mb-3" />
                    <p className="text-sm text-text-muted">Sin módulos en esta etapa.</p>
                    {isCustom && (
                      <button type="button" className="glass-button active text-sm mt-3" onClick={() => setShowAddModule(true)}>
                        <Plus size={14} /> Crear primer módulo
                      </button>
                    )}
                  </div>
                ) : (
                  activeStage.modules.map((mod, idx) => (
                    <button key={mod.id} type="button" onClick={() => setActiveModuleId(mod.id)} className="list-row text-left">
                      <div className="flex items-center gap-3">
                        {isDone(mod.id) ? <CheckCircle size={18} className="text-accent-emerald" /> : <Circle size={18} className="text-text-muted" />}
                        <div>
                          <span className="text-sm font-semibold text-white">Módulo {idx + 1}: {mod.title}</span>
                          <span className="text-xs text-text-muted block">{mod.duration}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-text-muted" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel course-module-panel flex flex-col">
              <button type="button" className="text-xs text-accent-gold hover:underline self-start mb-2" onClick={() => setActiveModuleId(null)}>
                ← Volver a {activeStage?.title}
              </button>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeModule.title}</h3>
                  <span className="text-xs text-text-muted">{activeModule.duration} · Etapa {activeStage?.number}</span>
                </div>
                {isDone(activeModule.id) && (
                  <span className="text-xs bg-accent-emerald/15 text-accent-emerald px-2.5 py-1 rounded-full border border-accent-emerald/30">Completado</span>
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
                    <CheckCircle size={16} /> Marcar completado
                  </button>
                )}
                <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('agent')}>Consultar al Agente</button>
                <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('editor')}>Ir al Editor</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewCourse && (
        <div className="modal-overlay" onClick={() => setShowNewCourse(false)}>
          <form className="modal-panel course-modal" onClick={e => e.stopPropagation()} onSubmit={handleCreateCourse}>
            <div className="modal-panel__header">
              <h3><BookPlus size={20} /> Nuevo curso</h3>
              <button type="button" onClick={() => setShowNewCourse(false)}><X size={18} /></button>
            </div>
            <label className="form-field">
              <span>Título del curso</span>
              <input className="glass-input" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} placeholder="Ej: Litio en Salares del NOA" required />
            </label>
            <label className="form-field">
              <span>Descripción</span>
              <textarea className="glass-input min-h-[80px] resize-none" value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} placeholder="De qué trata este curso..." />
            </label>
            <button type="submit" className="glass-button active w-full justify-center">Crear curso</button>
          </form>
        </div>
      )}

      {showAddStage && (
        <div className="modal-overlay" onClick={() => setShowAddStage(false)}>
          <form className="modal-panel course-modal" onClick={e => e.stopPropagation()} onSubmit={handleAddStage}>
            <div className="modal-panel__header">
              <h3><Layers size={20} /> Nueva etapa</h3>
              <button type="button" onClick={() => setShowAddStage(false)}><X size={18} /></button>
            </div>
            <label className="form-field">
              <span>Título</span>
              <input className="glass-input" value={newStageTitle} onChange={e => setNewStageTitle(e.target.value)} placeholder="Ej: Geología aplicada" required />
            </label>
            <label className="form-field">
              <span>Subtítulo</span>
              <input className="glass-input" value={newStageSubtitle} onChange={e => setNewStageSubtitle(e.target.value)} placeholder="Breve descripción de la etapa" />
            </label>
            <button type="submit" className="glass-button active w-full justify-center">Agregar etapa</button>
          </form>
        </div>
      )}

      {showAddModule && (
        <div className="modal-overlay" onClick={() => setShowAddModule(false)}>
          <form className="modal-panel course-modal" onClick={e => e.stopPropagation()} onSubmit={handleAddModule}>
            <div className="modal-panel__header">
              <h3><BookOpen size={20} /> Nuevo módulo</h3>
              <button type="button" onClick={() => setShowAddModule(false)}><X size={18} /></button>
            </div>
            <label className="form-field">
              <span>Título del módulo</span>
              <input className="glass-input" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} placeholder="Ej: Introducción al litio en salares" required />
            </label>
            <label className="form-field">
              <span>Contenido</span>
              <textarea className="glass-input min-h-[140px] resize-y" value={newModuleContent} onChange={e => setNewModuleContent(e.target.value)} placeholder="Escribe el contenido del módulo. Usa **negrita** para títulos." required />
            </label>
            <button type="submit" className="glass-button active w-full justify-center">Guardar módulo</button>
          </form>
        </div>
      )}
    </div>
  );
};
