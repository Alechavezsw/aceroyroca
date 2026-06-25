import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, FileText, CheckSquare, Calendar, GraduationCap, MapPin } from 'lucide-react';

export const CommandSearch: React.FC = () => {
  const { notes, tasks, events, setActiveSection, setActiveNoteId } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('ar:open-search', openHandler);
    return () => window.removeEventListener('ar:open-search', openHandler);
  }, []);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const query = q.toLowerCase().trim();
  const noteResults = query
    ? notes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)).slice(0, 5)
    : [];
  const taskResults = query
    ? tasks.filter(t => t.title.toLowerCase().includes(query)).slice(0, 4)
    : [];
  const eventResults = query
    ? events.filter(e => e.title.toLowerCase().includes(query)).slice(0, 4)
    : [];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Search },
    { id: 'editor', label: 'Redacción', icon: FileText },
    { id: 'agent', label: 'Agente IA', icon: Search },
    { id: 'course', label: 'Curso de Minería', icon: GraduationCap },
    { id: 'projects', label: 'Mapa de Proyectos', icon: MapPin },
    { id: 'glossary', label: 'Glosario', icon: FileText },
    { id: 'tasks', label: 'Kanban', icon: CheckSquare },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'settings', label: 'Ajustes', icon: Search }
  ].filter(n => !query || n.label.toLowerCase().includes(query));

  if (!open) return null;

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-dialog" onClick={e => e.stopPropagation()}>
        <div className="command-input-wrap">
          <Search size={18} className="text-text-muted" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar notas, tareas, eventos o ir a una sección..."
            className="command-input"
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>
        <div className="command-results">
          {navItems.length > 0 && (
            <section>
              <p className="command-section-label">Ir a</p>
              {navItems.map(item => (
                <button
                  key={item.id}
                  className="command-item"
                  onClick={() => { setActiveSection(item.id); setOpen(false); }}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </section>
          )}
          {noteResults.map(note => (
            <button
              key={note.id}
              className="command-item"
              onClick={() => { setActiveNoteId(note.id); setActiveSection('editor'); setOpen(false); }}
            >
              <FileText size={16} />
              <span className="truncate">{note.title}</span>
            </button>
          ))}
          {taskResults.map(task => (
            <button key={task.id} className="command-item" onClick={() => { setActiveSection('tasks'); setOpen(false); }}>
              <CheckSquare size={16} />
              <span className="truncate">{task.title}</span>
            </button>
          ))}
          {eventResults.map(evt => (
            <button key={evt.id} className="command-item" onClick={() => { setActiveSection('calendar'); setOpen(false); }}>
              <Calendar size={16} />
              <span className="truncate">{evt.title}</span>
            </button>
          ))}
          {!query && (
            <p className="command-hint text-text-muted text-xs p-3">
              Tip: Ctrl+K para abrir · Ctrl+1-4 para secciones · Ctrl+Shift+B briefing
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
