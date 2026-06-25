import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client';

// Interfaces
export interface Note {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'published';
  words_count: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'ideas' | 'research' | 'drafting' | 'review' | 'published';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  note_id: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  type: 'delivery' | 'interview' | 'meeting' | 'event';
  note_id?: string | null;
  task_id?: string | null;
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  source?: string;
  addedAt: string;
}

export interface CourseProgress {
  completedModules: string[];
  currentStageId: string;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AppConfig {
  authorName: string;
  geminiModel: string;
  localApiKey: string;
  theme: 'dark' | 'light';
  rssFeeds: string[];
  wordGoalMin: number;
  wordGoalMax: number;
}

interface AppContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  tasks: Task[];
  events: CalendarEvent[];
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  
  // Notas API
  createNote: (title: string, content?: string) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  // Tareas API
  createTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Eventos API
  createEvent: (event: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  glossary: GlossaryTerm[];
  addGlossaryTerm: (term: string, definition: string, source?: string) => void;
  removeGlossaryTerm: (id: string) => void;

  courseProgress: CourseProgress;
  markModuleComplete: (moduleId: string) => void;

  syncStatus: SyncStatus;

  loading: boolean;
  isDbConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Valores por defecto para una experiencia lista para usar
const DEFAULT_NOTES: Note[] = [
  {
    id: '1-default-note',
    title: 'El Cobre de San Juan: Clave para la Transición Energética',
    content: `# El Cobre de San Juan: Clave para la Transición Energética

Por Carlos Fernández

El avance de los proyectos de cobre en la provincia de San Juan representa una de las oportunidades económicas más transformadoras de las últimas décadas para Argentina. Con yacimientos de escala mundial como **Los Azules**, **Josemaría**, **El Pachón** y **Filo del Sol**, la provincia cuyana concentra cerca del 80% de los recursos de cobre identificados en el país.

## El Impacto Global de la Demanda de Cobre

La transición energética global, impulsada por la necesidad de electrificar las redes y masificar los vehículos eléctricos, requiere volúmenes sin precedentes de metales conductores. Un automóvil eléctrico promedio consume hasta cuatro veces más cobre que uno de combustión interna. En este contexto, San Juan no es solo un actor local, sino una pieza geopolítica clave.

> "Argentina tiene el potencial de ubicarse entre los 10 principales productores mundiales de cobre de cara al 2030 si se consolidan las condiciones de inversión."

## Los Retos Pendientes

Sin embargo, el camino hacia la producción efectiva de cátodos y concentrados no está exento de obstáculos:
1. **Infraestructura Eléctrica y Vial**: La accesibilidad en alta cordillera requiere inversiones conjuntas del sector público y privado.
2. **Financiamiento**: Los proyectos de cobre requieren inversiones de capital (CAPEX) superiores a los $3.000 millones de dólares por mina. El Régimen de Incentivo para Grandes Inversiones (RIGI) jugará un papel decisivo para viabilizar estos desembolsos.
3. **Licencia Social e Hídrica**: La gestión eficiente del agua del deshielo y el diálogo transparente con las comunidades locales son primordiales.

San Juan ya ha demostrado una tradición de minería responsable en oro y plata con Veladero. El cobre es el siguiente nivel.`,
    status: 'draft',
    words_count: 280,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: '1-default-task',
    title: 'Entrevista con director de McEwen Copper',
    description: 'Preguntar sobre los avances de factibilidad de Los Azules y la incorporación de tecnología de lixiviación biológica.',
    status: 'ideas',
    priority: 'high',
    due_date: new Date(Date.now() + 3600000 * 24).toISOString().split('T')[0],
    note_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: '2-default-task',
    title: 'Analizar detalles del RIGI para minería',
    description: 'Estudiar las exenciones impositivas y plazos de amortización acelerada para proyectos de cobre.',
    status: 'research',
    priority: 'medium',
    due_date: new Date(Date.now() + 3600000 * 48).toISOString().split('T')[0],
    note_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: '3-default-task',
    title: 'Escribir borrador de columna dominical',
    description: 'Enfocarse en los proyectos Josemaría y Los Azules y el rol de San Juan en la minería de cobre.',
    status: 'drafting',
    priority: 'high',
    due_date: new Date(Date.now() + 3600000 * 72).toISOString().split('T')[0],
    note_id: '1-default-note',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: '1-default-event',
    title: 'Cierre de columna: Acero y Roca',
    description: 'Enviar el borrador final editado de la columna de opinión dominical.',
    start_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0] + 'T22:00:00Z',
    end_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0] + 'T23:00:00Z',
    type: 'delivery',
    created_at: new Date().toISOString()
  },
  {
    id: '2-default-event',
    title: 'Reunión de pauta con Carlos Fernández',
    description: 'Definición de temas principales y enfoque de investigación de la semana.',
    start_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T14:30:00Z',
    end_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T15:30:00Z',
    type: 'meeting',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_CONFIG: AppConfig = {
  authorName: 'Carlos Fernández',
  geminiModel: 'gemini-1.5-flash',
  localApiKey: '',
  theme: 'dark',
  rssFeeds: [
    'https://news.google.com/rss/search?q=mineria+argentina+OR+cobre+san+juan&hl=es-419&gl=AR&ceid=AR:es-419',
    'https://www.mining.com/feed/'
  ],
  wordGoalMin: 900,
  wordGoalMax: 1200
};

const DEFAULT_GLOSSARY: GlossaryTerm[] = [
  { id: 'g1', term: 'Ley de corte', definition: 'Grado mínimo de metal en el mineral para que su procesamiento sea económicamente viable.', source: 'Curso Etapa 2', addedAt: new Date().toISOString() },
  { id: 'g2', term: 'Pórfido de cobre', definition: 'Yacimiento de baja ley pero enorme volumen, típico de Los Azules y Josemaría.', source: 'Curso Etapa 2', addedAt: new Date().toISOString() },
  { id: 'g3', term: 'RIGI', definition: 'Régimen de Incentivo para Grandes Inversiones; estabilidad fiscal para proyectos +USD 200M.', source: 'Curso Etapa 6', addedAt: new Date().toISOString() },
  { id: 'g4', term: 'Lixiviación', definition: 'Proceso químico que disuelve el metal del mineral usando soluciones en pilas o montones.', source: 'Curso Etapa 4', addedAt: new Date().toISOString() }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>({ completedModules: [], currentStageId: 'stage-1' });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar datos (Supabase o LocalStorage)
  useEffect(() => {
    const initializeData = async () => {
      // 1. Cargar Configuración
      const savedConfig = localStorage.getItem('ar_columnist_config');
      if (savedConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      }

      const savedGlossary = localStorage.getItem('ar_glossary');
      setGlossary(savedGlossary ? JSON.parse(savedGlossary) : DEFAULT_GLOSSARY);
      if (!savedGlossary) localStorage.setItem('ar_glossary', JSON.stringify(DEFAULT_GLOSSARY));

      const savedCourse = localStorage.getItem('ar_course_progress');
      if (savedCourse) setCourseProgress(JSON.parse(savedCourse));

      document.documentElement.setAttribute('data-theme', (savedConfig ? JSON.parse(savedConfig).theme : 'dark') || 'dark');

      // 2. Cargar Datos
      if (isSupabaseConfigured && supabase) {
        try {
          const [notesRes, tasksRes, eventsRes] = await Promise.all([
            supabase.from('notes').select('*').order('updated_at', { ascending: false }),
            supabase.from('tasks').select('*').order('created_at', { ascending: true }),
            supabase.from('events').select('*').order('start_date', { ascending: true })
          ]);

          if (notesRes.error) throw notesRes.error;
          if (tasksRes.error) throw tasksRes.error;
          if (eventsRes.error) throw eventsRes.error;

          setNotes(notesRes.data || []);
          setTasks(tasksRes.data || []);
          setEvents(eventsRes.data || []);
          setIsDbConnected(true);

          if (notesRes.data && notesRes.data.length > 0) {
            setActiveNoteId(notesRes.data[0].id);
          }
        } catch (e) {
          console.error('Error conectando a Supabase, usando LocalStorage de respaldo:', e);
          setIsDbConnected(false);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      setLoading(false);
    };

    initializeData();
  }, []);

  const loadFromLocalStorage = () => {
    const savedNotes = localStorage.getItem('ar_columnist_notes');
    const savedTasks = localStorage.getItem('ar_columnist_tasks');
    const savedEvents = localStorage.getItem('ar_columnist_events');

    const loadedNotes = savedNotes ? JSON.parse(savedNotes) : DEFAULT_NOTES;
    const loadedTasks = savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS;
    const loadedEvents = savedEvents ? JSON.parse(savedEvents) : DEFAULT_EVENTS;

    setNotes(loadedNotes);
    setTasks(loadedTasks);
    setEvents(loadedEvents);
    
    if (loadedNotes.length > 0) {
      setActiveNoteId(loadedNotes[0].id);
    }

    // Guardar los defaults para inicializar
    if (!savedNotes) localStorage.setItem('ar_columnist_notes', JSON.stringify(DEFAULT_NOTES));
    if (!savedTasks) localStorage.setItem('ar_columnist_tasks', JSON.stringify(DEFAULT_TASKS));
    if (!savedEvents) localStorage.setItem('ar_columnist_events', JSON.stringify(DEFAULT_EVENTS));
  };

  // Guardar configuración
  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('ar_columnist_config', JSON.stringify(updated));
      if (newConfig.theme) {
        document.documentElement.setAttribute('data-theme', newConfig.theme);
      }
      return updated;
    });
  };

  const addGlossaryTerm = (term: string, definition: string, source?: string) => {
    const entry: GlossaryTerm = {
      id: 'g_' + Math.random().toString(36).slice(2, 9),
      term,
      definition,
      source,
      addedAt: new Date().toISOString()
    };
    setGlossary(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('ar_glossary', JSON.stringify(updated));
      return updated;
    });
  };

