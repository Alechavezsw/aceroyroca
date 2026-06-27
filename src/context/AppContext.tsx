import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { BUILT_IN_COURSE, BUILT_IN_COURSE_ID, type Course } from '../data/courses';
import { buildDraftFromNews, buildDraftFromAnalysis, type DraftSource } from '../utils/draftBuilder';
import {
  fetchGlossaryFromDb,
  upsertGlossaryTerm as syncGlossaryTerm,
  deleteGlossaryTermFromDb,
  mergeGlossary,
  fetchCustomCourses,
  saveCustomCourses,
  fetchCourseProgress,
  saveCourseProgress,
  fetchWatchlist,
  saveWatchlist as syncWatchlist,
  fetchBriefingHistory,
  saveBriefingHistoryRemote,
  fetchUserConfigFromDb,
  saveUserConfigToDb,
  fetchPaymentEntries,
  savePaymentEntriesRemote
} from '../utils/editorialSync';
import {
  buildBriefingPrompt,
  fetchBriefingFromApi,
  createBriefingEntry,
  loadBriefingHistory,
  saveBriefingHistory,
  getLastAutoBriefingDate,
  markAutoBriefingDone,
  getTodayKey,
  hasBriefingToday
} from '../utils/briefingService';
import { loadWatchlist, saveWatchlist, getWatchlistProjectNames } from '../utils/projectWatchlist';
import {
  loadPaymentEntries,
  savePaymentEntries,
  createPaymentEntry,
  getWeekKey,
  type PaymentEntry,
  type ProposalType
} from '../utils/paymentTracker';

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
  category?: string;
  example?: string;
  source?: string;
  addedAt: string;
}

export interface CourseProgress {
  activeCourseId: string;
  progressByCourse: Record<string, string[]>;
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
  autoBriefing: boolean;
}

export interface BriefingEntry {
  id: string;
  content: string;
  createdAt: string;
  dateKey: string;
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
  createDraftFromSource: (source: DraftSource) => Promise<Note>;
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
  addGlossaryTerm: (term: string, definition: string, opts?: { source?: string; category?: string; example?: string }) => boolean;
  updateGlossaryTerm: (id: string, updates: Partial<Omit<GlossaryTerm, 'id' | 'addedAt'>>) => void;
  removeGlossaryTerm: (id: string) => void;

  courses: Course[];
  courseProgress: CourseProgress;
  activeCourse: Course;
  createCourse: (title: string, description: string) => Course;
  deleteCourse: (courseId: string) => void;
  setActiveCourse: (courseId: string) => void;
  addCourseStage: (courseId: string, title: string, subtitle: string) => void;
  addCourseModule: (courseId: string, stageId: string, title: string, content: string) => void;
  markModuleComplete: (moduleId: string) => void;

  watchlist: string[];
  toggleWatchlist: (projectId: string) => void;
  isWatchlisted: (projectId: string) => boolean;

  briefingHistory: BriefingEntry[];
  runBriefing: (opts?: { silent?: boolean }) => Promise<BriefingEntry | null>;
  autoBriefingOpen: boolean;
  setAutoBriefingOpen: (open: boolean) => void;

  syncStatus: SyncStatus;

