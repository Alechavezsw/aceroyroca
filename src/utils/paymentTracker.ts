export type ProposalType = 'mine' | 'newspaper';

export interface PaymentEntry {
  id: string;
  noteId: string | null;
  title: string;
  number: number;
  proposalType: ProposalType;
  approved: boolean;
  published: boolean;
  approvedAt: string;
  weekKey: string;
  paid: boolean;
  paidAt?: string;
}

export const PROPOSAL_RATES: Record<ProposalType, number> = {
  mine: 20000,
  newspaper: 30000
};

export const PROPOSAL_LABELS: Record<ProposalType, string> = {
  mine: 'Propuesta por mí',
  newspaper: 'Propuesta por el diario'
};

const STORAGE_KEY = 'ar_payment_entries';

/** Semana editorial: sábado 00:00 → viernes 23:59 */
export function getWeekStartSaturday(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const daysSinceSaturday = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d;
}

export function getWeekKey(date: Date = new Date()): string {
  return getWeekStartSaturday(date).toISOString().slice(0, 10);
}

export function getWeekEndFriday(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatWeekRange(weekKey: string): string {
  const start = new Date(`${weekKey}T12:00:00`);
  const end = getWeekEndFriday(start);
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${fmt(start)} → ${fmt(end)}`;
}

export function getEntryAmount(type: ProposalType): number {
  return PROPOSAL_RATES[type];
}

export function formatArs(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

export function loadPaymentEntries(): PaymentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PaymentEntry[];
  } catch {
    /* fallthrough */
  }
  return [];
}

export function savePaymentEntries(entries: PaymentEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function nextEntryNumber(entries: PaymentEntry[], weekKey: string): number {
  const weekNums = entries.filter(e => e.weekKey === weekKey).map(e => e.number);
  return weekNums.length ? Math.max(...weekNums) + 1 : 1;
}

export function sumWeekEntries(
  entries: PaymentEntry[],
  weekKey: string,
  opts: { unpaidOnly?: boolean; approvedOnly?: boolean } = {}
): number {
  const { unpaidOnly = true, approvedOnly = true } = opts;
  return entries
    .filter(e => {
      if (e.weekKey !== weekKey) return false;
      if (approvedOnly && !e.approved) return false;
      if (unpaidOnly && e.paid) return false;
      return true;
    })
    .reduce((sum, e) => sum + getEntryAmount(e.proposalType), 0);
}

export function groupEntriesByWeek(entries: PaymentEntry[]): Map<string, PaymentEntry[]> {
  const map = new Map<string, PaymentEntry[]>();
  for (const e of entries) {
    const list = map.get(e.weekKey) || [];
    list.push(e);
    map.set(e.weekKey, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.number - b.number);
  }
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

export function createPaymentEntry(
  entries: PaymentEntry[],
  data: {
    title: string;
    noteId?: string | null;
    proposalType?: ProposalType;
    approved?: boolean;
    published?: boolean;
    approvedAt?: Date;
  }
): PaymentEntry {
  const approvedAt = data.approvedAt ?? new Date();
  const weekKey = getWeekKey(approvedAt);
  return {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    noteId: data.noteId ?? null,
    title: data.title,
    number: nextEntryNumber(entries, weekKey),
    proposalType: data.proposalType ?? 'mine',
    approved: data.approved ?? true,
    published: data.published ?? false,
    approvedAt: approvedAt.toISOString(),
    weekKey,
    paid: false
  };
}
