import { supabase } from '../supabase/client';
import type { GlossaryTerm, CourseProgress } from '../context/AppContext';
import type { Course } from '../data/courses';

const STORE_KEYS = {
  CUSTOM_COURSES: 'custom_courses',
  COURSE_PROGRESS: 'course_progress',
  WATCHLIST: 'watchlist',
  BRIEFING_HISTORY: 'briefing_history'
} as const;

export { STORE_KEYS };

interface DbGlossaryRow {
  id: string;
  term: string;
  definition: string;
  source: string | null;
  category: string | null;
  example: string | null;
  created_at: string;
}

export async function fetchGlossaryFromDb(): Promise<GlossaryTerm[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('glossary')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Sync glosario (lectura):', error.message);
    return [];
  }

  return (data as DbGlossaryRow[]).map(row => ({
    id: row.id,
    term: row.term,
    definition: row.definition,
    source: row.source || undefined,
    category: row.category || 'General',
    example: row.example || undefined,
    addedAt: row.created_at
  }));
}

export async function upsertGlossaryTerm(term: GlossaryTerm): Promise<string> {
  if (!supabase) return term.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term.id);

  const payload: Record<string, unknown> = {
    term: term.term,
    definition: term.definition,
    source: term.source || ''
  };

  if (term.category) payload.category = term.category;
  if (term.example) payload.example = term.example;

  if (isUuid) {
    await supabase.from('glossary').upsert({ id: term.id, ...payload });
    return term.id;
  }

  const { data, error } = await supabase.from('glossary').insert(payload).select('id').single();
  if (error) {
    console.warn('Sync glosario (escritura):', error.message);
    return term.id;
  }
  return data?.id || term.id;
}

export async function deleteGlossaryTermFromDb(id: string): Promise<void> {
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await supabase.from('glossary').delete().eq('id', id);
}

export async function syncAllGlossary(terms: GlossaryTerm[]): Promise<void> {
  if (!supabase) return;
  for (const term of terms) {
    await upsertGlossaryTerm(term);
  }
}

export async function fetchEditorialStore<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_editorial_store')
    .select('data')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.warn(`Sync store ${key}:`, error.message);
    return null;
  }
  return (data?.data as T) ?? null;
}

export async function saveEditorialStore(key: string, data: unknown): Promise<void> {
  if (!supabase) return;
  await supabase.from('user_editorial_store').upsert({
    key,
    data,
    updated_at: new Date().toISOString()
  });
}

export async function fetchCustomCourses(): Promise<Course[]> {
  return (await fetchEditorialStore<Course[]>(STORE_KEYS.CUSTOM_COURSES)) || [];
}

export async function saveCustomCourses(courses: Course[]): Promise<void> {
  const custom = courses.filter(c => !c.isBuiltIn);
  await saveEditorialStore(STORE_KEYS.CUSTOM_COURSES, custom);
}

export async function fetchCourseProgress(): Promise<CourseProgress | null> {
  return fetchEditorialStore<CourseProgress>(STORE_KEYS.COURSE_PROGRESS);
}

export async function saveCourseProgress(progress: CourseProgress): Promise<void> {
  await saveEditorialStore(STORE_KEYS.COURSE_PROGRESS, progress);
}

export async function fetchWatchlist(): Promise<string[] | null> {
  return fetchEditorialStore<string[]>(STORE_KEYS.WATCHLIST);
}

export async function saveWatchlist(ids: string[]): Promise<void> {
  await saveEditorialStore(STORE_KEYS.WATCHLIST, ids);
}

export async function fetchBriefingHistory(): Promise<import('./briefingService').BriefingEntry[] | null> {
  return fetchEditorialStore(STORE_KEYS.BRIEFING_HISTORY);
}

export async function saveBriefingHistoryRemote(history: import('./briefingService').BriefingEntry[]): Promise<void> {
  await saveEditorialStore(STORE_KEYS.BRIEFING_HISTORY, history.slice(0, 30));
}

export function mergeGlossary(local: GlossaryTerm[], remote: GlossaryTerm[]): GlossaryTerm[] {
  const map = new Map<string, GlossaryTerm>();
  for (const t of remote) map.set(t.term.toLowerCase(), t);
  for (const t of local) {
    const key = t.term.toLowerCase();
    const existing = map.get(key);
    if (!existing || new Date(t.addedAt) > new Date(existing.addedAt)) {
      map.set(key, t);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
}