  paymentEntries: PaymentEntry[];
  addPaymentEntry: (data: {
    title: string;
    noteId?: string | null;
    proposalType?: ProposalType;
    approved?: boolean;
    published?: boolean;
  }) => void;
  updatePaymentEntry: (id: string, updates: Partial<PaymentEntry>) => void;
  deletePaymentEntry: (id: string) => void;
  markWeekPaid: (weekKey: string) => void;
  getCurrentWeekKey: () => string;
  getPaymentEntryForNote: (noteId: string) => PaymentEntry | undefined;
  toggleNotePublished: (noteId: string, published: boolean) => void;

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

Por Ale Chavez

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
    title: 'Reunión de pauta editorial',
    description: 'Definición de temas principales y enfoque de investigación de la semana.',
    start_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T14:30:00Z',
    end_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T15:30:00Z',
    type: 'meeting',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_CONFIG: AppConfig = {
  authorName: 'Ale Chavez',
  geminiModel: 'gemini-2.0-flash',
  localApiKey: '',
  theme: 'dark',
  rssFeeds: [
    'https://news.google.com/rss/search?q=mineria+argentina+OR+cobre+san+juan&hl=es-419&gl=AR&ceid=AR:es-419',
    'https://www.mining.com/feed/'
  ],
  wordGoalMin: 900,
  wordGoalMax: 1200,
  autoBriefing: true
};

const DEFAULT_GLOSSARY: GlossaryTerm[] = [
  { id: 'g1', term: 'Ley de corte', definition: 'Grado mínimo de metal en el mineral para que su procesamiento sea económicamente viable.', category: 'Geología', source: 'Curso Etapa 2', addedAt: new Date().toISOString() },
  { id: 'g2', term: 'Pórfido de cobre', definition: 'Yacimiento de baja ley pero enorme volumen, típico de Los Azules y Josemaría.', category: 'Geología', example: 'Los Azules tiene reservas estimadas en cientos de millones de toneladas con leyes de ~0,4% Cu.', source: 'Curso Etapa 2', addedAt: new Date().toISOString() },
  { id: 'g3', term: 'RIGI', definition: 'Régimen de Incentivo para Grandes Inversiones; estabilidad fiscal para proyectos superiores a USD 200 millones.', category: 'Legal', source: 'Curso Etapa 6', addedAt: new Date().toISOString() },
  { id: 'g4', term: 'Lixiviación', definition: 'Proceso químico que disuelve el metal del mineral usando soluciones en pilas o montones.', category: 'Procesos', example: 'Los Azules evalúa lixiviación en pilas para reducir costos operativos.', source: 'Curso Etapa 4', addedAt: new Date().toISOString() }
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
  const [courses, setCourses] = useState<Course[]>([BUILT_IN_COURSE]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>({
    activeCourseId: BUILT_IN_COURSE_ID,
    progressByCourse: { [BUILT_IN_COURSE_ID]: [] }
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist());
  const [briefingHistory, setBriefingHistory] = useState<BriefingEntry[]>(loadBriefingHistory());
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>(loadPaymentEntries());
  const [autoBriefingOpen, setAutoBriefingOpen] = useState(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoBriefingRan = React.useRef(false);

  // Cargar datos (Supabase o LocalStorage)
  useEffect(() => {
    const initializeData = async () => {
      // 1. Cargar Configuración (local + Supabase)
      let mergedConfig: AppConfig = { ...DEFAULT_CONFIG };
      const savedConfig = localStorage.getItem('ar_columnist_config');
      if (savedConfig) {
        mergedConfig = { ...mergedConfig, ...JSON.parse(savedConfig) };
      }

      if (isSupabaseConfigured && supabase) {
        const remoteConfig = await fetchUserConfigFromDb();
        if (remoteConfig) {
          mergedConfig = { ...mergedConfig, ...remoteConfig };
        }
      }

      if (!mergedConfig.authorName || ['Carlos Fernández', 'Carlos'].includes(mergedConfig.authorName)) {
        mergedConfig.authorName = 'Ale Chavez';
      }

      localStorage.setItem('ar_columnist_config', JSON.stringify(mergedConfig));
      if (isSupabaseConfigured && supabase) {
        saveUserConfigToDb(mergedConfig).catch(console.warn);
      }

      setConfig(mergedConfig);
      document.documentElement.setAttribute('data-theme', mergedConfig.theme || 'dark');

      const savedGlossary = localStorage.getItem('ar_glossary');
      const localGlossary: GlossaryTerm[] = savedGlossary ? JSON.parse(savedGlossary) : DEFAULT_GLOSSARY;
      if (!savedGlossary) localStorage.setItem('ar_glossary', JSON.stringify(DEFAULT_GLOSSARY));

      let mergedGlossary = localGlossary;
      let mergedCourses: Course[] = [BUILT_IN_COURSE];
      let mergedProgress: CourseProgress = {
        activeCourseId: BUILT_IN_COURSE_ID,
        progressByCourse: { [BUILT_IN_COURSE_ID]: [] }
      };
      let mergedWatchlist = loadWatchlist();
      let mergedBriefingHistory = loadBriefingHistory();
      let mergedPayments = loadPaymentEntries();

      const savedCourse = localStorage.getItem('ar_course_progress');
      if (savedCourse) {
        const parsed = JSON.parse(savedCourse);
        if (parsed.progressByCourse) mergedProgress = parsed;
        else if (parsed.completedModules) {
          mergedProgress = {
            activeCourseId: BUILT_IN_COURSE_ID,
            progressByCourse: { [BUILT_IN_COURSE_ID]: parsed.completedModules }
          };
        }
      }

      const savedCourses = localStorage.getItem('ar_custom_courses');
      if (savedCourses) {
        mergedCourses = [BUILT_IN_COURSE, ...JSON.parse(savedCourses)];
      }

      // 2. Cargar Datos
      if (isSupabaseConfigured && supabase) {
        try {
          const [notesRes, tasksRes, eventsRes, remoteGlossary, remoteCourses, remoteProgress, remoteWatchlist, remoteBriefings, remotePayments] = await Promise.all([
            supabase.from('notes').select('*').order('updated_at', { ascending: false }),
            supabase.from('tasks').select('*').order('created_at', { ascending: true }),
            supabase.from('events').select('*').order('start_date', { ascending: true }),
            fetchGlossaryFromDb(),
            fetchCustomCourses(),
            fetchCourseProgress(),
            fetchWatchlist(),
            fetchBriefingHistory(),
            fetchPaymentEntries()
          ]);

          if (notesRes.error) throw notesRes.error;
          if (tasksRes.error) throw tasksRes.error;
          if (eventsRes.error) throw eventsRes.error;

          if (remoteGlossary.length) {
            mergedGlossary = mergeGlossary(localGlossary, remoteGlossary);
            localStorage.setItem('ar_glossary', JSON.stringify(mergedGlossary));
          }

          if (remoteCourses.length) {
            mergedCourses = [BUILT_IN_COURSE, ...remoteCourses];
            localStorage.setItem('ar_custom_courses', JSON.stringify(remoteCourses));
          }

          if (remoteProgress) {
            mergedProgress = remoteProgress;
            localStorage.setItem('ar_course_progress', JSON.stringify(remoteProgress));
          }

          if (remoteWatchlist?.length) {
            mergedWatchlist = remoteWatchlist;
            saveWatchlist(mergedWatchlist);
          } else if (mergedWatchlist.length) {
            syncWatchlist(mergedWatchlist).catch(console.warn);
          }

          if (remoteBriefings?.length) {
            mergedBriefingHistory = remoteBriefings;
            saveBriefingHistory(mergedBriefingHistory);
          }

          if (remotePayments?.length) {
            mergedPayments = remotePayments;
            savePaymentEntries(mergedPayments);
          } else if (mergedPayments.length) {
            savePaymentEntriesRemote(mergedPayments).catch(console.warn);
          }

          setGlossary(mergedGlossary);
          setCourses(mergedCourses);
          setCourseProgress(mergedProgress);
          setWatchlist(mergedWatchlist);
          setBriefingHistory(mergedBriefingHistory);
          setPaymentEntries(mergedPayments);

          setNotes(notesRes.data || []);
          setTasks(tasksRes.data || []);
          setEvents(eventsRes.data || []);
          setIsDbConnected(true);

          if (notesRes.data && notesRes.data.length > 0) {
            setActiveNoteId(notesRes.data[0].id);
          }
        } catch (e) {
          console.error('Error conectando a Supabase, usando LocalStorage de respaldo:', e);
          setGlossary(mergedGlossary);
          setCourses(mergedCourses);
          setCourseProgress(mergedProgress);
          setWatchlist(mergedWatchlist);
          setBriefingHistory(mergedBriefingHistory);
          setPaymentEntries(mergedPayments);
          setIsDbConnected(false);
          loadFromLocalStorage();
        }
      } else {
        setGlossary(mergedGlossary);
        setCourses(mergedCourses);
        setCourseProgress(mergedProgress);
        setWatchlist(mergedWatchlist);
        setBriefingHistory(mergedBriefingHistory);
        setPaymentEntries(mergedPayments);
        loadFromLocalStorage();
      }
      setLoading(false);
    };

    initializeData();
  }, []);

  const persistWatchlist = (ids: string[]) => {
    saveWatchlist(ids);
    syncWatchlist(ids).catch(console.warn);
  };

  const persistBriefingHistory = (history: BriefingEntry[]) => {
    saveBriefingHistory(history);
    if (isDbConnected) saveBriefingHistoryRemote(history).catch(console.warn);
  };

  const toggleWatchlist = (projectId: string) => {
    setWatchlist(prev => {
      const updated = prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId];
      persistWatchlist(updated);
      return updated;
    });
  };

  const isWatchlisted = (projectId: string) => watchlist.includes(projectId);

  const runBriefing = async (opts?: { silent?: boolean }): Promise<BriefingEntry | null> => {
    const prompt = buildBriefingPrompt(notes, tasks, events, getWatchlistProjectNames(watchlist), config.authorName);
    try {
      const content = await fetchBriefingFromApi(prompt, config.geminiModel);
      const entry = createBriefingEntry(content);
      setBriefingHistory(prev => {
        const withoutToday = prev.filter(h => h.dateKey !== entry.dateKey);
        const updated = [entry, ...withoutToday];
        persistBriefingHistory(updated);
        return updated;
      });
      markAutoBriefingDone();
      if (!opts?.silent) setAutoBriefingOpen(true);
      return entry;
    } catch {
      return null;
    }
  };

  // Briefing automático al iniciar (una vez por día)
  useEffect(() => {
    if (loading || autoBriefingRan.current) return;
    const cfg = config;
    if (!cfg.autoBriefing) return;

    const today = getTodayKey();
    if (getLastAutoBriefingDate() === today || hasBriefingToday(briefingHistory)) return;

    autoBriefingRan.current = true;
    runBriefing({ silent: true }).then(entry => {
      if (entry) setAutoBriefingOpen(true);
    });
  }, [loading, config.autoBriefing]);

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
      saveUserConfigToDb(updated).catch(console.warn);
      return updated;
    });
  };

