import React from 'react';
import { CheckCircle, Circle, BookMarked } from 'lucide-react';
import type { ChecklistItem } from '../utils/columnChecklist';
import type { GlossaryTerm } from '../context/AppContext';

interface EditorChecklistProps {
  items: ChecklistItem[];
  detectedTerms: GlossaryTerm[];
  onTermClick?: (term: GlossaryTerm) => void;
}

export const EditorChecklist: React.FC<EditorChecklistProps> = ({
  items,
  detectedTerms,
  onTermClick
}) => {
  const doneCount = items.filter(i => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <aside className="editor-checklist no-print">
      <div className="editor-checklist__header">
        <h3 className="editor-checklist__title">Checklist columna</h3>
        <span className="editor-checklist__pct">{pct}%</span>
      </div>
      <div className="editor-checklist__bar">
        <div className="editor-checklist__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="editor-checklist__list">
        {items.map(item => (
          <li key={item.id} className={`editor-checklist__item ${item.done ? 'is-done' : ''}`}>
            {item.done ? (
              <CheckCircle size={15} className="text-accent-emerald shrink-0" />
            ) : (
              <Circle size={15} className="text-text-muted shrink-0" />
            )}
            <div>
              <span className="editor-checklist__label">{item.label}</span>
              <span className="editor-checklist__hint">{item.hint}</span>
            </div>
          </li>
        ))}
      </ul>

      {detectedTerms.length > 0 && (
        <div className="editor-glossary-panel">
          <p className="editor-glossary-panel__title">
            <BookMarked size={13} /> Glosario en texto
          </p>
          <div className="editor-glossary-panel__terms">
            {detectedTerms.map(t => (
              <button
                key={t.id}
                type="button"
                className="editor-glossary-chip"
                onClick={() => onTermClick?.(t)}
                title={t.definition}
              >
                {t.term}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
