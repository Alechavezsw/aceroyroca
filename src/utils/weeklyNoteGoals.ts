import { getWeekKey, getWeekStartSaturday, getWeekEndFriday, formatWeekRange } from './paymentTracker';
import type { Note } from '../context/AppContext';
import type { PaymentEntry } from './paymentTracker';

export const WEEKLY_NOTE_GOALS = {
  minimo: 7,
  ideal: 10,
  super: 14
} as const;

export type WeeklyGoalTier = 'bajo' | 'minimo' | 'ideal' | 'super';

export interface WeeklyNoteGoalStats {
  count: number;
  publishedCount: number;
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

export function countNotesCreatedInWeek(notes: Note[], weekKey: string = getWeekKey()): number {
  return notes.filter(n => isDateInWeek(n.created_at, weekKey)).length;
}

export function countNotesPublishedInWeek(
  notes: Note[],
  paymentEntries: PaymentEntry[],
  weekKey: string = getWeekKey()
): number {
  const fromPayments = paymentEntries.filter(e => e.weekKey === weekKey && e.published).length;
  if (fromPayments > 0) return fromPayments;
  return notes.filter(n => n.status === 'published' && isDateInWeek(n.updated_at, weekKey)).length;
}

export function getWeeklyGoalTier(count: number): WeeklyGoalTier {
  if (count >= WEEKLY_NOTE_GOALS.super) return 'super';
  if (count >= WEEKLY_NOTE_GOALS.ideal) return 'ideal';
  if (count >= WEEKLY_NOTE_GOALS.minimo) return 'minimo';
  return 'bajo';
}

export function getWeeklyNoteGoalStats(
  notes: Note[],
  paymentEntries: PaymentEntry[] = [],
  weekKey: string = getWeekKey()
): WeeklyNoteGoalStats {
  const count = countNotesCreatedInWeek(notes, weekKey);
  const publishedCount = countNotesPublishedInWeek(notes, paymentEntries, weekKey);
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
    publishedCount,
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
