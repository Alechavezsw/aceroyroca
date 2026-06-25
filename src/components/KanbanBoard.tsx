import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Task } from '../context/AppContext';

import { 
  Plus, 
  Trash2, 
  Calendar, 
  Link2, 
  ChevronRight, 
  ChevronLeft,
  X,
  PlusCircle
} from 'lucide-react';

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'ideas', label: 'Ideas de Artículos', color: 'border-t-sky-500' },
  { id: 'research', label: 'Investigación', color: 'border-t-indigo-500' },
  { id: 'drafting', label: 'En Redacción', color: 'border-t-lime' },
  { id: 'review', label: 'Revisión / Edición', color: 'border-t-purple-500' },
  { id: 'published', label: 'Publicado', color: 'border-t-emerald-500' }
];

export const KanbanBoard: React.FC = () => {
  const { tasks, notes, createTask, updateTask, deleteTask, setActiveSection, setActiveNoteId } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [activeColForNewTask, setActiveColForNewTask] = useState<Task['status']>('ideas');

  // Estado del formulario de nueva tarea
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNoteId, setNewNoteId] = useState<string>('');

  // Lógica Drag and Drop HTML5 Nativa
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      await updateTask(id, { status: targetStatus });
    }
  };

  // Mover con botones (para accesibilidad/pantallas táctiles)
  const handleMoveStatus = async (task: Task, direction: 'left' | 'right') => {
    const colIndex = COLUMNS.findIndex(col => col.id === task.status);
    let nextIndex = colIndex + (direction === 'right' ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      await updateTask(task.id, { status: COLUMNS[nextIndex].id });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createTask({
      title: newTitle,
      description: newDesc,
      status: activeColForNewTask,
      priority: newPriority,
      due_date: newDueDate || '',
      note_id: newNoteId || null
    });

    // Resetear formulario
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewDueDate('');
    setNewNoteId('');
    setShowModal(false);
  };

  const handleOpenModal = (colId: Task['status']) => {
    setActiveColForNewTask(colId);
    setShowModal(true);
  };

  const handleNoteLinkClick = (noteId: string) => {
    setActiveNoteId(noteId);
    setActiveSection('editor');
  };

  return (
    <div className="main-content main-content--viewport flex flex-col animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-border-color">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Tablero Editorial Kanban</h2>
          <p className="text-xs text-text-secondary">Organiza y sigue tus columnas periodísticas desde la idea hasta el diario</p>
        </div>
        <button 
          onClick={() => handleOpenModal('ideas')}
          className="glass-button active text-xs"
        >
          <PlusCircle size={14} /> Nueva Idea
        </button>
      </header>

      {/* Grid del Tablero */}
      <div className="kanban-grid mt-4 flex-1">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`kanban-column border-t-4 ${col.color}`}
            >
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-text-secondary font-bold">
                    {colTasks.length}
                  </span>
                </div>
                <button 
                  onClick={() => handleOpenModal(col.id)}
                  className="text-text-muted hover:text-lime p-0.5 rounded hover:bg-white/5 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Lista de Tarjetas */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="kanban-card glass-panel"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                        task.priority === 'high' 
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                          : task.priority === 'medium'
                          ? 'bg-lime/15 text-lime border border-lime/20'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>

                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-text-muted hover:text-accent-red p-1 rounded hover:bg-white/5 transition-colors"
                        title="Eliminar tarea"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-2 mb-1 leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-text-secondary line-clamp-3 leading-normal mb-3">{task.description}</p>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px] text-text-muted">
                      <div className="flex items-center gap-1.5">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {task.due_date}
                          </span>
                        )}
                        {task.note_id && (
                          <button
                            onClick={() => handleNoteLinkClick(task.note_id!)}
                            className="flex items-center gap-0.5 text-lime hover:underline"
                            title="Ver Borrador"
                          >
                            <Link2 size={10} /> Borrador
                          </button>
                        )}
                      </div>

                      {/* Botones de control para mover */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveStatus(task, 'left')}
                          className="p-1 hover:text-white hover:bg-white/5 rounded disabled:opacity-20"
                          disabled={col.id === COLUMNS[0].id}
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          onClick={() => handleMoveStatus(task, 'right')}
                          className="p-1 hover:text-white hover:bg-white/5 rounded disabled:opacity-20"
                          disabled={col.id === COLUMNS[COLUMNS.length - 1].id}
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE NUEVA TAREA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 bg-secondary border border-white/10 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-md font-bold font-display text-white">Nueva Tarea en {COLUMNS.find(c => c.id === activeColForNewTask)?.label}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Título de la Idea</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Ej: Entrevista con Ministro de Minería"
                  className="glass-input"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Descripción</label>
                <textarea 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  placeholder="Detalles sobre la investigación, fuentes a consultar, o estructura a seguir..."
                  className="glass-input resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Prioridad</label>
                  <select 
                    value={newPriority} 
                    onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                    className="glass-input"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Fecha Límite</label>
                  <input 
                    type="date" 
                    value={newDueDate} 
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Vincular a Borrador (Opcional)</label>
                <select 
                  value={newNoteId} 
                  onChange={(e) => setNewNoteId(e.target.value)}
                  className="glass-input text-xs"
                >
                  <option value="">-- Sin vincular --</option>
                  {notes.map(note => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="glass-button active py-2.5 justify-center mt-3 font-semibold">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
