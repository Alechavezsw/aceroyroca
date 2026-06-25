import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookMarked, Plus, Trash2, Search } from 'lucide-react';

export const GlossaryPanel: React.FC = () => {
  const { glossary, addGlossaryTerm, removeGlossaryTerm } = useApp();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');

  const filtered = glossary.filter(g =>
    !q || g.term.toLowerCase().includes(q.toLowerCase()) || g.definition.toLowerCase().includes(q.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;
    addGlossaryTerm(term.trim(), definition.trim());
    setTerm('');
    setDefinition('');
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in content-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h2 className="dashboard-hero__title flex items-center gap-3">
            <BookMarked className="text-lime" size={28} />
            Glosario <span className="text-gradient-lime">Minero</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Términos geológicos y técnicos guardados desde tus columnas y el curso. Referencia rápida al redactar.
          </p>
        </div>
      </header>

      <form onSubmit={handleAdd} className="glass-panel p-5 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase text-text-muted">Agregar término</p>
        <input className="glass-input" placeholder="Ej: Ley de corte" value={term} onChange={e => setTerm(e.target.value)} />
        <textarea className="glass-input min-h-[80px] resize-none" placeholder="Definición clara para público general..." value={definition} onChange={e => setDefinition(e.target.value)} />
        <button type="submit" className="glass-button active text-sm self-start">
          <Plus size={16} /> Guardar término
        </button>
      </form>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input className="glass-input pl-10" placeholder="Buscar en el glosario..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="glossary-grid">
        {filtered.length === 0 ? (
          <p className="text-center text-text-muted py-8 text-sm col-span-full">No hay términos. Completa módulos del curso o agrega los tuyos.</p>
        ) : (
          filtered.map(g => (
            <div key={g.id} className="glass-panel glossary-term-card flex justify-between gap-4 items-start">
              <div className="min-w-0">
                <h4 className="font-bold text-lime text-base">{g.term}</h4>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">{g.definition}</p>
                {g.source && <span className="text-[10px] text-text-muted mt-2 block">Fuente: {g.source}</span>}
              </div>
              <button type="button" onClick={() => removeGlossaryTerm(g.id)} className="text-text-muted hover:text-accent-red p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
