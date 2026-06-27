import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { CalendarEvent } from '../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';


const EVENT_TYPES = [
  { id: 'delivery', label: 'Entrega de Columna', color: 'bg-red-500 text-red-500 border-red-500/30' },
  { id: 'interview', label: 'Entrevista', color: 'bg-emerald-500 text-emerald-500 border-emerald-500/30' },
  { id: 'meeting', label: 'Reunión de Pauta', color: 'bg-blue-500 text-blue-500 border-blue-500/30' },
  { id: 'event', label: 'Congreso / Evento', color: 'bg-purple-500 text-purple-500 border-purple-500/30' }
];

export const CalendarView: React.FC = () => {
  const { events, notes, tasks, createEvent, updateEvent, deleteEvent, setActiveSection, setActiveNoteId } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  // Formulario de evento
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTime, setFormTime] = useState('12:00');
  const [formEndTime, setFormEndTime] = useState('13:00');
  const [formType, setFormType] = useState<CalendarEvent['type']>('event');
  const [formNoteId, setFormNoteId] = useState<string>('');
  const [formTaskId, setFormTaskId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nombres de meses en español
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener días del mes
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayIndex = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const firstDayIndex = getFirstDayIndex(year, month);

  // Construir matriz de días
  const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Días del mes anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    cells.push({ dateStr, dayNum, isCurrentMonth: false, isToday: false });
  }

  // Días del mes actual
  const today = new Date();
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
    cells.push({ dateStr, dayNum: i, isCurrentMonth: true, isToday });
  }

  // Días del mes siguiente (para rellenar hasta 42 celdas)
  const remainingCells = 42 - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    cells.push({ dateStr, dayNum: i, isCurrentMonth: false, isToday: false });
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() + (direction === 'next' ? 1 : -1));
      return copy;
    });
  };

  const handleCellClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedEvent(null);
    setFormTitle('');
    setFormDesc('');
    setFormTime('12:00');
    setFormEndTime('13:00');
    setFormType('event');
    setFormNoteId('');
    setFormTaskId('');
    setFormError(null);
    setShowModal(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDateStr(event.start_date.split('T')[0]);
    setFormTitle(event.title);
    setFormDesc(event.description);
    setFormTime(event.start_date.split('T')[1].substring(0, 5));
    setFormEndTime(event.end_date.split('T')[1].substring(0, 5));
    setFormType(event.type);
    setFormNoteId(event.note_id || '');
    setFormTaskId(event.task_id || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setFormError(null);

    const start_date = `${selectedDateStr}T${formTime}:00`;
    const end_date = `${selectedDateStr}T${formEndTime}:00`;

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, {
          title: formTitle,
          description: formDesc,
          start_date,
          end_date,
          type: formType,
          note_id: formNoteId || null,
          task_id: formTaskId || null
        });
      } else {
        await createEvent({
          title: formTitle,
          description: formDesc,
          start_date,
          end_date,
          type: formType,
          note_id: formNoteId || null,
          task_id: formTaskId || null
        });
      }
      setShowModal(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'No se pudo guardar el evento. Revisa la conexión con Supabase.';
      setFormError(msg);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('¿Deseas eliminar este evento de tu agenda?')) {
      await deleteEvent(selectedEvent.id);
      setShowModal(false);
    }
  };

  const appendTranscription = (text: string) => {
    setFormDesc(prev => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
  };

  return (
    <div className="main-content main-content--viewport calendar-view animate-fade-in">
      {/* Header */}
      <header className="calendar-view__header">
        <div className="calendar-view__header-text">
          <h2 className="text-lg sm:text-xl font-bold font-display text-white">Agenda Editorial</h2>
          <p className="text-[11px] sm:text-xs text-text-secondary">Monitorea plazos de entrega, entrevistas con líderes mineros y reuniones de pauta</p>
        </div>
        <div className="calendar-view__nav">
          <button onClick={() => navigateMonth('prev')} className="glass-button p-2" aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="font-display font-bold text-white text-sm sm:text-md min-w-[100px] sm:min-w-[120px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => navigateMonth('next')} className="glass-button p-2" aria-label="Mes siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* Leyenda de Tipos de Eventos */}
      <section className="calendar-view__legend">
        {EVENT_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${type.color.split(' ')[0]}`} />
            <span>{type.label}</span>
          </div>
        ))}
      </section>

      {/* Grid del Calendario */}
      <div className="calendar-view__body">
        {/* Cabecera del Grid (Días de la semana) */}
        <div className="calendar-view__weekdays">
          {DAYS_OF_WEEK.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Cuerpo del Grid */}
        <div className="calendar-grid flex-1 overflow-y-auto">
          {cells.map((cell, idx) => {
            // Filtrar eventos del día
            const dayEvents = events.filter(e => e.start_date.startsWith(cell.dateStr));
            
            return (
              <div 
                key={idx}
                onClick={() => handleCellClick(cell.dateStr)}
                className={`calendar-day min-h-[72px] sm:min-h-[100px] cursor-pointer group ${
                  cell.isCurrentMonth ? 'current-month' : 'other-month'
                } ${cell.isToday ? 'today' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${
                    cell.isToday 
                      ? 'text-accent-gold' 
                      : cell.isCurrentMonth 
                      ? 'text-white' 
                      : 'text-text-muted'
                  }`}>
                    {cell.dayNum}
                  </span>
                  
                  {/* Botón rápido de agregar solo visible al hover */}
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-accent-gold transition-opacity">
                    <Plus size={10} />
                  </span>
                </div>

                {/* Eventos del Día */}
                <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[65px] scrollbar-none">
                  {dayEvents.map((evt) => {
                    const typeConfig = EVENT_TYPES.find(t => t.id === evt.type);
                    const typeColor = typeConfig ? typeConfig.color.split(' ')[0] : 'bg-white';
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => handleEventClick(e, evt)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border bg-white/[0.02] border-white/5 hover:border-white/20 transition-all font-semibold flex items-center gap-1 text-white truncate`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeColor}`} />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE EVENTO */}
      {showModal && (
        <div className="calendar-modal-backdrop">
          <div className="calendar-modal glass-panel">
            <div className="calendar-modal__header">
              <h3 className="text-sm sm:text-md font-bold font-display text-white">
                {selectedEvent ? 'Editar Evento de Agenda' : 'Programar Evento'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-white p-1" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="calendar-modal__form">
              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Título del Evento</label>
                <input 
                  type="text" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)} 
                  placeholder="Ej: Entrega de Columna Josemaría"
                  className="glass-input text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Descripción</label>
                <textarea 
                  value={formDesc} 
                  onChange={(e) => setFormDesc(e.target.value)} 
                  placeholder="Ej: Entregar por email al editor jefe..."
                  className="glass-input resize-none h-20 sm:h-16 text-xs"
                />
                <VoiceRecorder
                  label="Nota de voz (se transcribe al guardar)"
                  onTranscription={appendTranscription}
                />
              </div>

              <div className="calendar-modal__time-grid">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Hora Inicio</label>
                  <input 
                    type="time" 
                    value={formTime} 
                    onChange={(e) => setFormTime(e.target.value)}
                    className="glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Hora Fin</label>
                  <input 
                    type="time" 
                    value={formEndTime} 
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Tipo de Compromiso</label>
                <div className="calendar-modal__types">
                  {EVENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormType(type.id as CalendarEvent['type'])}
                      className={`text-[10px] py-2 px-2.5 rounded border text-left flex items-center gap-2 transition-all ${
                        formType === type.id
                          ? 'bg-white/10 border-white/35 text-white font-bold'
                          : 'bg-white/[0.01] border-white/5 text-text-muted hover:bg-white/5'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${type.color.split(' ')[0]}`} />
                      {type.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="calendar-modal__links">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Vincular columna</label>
                  <select value={formNoteId} onChange={e => setFormNoteId(e.target.value)} className="glass-input text-xs">
                    <option value="">— Sin vínculo —</option>
                    {notes.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Vincular tarea Kanban</label>
                  <select value={formTaskId} onChange={e => setFormTaskId(e.target.value)} className="glass-input text-xs">
                    <option value="">— Sin vínculo —</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedEvent && (selectedEvent.note_id || selectedEvent.task_id) && (
                <div className="flex gap-2 text-xs">
                  {selectedEvent.note_id && (
                    <button type="button" className="glass-button text-xs py-1.5" onClick={() => {
                      setActiveNoteId(selectedEvent.note_id!);
                      setActiveSection('editor');
                      setShowModal(false);
                    }}>Abrir columna</button>
                  )}
                  {selectedEvent.task_id && (
                    <button type="button" className="glass-button text-xs py-1.5" onClick={() => {
                      setActiveSection('tasks');
                      setShowModal(false);
                    }}>Ver en Kanban</button>
                  )}
                </div>
              )}

              <div className="calendar-modal__footer">
                {selectedEvent ? (
                  <button 
                    type="button"
                    onClick={handleDeleteEvent}
                    className="glass-button text-xs py-2 text-accent-red hover:bg-red-500/10 border-red-500/20"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                ) : <div />}

                <button type="submit" className="glass-button active py-2 px-5 font-semibold text-xs">
                  {selectedEvent ? 'Guardar Cambios' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
