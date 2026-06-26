import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookMarked, Plus, Trash2, Search, Pencil, X, Check, Tag } from 'lucide-react';

const CATEGORIES = ['General', 'Geología', 'Procesos', 'Legal', 'Economía', 'Medio Ambiente'] as const;

export const GlossaryPanel: React.FC = () => {
  const { glossary, addGlossaryTerm, updateGlossaryTerm, removeGlossaryTerm } = useApp();
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [example, setExample] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ term: '', definition: '', category: 'General', example: '' });

  const filtered = glossary.filter(g => {
    const matchQ = !q || g.term.toLowerCase().includes(q.toLowerCase()) || g.definition.toLowerCase().includes(q.toLowerCase());
    const matchCat = catFilter === 'Todos' || g.category === catFilter;
    return matchQ && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => a.term.localeCompare(b.term, 'es'));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!term.trim() || !definition.trim()) {
      setError('Completá término y definición.');
      return;
    }
    const ok = addGlossaryTerm(term, definition, {
      category,
      example: example || undefined,
      source: 'Manual'
    });
    if (!ok) {
      setError(`"${term.trim()}" ya existe en el glosario.`);
      return;
    }
    setTerm('');
    setDefinition('');
    setExample('');
    setSuccess(`"${term.trim()}" guardado correctamente.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const startEdit = (g: typeof glossary[0]) => {
    setEditingId(g.id);
    setEditDraft({
      term: g.term,
      definition: g.definition,
      category: g.category || 'General',
      example: g.example || ''
    });
  };

  const saveEdit = () => {
    if (!editingId || !editDraft.term.trim() || !editDraft.definition.trim()) return;
    updateGlossaryTerm(editingId, {
      term: editDraft.term.trim(),
      definition: editDraft.definition.trim(),
      category: editDraft.category,
      example: editDraft.example.trim() || undefined
    });
    setEditingId(null);
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <header className="dashboard-hero stagger-1">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">
            <BookMarked size={12} /> Referencia editorial
          </span>
          <h2 className="dashboard-hero__title">
            Glosario <span className="dashboard-hero__title-accent">Minero</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            {glossary.length} términos guardados — referencia rápida al redactar columnas y reportajes.
          </p>
        </div>
      </header>

      <form onSubmit={handleAdd} className="glossary-form glass-panel stagger-2">
        <div className="glossary-form__header">
          <div>
            <h3 className="glossary-form__title">Agregar término</h3>
            <p className="glossary-form__desc">Definiciones claras para vos y tu audiencia. Se guardan en tu dispositivo.</p>
          </div>
          <Tag size={20} className="text-accent-gold opacity-60" />
        </div>

        <div className="glossary-form__grid">
          <label className="form-field">
            <span>Término *</span>
            <input className="glass-input" placeholder="Ej: Ley de corte" value={term} onChange={e => setTerm(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Categoría</span>
            <select className="glass-input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <label className="form-field">
          <span>Definición *</span>
          <textarea
            className="glass-input min-h-[90px] resize-y"
            placeholder="Explicación clara para público general..."
            value={definition}
            onChange={e => setDefinition(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Ejemplo <span className="text-text-muted font-normal">(opcional)</span></span>
          <input
            className="glass-input"
            placeholder="Ej: Los Azules usa lixiviación en pilas con ley ~0,4% Cu"
            value={example}
            onChange={e => setExample(e.target.value)}
          />
        </label>

        {error && <p className="form-feedback form-feedback--error">{error}</p>}
        {success && <p className="form-feedback form-feedback--success">{success}</p>}

        <button type="submit" className="glass-button active text-sm self-start">
          <Plus size={16} /> Guardar en glosario
        </button>
      </form>

      <div className="glossary-toolbar stagger-3">
        <div className="glossary-search">
          <Search size={16} className="glossary-search__icon" />
          <input className="glass-input glossary-search__input" placeholder="Buscar término o definición..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="glossary-categories">
          {['Todos', ...CATEGORIES].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={`glass-button text-xs py-1.5 ${catFilter === c ? 'active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="glossary-grid stagger-4">
        {sorted.length === 0 ? (
          <div className="empty-state col-span-full">
            <BookMarked size={36} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No hay términos{catFilter !== 'Todos' ? ` en "${catFilter}"` : ''}.</p>
          </div>
        ) : (
          sorted.map(g => (
            <div key={g.id} className="glass-panel glossary-term-card group">
              {editingId === g.id ? (
                <div className="glossary-edit">
                  <input className="glass-input text-sm mb-2" value={editDraft.term} onChange={e => setEditDraft(d => ({ ...d, term: e.target.value }))} />
                  <select className="glass-input text-sm mb-2" value={editDraft.category} onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea className="glass-input text-sm min-h-[70px] mb-2 resize-y" value={editDraft.definition} onChange={e => setEditDraft(d => ({ ...d, definition: e.target.value }))} />
                  <input className="glass-input text-sm mb-3" placeholder="Ejemplo (opcional)" value={editDraft.example} onChange={e => setEditDraft(d => ({ ...d, example: e.target.value }))} />
                  <div className="flex gap-2">
                    <button type="button" className="glass-button active text-xs" onClick={saveEdit}><Check size={14} /> Guardar</button>
                    <button type="button" className="glass-button text-xs" onClick={() => setEditingId(null)}><X size={14} /> Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="glossary-term-card__top">
                    <span className="glossary-term-card__category">{g.category || 'General'}</span>
                    <div className="glossary-term-card__actions">
                      <button type="button" onClick={() => startEdit(g)} className="glossary-term-card__action" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => removeGlossaryTerm(g.id)} className="glossary-term-card__action glossary-term-card__action--delete" title="Eliminar">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h4 className="glossary-term-card__term">{g.term}</h4>
                  <p className="glossary-term-card__def">{g.definition}</p>
                  {g.example && (
                    <p className="glossary-term-card__example">
                      <span>Ej:</span> {g.example}
                    </p>
                  )}
                  {g.source && (
                    <span className="glossary-term-card__source">Fuente: {g.source}</span>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