  const persistCourses = (allCourses: Course[]) => {
    const custom = allCourses.filter(c => !c.isBuiltIn);
    localStorage.setItem('ar_custom_courses', JSON.stringify(custom));
    if (isDbConnected) saveCustomCourses(allCourses).catch(console.warn);
  };

  const persistCourseProgress = (progress: CourseProgress) => {
    localStorage.setItem('ar_course_progress', JSON.stringify(progress));
    if (isDbConnected) saveCourseProgress(progress).catch(console.warn);
  };

  const activeCourse = courses.find(c => c.id === courseProgress.activeCourseId) || BUILT_IN_COURSE;

  const addGlossaryTerm = (
    term: string,
    definition: string,
    opts?: { source?: string; category?: string; example?: string }
  ): boolean => {
    const normalized = term.trim().toLowerCase();
    if (glossary.some(g => g.term.toLowerCase() === normalized)) return false;

    const entry: GlossaryTerm = {
      id: 'g_' + Math.random().toString(36).slice(2, 9),
      term: term.trim(),
      definition: definition.trim(),
      category: opts?.category || 'General',
      example: opts?.example?.trim() || undefined,
      source: opts?.source || 'Manual',
      addedAt: new Date().toISOString()
    };
    setGlossary(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('ar_glossary', JSON.stringify(updated));
      return updated;
    });
    if (isDbConnected) syncGlossaryTerm(entry).catch(console.warn);
    return true;
  };

  const updateGlossaryTerm = (id: string, updates: Partial<Omit<GlossaryTerm, 'id' | 'addedAt'>>) => {
    setGlossary(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, ...updates } : g);
      localStorage.setItem('ar_glossary', JSON.stringify(updated));
      const changed = updated.find(g => g.id === id);
      if (changed && isDbConnected) syncGlossaryTerm(changed).catch(console.warn);
      return updated;
    });
  };

  const removeGlossaryTerm = (id: string) => {
    setGlossary(prev => {
      const updated = prev.filter(g => g.id !== id);
      localStorage.setItem('ar_glossary', JSON.stringify(updated));
      return updated;
    });
    if (isDbConnected) deleteGlossaryTermFromDb(id).catch(console.warn);
  };

  const markModuleComplete = (moduleId: string) => {
    const course = courses.find(c => c.id === courseProgress.activeCourseId) || BUILT_IN_COURSE;
    for (const stage of course.stages) {
      const mod = stage.modules.find(m => m.id === moduleId);
      if (mod?.keyTerms?.length) {
        mod.keyTerms.forEach(t => {
          addGlossaryTerm(t, `Término clave del módulo "${mod.title}".`, {
            source: `Curso: ${course.title}`,
            category: 'General'
          });
        });
      }
    }

    setCourseProgress(prev => {
      const courseId = prev.activeCourseId;
      const current = prev.progressByCourse[courseId] || [];
      if (current.includes(moduleId)) return prev;
      const updated: CourseProgress = {
        ...prev,
        progressByCourse: {
          ...prev.progressByCourse,
          [courseId]: [...current, moduleId]
        }
      };
      persistCourseProgress(updated);
      return updated;
    });
  };

  const setActiveCourse = (courseId: string) => {
    setCourseProgress(prev => {
      const updated: CourseProgress = {
        activeCourseId: courseId,
        progressByCourse: {
          ...prev.progressByCourse,
          [courseId]: prev.progressByCourse[courseId] || []
        }
      };
      persistCourseProgress(updated);
      return updated;
    });
  };

  const createCourse = (title: string, description: string): Course => {
    const course: Course = {
      id: 'course_' + Math.random().toString(36).slice(2, 9),
      title: title.trim(),
      description: description.trim(),
      stages: [{
        id: 'stage_' + Math.random().toString(36).slice(2, 6),
        number: 1,
        title: 'Introducción',
        subtitle: 'Primera etapa del curso',
        modules: []
      }],
      createdAt: new Date().toISOString()
    };
    setCourses(prev => {
      const updated = [...prev, course];
      persistCourses(updated);
      return updated;
    });
    setActiveCourse(course.id);
    return course;
  };

  const deleteCourse = (courseId: string) => {
    const target = courses.find(c => c.id === courseId);
    if (!target || target.isBuiltIn) return;
    setCourses(prev => {
      const updated = prev.filter(c => c.id !== courseId);
      persistCourses(updated);
      return updated;
    });
    setCourseProgress(prev => {
      const { [courseId]: _, ...rest } = prev.progressByCourse;
      const nextActive = prev.activeCourseId === courseId ? BUILT_IN_COURSE_ID : prev.activeCourseId;
      const updated = { activeCourseId: nextActive, progressByCourse: rest };
      persistCourseProgress(updated);
      return updated;
    });
  };

  const addCourseStage = (courseId: string, title: string, subtitle: string) => {
    setCourses(prev => {
      const updated = prev.map(c => {
        if (c.id !== courseId || c.isBuiltIn) return c;
        return {
          ...c,
          stages: [...c.stages, {
            id: 'stage_' + Math.random().toString(36).slice(2, 6),
            number: c.stages.length + 1,
            title: title.trim(),
            subtitle: subtitle.trim(),
            modules: []
          }]
        };
      });
      persistCourses(updated);
      return updated;
    });
  };

  const addCourseModule = (courseId: string, stageId: string, title: string, content: string) => {
    setCourses(prev => {
      const updated = prev.map(c => {
        if (c.id !== courseId || c.isBuiltIn) return c;
        return {
          ...c,
          stages: c.stages.map(s => s.id !== stageId ? s : {
            ...s,
            modules: [...s.modules, {
              id: 'mod_' + Math.random().toString(36).slice(2, 9),
              title: title.trim(),
              duration: '10 min',
              content: content.trim(),
              keyTerms: []
            }]
          })
        };
      });
      persistCourses(updated);
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

  const createDraftFromSource = async (source: DraftSource) => {
    const draft = source.analysis
      ? buildDraftFromAnalysis(source.title, source.analysis, source.source)
      : buildDraftFromNews(source);
    const note = await createNote(draft.title, draft.content);
    setActiveSection('editor');
    return note;
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
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const toEventDbPayload = (
    data: Omit<CalendarEvent, 'id' | 'created_at'> | Partial<CalendarEvent>
  ): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.start_date !== undefined) payload.start_date = data.start_date;
    if (data.end_date !== undefined) payload.end_date = data.end_date;
    if (data.type !== undefined) payload.type = data.type;
    if (data.note_id !== undefined) {
      payload.note_id = data.note_id && UUID_RE.test(data.note_id) ? data.note_id : null;
    }
    if (data.task_id !== undefined) {
      payload.task_id = data.task_id && UUID_RE.test(data.task_id) ? data.task_id : null;
    }
    return payload;
  };

  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    let created: CalendarEvent;

    if (isDbConnected && supabase) {
      const { data, error } = await supabase
        .from('events')
        .insert(toEventDbPayload(eventData))
        .select()
        .single();
      if (error) {
        console.error('Error insertando evento en Supabase:', error);
        throw error;
      }
      created = data;
    } else {
      created = {
        ...eventData,
        id: 'event_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
    }

    setEvents(prev => {
      const updated = [...prev, created];
      localStorage.setItem('ar_columnist_events', JSON.stringify(updated));
      return updated;
    });
    return created;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const sanitized: Partial<CalendarEvent> = { ...updates };
    if (updates.note_id !== undefined) {
      sanitized.note_id = updates.note_id && UUID_RE.test(updates.note_id) ? updates.note_id : null;
    }
    if (updates.task_id !== undefined) {
      sanitized.task_id = updates.task_id && UUID_RE.test(updates.task_id) ? updates.task_id : null;
    }

    setEvents(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...sanitized } : e);
      localStorage.setItem('ar_columnist_events', JSON.stringify(updated));
      return updated;
    });

    if (isDbConnected && supabase) {
      const { error } = await supabase.from('events').update(toEventDbPayload(sanitized)).eq('id', id);
      if (error) {
        console.error('Error actualizando evento en Supabase:', error);
        throw error;
      }
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

  const persistPaymentEntries = (entries: PaymentEntry[]) => {
    savePaymentEntries(entries);
    savePaymentEntriesRemote(entries).catch(console.warn);
  };

  const addPaymentEntry = (data: {
    title: string;
    noteId?: string | null;
    proposalType?: ProposalType;
    approved?: boolean;
    published?: boolean;
  }) => {
    setPaymentEntries(prev => {
      const entry = createPaymentEntry(prev, data);
      const updated = [...prev, entry];
      persistPaymentEntries(updated);
      return updated;
    });
  };

  const updatePaymentEntry = (id: string, updates: Partial<PaymentEntry>) => {
    setPaymentEntries(prev => {
      const updated = prev.map(e => (e.id === id ? { ...e, ...updates } : e));
      persistPaymentEntries(updated);
      return updated;
    });
  };

  const deletePaymentEntry = (id: string) => {
    setPaymentEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      persistPaymentEntries(updated);
      return updated;
    });
  };

  const markWeekPaid = (weekKey: string) => {
    const now = new Date().toISOString();
    setPaymentEntries(prev => {
      const updated = prev.map(e =>
        e.weekKey === weekKey && e.approved && !e.paid
          ? { ...e, paid: true, paidAt: now }
          : e
      );
      persistPaymentEntries(updated);
      return updated;
    });
  };

  const getCurrentWeekKey = () => getWeekKey();

  const getPaymentEntryForNote = (noteId: string) =>
    paymentEntries.find(e => e.noteId === noteId && !e.paid);

  const toggleNotePublished = (noteId: string, published: boolean) => {
    const entry = paymentEntries.find(e => e.noteId === noteId);
    if (entry) {
      updatePaymentEntry(entry.id, { published });
    } else if (published) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        addPaymentEntry({
          title: note.title,
          noteId,
          approved: true,
          published: true
        });
      }
    }
    if (published) {
      updateNote(noteId, { status: 'published' }).catch(console.warn);
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
      createDraftFromSource,
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
      updateGlossaryTerm,
      removeGlossaryTerm,
      courses,
      courseProgress,
      activeCourse,
      createCourse,
      deleteCourse,
      setActiveCourse,
      addCourseStage,
      addCourseModule,
      markModuleComplete,
      watchlist,
      toggleWatchlist,
      isWatchlisted,
      briefingHistory,
      runBriefing,
      autoBriefingOpen,
      setAutoBriefingOpen,
      syncStatus,
      paymentEntries,
      addPaymentEntry,
      updatePaymentEntry,
      deletePaymentEntry,
      markWeekPaid,
      getCurrentWeekKey,
      getPaymentEntryForNote,
      toggleNotePublished,
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