  const removeGlossaryTerm = (id: string) => {
    setGlossary(prev => {
      const updated = prev.filter(g => g.id !== id);
      localStorage.setItem('ar_glossary', JSON.stringify(updated));
      return updated;
    });
  };

  const markModuleComplete = (moduleId: string) => {
    setCourseProgress(prev => {
      if (prev.completedModules.includes(moduleId)) return prev;
      const updated = { ...prev, completedModules: [...prev.completedModules, moduleId] };
      localStorage.setItem('ar_course_progress', JSON.stringify(updated));
      return updated;
    });
  };

  // --- API DE NOTAS ---
  const createNote = async (title: string, content = '') => {
    const newNote: Omit<Note, 'id'> = {
      title,
      content,
      status: 'draft',
      words_count: content.split(/\s+/).filter(Boolean).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let created: Note;

    if (isDbConnected && supabase) {
      const { data, error } = await supabase.from('notes').insert(newNote).select().single();
      if (error) {
        console.error('Error insertando nota en Supabase:', error);
        throw error;
      }
      created = data;
    } else {
      created = {
        ...newNote,
        id: 'note_' + Math.random().toString(36).substr(2, 9)
      };
      const updatedNotes = [created, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem('ar_columnist_notes', JSON.stringify(updatedNotes));
    }

    setNotes(prev => [created, ...prev]);
    setActiveNoteId(created.id);
    return created;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };
    if (updates.content !== undefined) {
      updatedFields.words_count = updates.content.split(/\s+/).filter(Boolean).length;
    }

    setSyncStatus('saving');
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updatedFields } : n));

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('notes').update(updatedFields).eq('id', id);
      if (error) {
        console.error('Error actualizando nota en Supabase:', error);
        setSyncStatus('error');
      } else {
        setSyncStatus('saved');
      }
    } else {
      const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updatedFields } : n);
      localStorage.setItem('ar_columnist_notes', JSON.stringify(updatedNotes));
      setSyncStatus('saved');
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSyncStatus('idle'), 2500);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando nota en Supabase:', error);
      }
    } else {
      const updatedNotes = notes.filter(n => n.id !== id);
      localStorage.setItem('ar_columnist_notes', JSON.stringify(updatedNotes));
    }
  };

  // --- API DE TAREAS ---
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      created_at: new Date().toISOString()
    };

    let created: Task;

    if (isDbConnected && supabase) {
      const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
      if (error) {
        console.error('Error insertando tarea en Supabase:', error);
        throw error;
      }
      created = data;
    } else {
      created = {
        ...newTask,
        id: 'task_' + Math.random().toString(36).substr(2, 9)
      };
      const updatedTasks = [...tasks, created];
      setTasks(updatedTasks);
      localStorage.setItem('ar_columnist_tasks', JSON.stringify(updatedTasks));
    }

    setTasks(prev => [...prev, created]);
    return created;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) {
        console.error('Error actualizando tarea en Supabase:', error);
      }
    } else {
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('ar_columnist_tasks', JSON.stringify(updatedTasks));
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando tarea en Supabase:', error);
      }
    } else {
      const updatedTasks = tasks.filter(t => t.id !== id);
      localStorage.setItem('ar_columnist_tasks', JSON.stringify(updatedTasks));
    }
  };

  // --- API DE EVENTOS ---
  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    const newEvent: Omit<CalendarEvent, 'id'> = {
      ...eventData,
      created_at: new Date().toISOString()
    };

    let created: CalendarEvent;

    if (isDbConnected && supabase) {
      const { data, error } = await supabase.from('events').insert(newEvent).select().single();
      if (error) {
        console.error('Error insertando evento en Supabase:', error);
        throw error;
      }
      created = data;
    } else {
      created = {
        ...newEvent,
        id: 'event_' + Math.random().toString(36).substr(2, 9)
      };
      const updatedEvents = [...events, created];
      setEvents(updatedEvents);
      localStorage.setItem('ar_columnist_events', JSON.stringify(updatedEvents));
    }

    setEvents(prev => [...prev, created]);
    return created;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (error) {
        console.error('Error actualizando evento en Supabase:', error);
      }
    } else {
      const updatedEvents = events.map(e => e.id === id ? { ...e, ...updates } : e);
      localStorage.setItem('ar_columnist_events', JSON.stringify(updatedEvents));
    }
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        console.error('Error eliminando evento en Supabase:', error);
      }
    } else {
      const updatedEvents = events.filter(e => e.id !== id);
      localStorage.setItem('ar_columnist_events', JSON.stringify(updatedEvents));
    }
  };

  return (
    <AppContext.Provider value={{
      activeSection,
      setActiveSection,
      notes,
      activeNoteId,
      setActiveNoteId,
      tasks,
      events,
      config,
      updateConfig,
      createNote,
      updateNote,
      deleteNote,
      createTask,
      updateTask,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
      glossary,
      addGlossaryTerm,
      removeGlossaryTerm,
      courseProgress,
      markModuleComplete,
      syncStatus,
      loading,
      isDbConnected
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};
