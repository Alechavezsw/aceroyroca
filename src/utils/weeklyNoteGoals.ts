import { getWeekKey, getWeekStartSaturday, getWeekEndFriday, formatWeekRange } from './paymentTracker';
import type { Task } from '../context/AppContext';

export const WEEKLY_NOTE_GOALS = {
  minimo: 7,
  ideal: 10,
  super: 14
} as const;

export type WeeklyGoalTier = 'bajo' | 'minimo' | 'ideal' | 'super';

/** taskId → fecha ISO en que la tarjeta pasó a "publicada" en el kanban */
export type TaskPublishedLog = Record<string, string>;

const PUBLISHED_LOG_KEY = 'ar_task_published_log';

export interface WeeklyNoteGoalStats {
  count: number;
  weekKey: string;
  weekLabel: string;
  tier: WeeklyGoalTier;
  tierLabel: string;
  nextTarget: number | null;
  nextTargetLabel: string | null;
  progressPct: number;
  remainingToMin: number;
  remainingToIdeal: number;
  remainingToSuper: number;
}

function isDateInWeek(isoDate: string, weekKey: string): boolean {
  const start = getWeekStartSaturday(new Date(`${weekKey}T12:00:00`));
  const end = getWeekEndFriday(start);
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

export function loadTaskPublishedLog(): TaskPublishedLog {
  try {
    const raw = localStorage.getItem(PUBLISHED_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as TaskPublishedLog;
    }
  } catch {
    /* fallthrough */
  }
  return {};
}

export function saveTaskPublishedLog(log: TaskPublishedLog): void {
  localStorage.setItem(PUBLISHED_LOG_KEY, JSON.stringify(log));
}

/**
 * Ajusta el log contra el estado real del kanban:
 * - Tarjeta publicada sin registro: si antes se la vio en otra etapa, se anota ahora
 *   (transición real); si no hay historia previa, se usa su created_at para no
 *   inflar la semana corriente con tarjetas viejas.
 * - Tarjeta que volvió a otra etapa: se borra su registro (deja de contar).
 */
export function reconcileTaskPublishedLog(
  log: TaskPublishedLog,
  currentTasks: Task[],
  previousTasks: Task[] = []
): TaskPublishedLog {
  const next: TaskPublishedLog = { ...log };
  const prevStatus = new Map(previousTasks.map(t => [t.id, t.status]));

  for (const task of currentTasks) {
    if (task.status === 'published') {
      if (!next[task.id]) {
        const wasKnownUnpublished =
          prevStatus.has(task.id) && prevStatus.get(task.id) !== 'published';
        next[task.id] = wasKnownUnpublished ? new Date().toISOString() : task.created_at;
      }
    } else if (next[task.id]) {
      delete next[task.id];
    }
  }

  return next;
}

export function countTasksPublishedInWeek(
  log: TaskPublishedLog,
  weekKey: string = getWeekKey()
): number {
  return Object.values(log).filter(iso => isDateInWeek(iso, weekKey)).length;
}

export function getWeeklyGoalTier(count: number): WeeklyGoalTier {
  if (count >= WEEKLY_NOTE_GOALS.super) return 'super';
  if (count >= WEEKLY_NOTE_GOALS.ideal) return 'ideal';
  if (count >= WEEKLY_NOTE_GOALS.minimo) return 'minimo';
  return 'bajo';
}

export function getWeeklyNoteGoalStats(
  publishedLog: TaskPublishedLog,
  weekKey: string = getWeekKey()
): WeeklyNoteGoalStats {
  const count = countTasksPublishedInWeek(publishedLog, weekKey);
  const tier = getWeeklyGoalTier(count);

  const tierLabel =
    tier === 'super'
      ? 'Super'
      : tier === 'ideal'
        ? 'Ideal'
        : tier === 'minimo'
          ? 'Bien'
          : 'En camino';

  let nextTarget: number | null = WEEKLY_NOTE_GOALS.minimo;
  let nextTargetLabel: string | null = 'bien';
  if (count >= WEEKLY_NOTE_GOALS.super) {
    nextTarget = null;
    nextTargetLabel = null;
  } else if (count >= WEEKLY_NOTE_GOALS.ideal) {
    nextTarget = WEEKLY_NOTE_GOALS.super;
    nextTargetLabel = 'super';
  } else if (count >= WEEKLY_NOTE_GOALS.minimo) {
    nextTarget = WEEKLY_NOTE_GOALS.ideal;
    nextTargetLabel = 'ideal';
  }

  return {
    count,
    weekKey,
    weekLabel: formatWeekRange(weekKey),
    tier,
    tierLabel,
    nextTarget,
    nextTargetLabel,
    progressPct: Math.min(100, Math.round((count / WEEKLY_NOTE_GOALS.super) * 100)),
    remainingToMin: Math.max(0, WEEKLY_NOTE_GOALS.minimo - count),
    remainingToIdeal: Math.max(0, WEEKLY_NOTE_GOALS.ideal - count),
    remainingToSuper: Math.max(0, WEEKLY_NOTE_GOALS.super - count)
  };
}
