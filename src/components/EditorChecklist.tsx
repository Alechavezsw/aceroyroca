import React from 'react';
import { CheckCircle, Circle, BookMarked } from 'lucide-react';
import type { ChecklistItem } from '../utils/columnChecklist';
import type { GlossaryTerm } from '../context/AppContext';

interface EditorChecklistProps {
  items: ChecklistItem[];
  detectedTerms: GlossaryTerm[];
  onTermClick?: (term: GlossaryTerm) => void;
  publishedItem?: { done: boolean; onToggle: () => void };
  noteNumber?: number;
}

export const EditorChecklist: React.FC<EditorChecklistProps> = ({
  items,
  detectedTerms,
  onTermClick,
  publishedItem,
  noteNumber
}) => {
  const allItems = publishedItem
    ? [...items, { id: 'published', label: 'Publicada', hint: 'Salió en el diario', done: publishedItem.done, toggle: publishedItem.onToggle }]
    : items.map(i => ({ ...i, toggle: undefined as (() => void) | undefined }));

  const doneCount = allItems.filter(i => i.done).length;
  const pct = Math.round((doneCount / allItems.length) * 100);

  return (
    <aside className="editor-checklist no-print">
      <div className="editor-checklist__header">
        <h3 className="editor-checklist__title">
          Checklist columna
          {noteNumber != null && (
            <span className="editor-checklist__note-num">#{noteNumber}</span>
          )}
        </h3>
        <span className="editor-checklist__pct">{pct}%</span>
      </div>
      <div className="editor-checklist__bar">
        <div className="editor-checklist__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="editor-checklist__list">
        {allItems.map(item => (
          <li key={item.id} className={`editor-checklist__item ${item.done ? 'is-done' : ''}`}>
            {'toggle' in item && item.toggle ? (
              <button type="button" className="editor-checklist__toggle" onClick={item.toggle}>
                {item.done ? (
                  <CheckCircle size={15} className="text-accent-emerald shrink-0" />
                ) : (
                  <Circle size={15} className="text-text-muted shrink-0" />
                )}
              </button>
            ) : item.done ? (
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
