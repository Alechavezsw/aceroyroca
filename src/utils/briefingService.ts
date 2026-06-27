import type { Note, Task, CalendarEvent } from '../context/AppContext';

export interface BriefingEntry {
  id: string;
  content: string;
  createdAt: string;
  dateKey: string;
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildBriefingPrompt(
  notes: Note[],
  tasks: Task[],
  events: CalendarEvent[],
  watchlistNames: string[] = [],
  authorName = 'Ale Chavez'
): string {
  const pendingTasks = tasks.filter(t => t.status !== 'published').slice(0, 5);
  const nextDelivery = events
    .filter(e => e.type === 'delivery' && new Date(e.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

  const watchlistLine = watchlistNames.length
    ? `- Proyectos en seguimiento: ${watchlistNames.join(', ')}`
    : '';

  return `Eres el asistente editorial de ${authorName} (Acero & Roca).

DATOS DEL DÍA:
- Borradores activos: ${notes.length}
- Tareas pendientes: ${pendingTasks.map(t => t.title).join('; ') || 'ninguna'}
- Próxima entrega: ${nextDelivery ? `${nextDelivery.title} (${nextDelivery.start_date})` : 'sin entregas programadas'}
- Palabras totales redactadas: ${notes.reduce((s, n) => s + n.words_count, 0)}
${watchlistLine}

Genera un BRIEFING MATUTINO en español con:
1. Resumen ejecutivo (2 líneas)
2. Tres ideas concretas de columna para hoy (título + ángulo en una línea cada una)
3. Una alerta o tendencia del sector minero argentino a monitorear
4. Prioridad editorial sugerida para la jornada
${watchlistNames.length ? '5. Mención breve de qué vigilar en los proyectos en seguimiento' : ''}

Sé directo, periodístico y accionable. Máximo 350 palabras.`;
}

export async function fetchBriefingFromApi(prompt: string, model: string): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model
    })
  });

  if (!res.ok) throw new Error('Error al conectar con Gemini');
  const data = await res.json();
  return data.content || 'No se pudo generar el briefing.';
}

export function createBriefingEntry(content: string): BriefingEntry {
  const now = new Date().toISOString();
  return {
    id: 'brief_' + Math.random().toString(36).slice(2, 9),
    content,
    createdAt: now,
    dateKey: getTodayKey()
  };
}

export function loadBriefingHistory(): BriefingEntry[] {
  try {
    const raw = localStorage.getItem('ar_briefing_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBriefingHistory(history: BriefingEntry[]): void {
  const trimmed = history.slice(0, 30);
  localStorage.setItem('ar_briefing_history', JSON.stringify(trimmed));
}

export function hasBriefingToday(history: BriefingEntry[]): boolean {
  const today = getTodayKey();
  return history.some(h => h.dateKey === today);
}

export function getLastAutoBriefingDate(): string | null {
  return localStorage.getItem('ar_briefing_auto_date');
}

export function markAutoBriefingDone(): void {
  localStorage.setItem('ar_briefing_auto_date', getTodayKey());
}
