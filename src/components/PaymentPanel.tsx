import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Banknote,
  CalendarRange,
  Hash
} from 'lucide-react';
import {
  formatWeekRange,
  formatArs,
  getEntryAmount,
  PROPOSAL_LABELS,
  type ProposalType,
  type PaymentEntry
} from '../utils/paymentTracker';
import { WeeklyNoteGoal } from './WeeklyNoteGoal';
import { getWeeklyNoteGoalStats } from '../utils/weeklyNoteGoals';

export const PaymentPanel: React.FC = () => {
  const {
    paymentEntries,
    notes,
    addPaymentEntry,
    updatePaymentEntry,
    deletePaymentEntry,
    markWeekPaid,
    getCurrentWeekKey
  } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekKey());
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProposalType>('mine');
  const [linkNoteId, setLinkNoteId] = useState('');

  const currentWeekKey = getCurrentWeekKey();
  const weekEntries = useMemo(
    () =>
      paymentEntries
        .filter(e => e.weekKey === selectedWeek)
        .sort((a, b) => a.number - b.number),
    [paymentEntries, selectedWeek]
  );

  const weekTotal = weekEntries
    .filter(e => e.approved && !e.paid)
    .reduce((s, e) => s + getEntryAmount(e.proposalType), 0);

  const weekPaid = weekEntries.length > 0 && weekEntries.every(e => !e.approved || e.paid);
  const availableWeeks = useMemo(() => {
    const keys = new Set(paymentEntries.map(e => e.weekKey));
    keys.add(currentWeekKey);
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [paymentEntries, currentWeekKey]);

  const weeklyGoal = useMemo(
    () => getWeeklyNoteGoalStats(notes, paymentEntries, selectedWeek),
    [notes, paymentEntries, selectedWeek]
  );

  const handleAdd = () => {
    const title =
      newTitle.trim() ||
      notes.find(n => n.id === linkNoteId)?.title ||
      'Nota sin título';
    addPaymentEntry({
      title,
      noteId: linkNoteId || null,
      proposalType: newType,
      approved: true,
      published: false
    });
    setNewTitle('');
    setLinkNoteId('');
  };

  const toggleCheck = (entry: PaymentEntry, field: 'approved' | 'published') => {
    updatePaymentEntry(entry.id, { [field]: !entry[field] });
  };

  return (
    <div className="main-content main-content--scroll payment-panel animate-fade-in">
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h2 className="dashboard-hero__title flex items-center gap-3">
            <Wallet className="text-accent-gold" size={28} />
            Pagos <span className="text-gradient-lime">editoriales</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Notas aprobadas numeradas · Bolsa semanal sábado a sábado · $20.000 propias · $30.000 diario
          </p>
        </div>
      </header>

      <WeeklyNoteGoal stats={weeklyGoal} compact />

      <div className="payment-week-bar glass-panel">
        <div className="payment-week-bar__select">
          <CalendarRange size={16} className="text-accent-gold" />
          <label className="sr-only">Semana</label>
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            className="glass-input text-sm"
          >
            {availableWeeks.map(wk => (
              <option key={wk} value={wk}>
                {formatWeekRange(wk)}{wk === currentWeekKey ? ' (actual)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="payment-week-bar__total">
          <span className="payment-week-bar__label">Bolsa semanal</span>
          <strong className="payment-week-bar__amount">{formatArs(weekTotal)}</strong>
          {weekPaid && (
            <span className="payment-week-bar__paid-badge">
              <CheckCircle2 size={14} /> Pagado
            </span>
          )}
        </div>
        {!weekPaid && weekEntries.some(e => e.approved) && (
          <button
            type="button"
            onClick={() => markWeekPaid(selectedWeek)}
            className="glass-button active payment-week-bar__pay-btn"
          >
            <Banknote size={16} /> Marcar semana como pagada
          </button>
        )}
      </div>

      <div className="glass-panel p-5 payment-add-form">
        <h3 className="payment-section-title">Agregar nota aprobada</h3>
        <div className="payment-add-form__grid">
          <input
            type="text"
            className="glass-input"
            placeholder="Título de la nota (opcional si elegís borrador)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <select
            className="glass-input text-sm"
            value={linkNoteId}
            onChange={e => setLinkNoteId(e.target.value)}
          >
            <option value="">Vincular borrador…</option>
            {notes.map(n => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
          <select
            className="glass-input text-sm"
            value={newType}
            onChange={e => setNewType(e.target.value as ProposalType)}
          >
            <option value="mine">Propuesta por mí — {formatArs(20000)}</option>
            <option value="newspaper">Propuesta por el diario — {formatArs(30000)}</option>
          </select>
          <button type="button" onClick={handleAdd} className="glass-button active justify-center">
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      <div className="glass-panel payment-list-panel">
        <div className="payment-list-header">
          <span className="payment-list-header__col payment-list-header__col--num">
            <Hash size={12} /> Nº
          </span>
          <span className="payment-list-header__col payment-list-header__col--title">Nota</span>
          <span className="payment-list-header__col">Tipo</span>
          <span className="payment-list-header__col">Aprobada</span>
          <span className="payment-list-header__col">Publicada</span>
          <span className="payment-list-header__col payment-list-header__col--amount">Monto</span>
          <span className="payment-list-header__col payment-list-header__col--actions" />
        </div>

        {weekEntries.length === 0 ? (
          <p className="payment-list-empty">No hay notas aprobadas en esta semana.</p>
        ) : (
          weekEntries.map(entry => (
            <div
              key={entry.id}
              className={`payment-row ${entry.paid ? 'payment-row--paid' : ''}`}
            >
              <span className="payment-row__num">{entry.number}</span>
              <div className="payment-row__title">
                <span>{entry.title}</span>
                {entry.paid && (
                  <span className="payment-row__paid-tag">Pagado</span>
                )}
              </div>
              <select
                className="glass-input text-xs payment-row__type"
                value={entry.proposalType}
                disabled={entry.paid}
                onChange={e =>
                  updatePaymentEntry(entry.id, {
                    proposalType: e.target.value as ProposalType
                  })
                }
              >
                <option value="mine">{PROPOSAL_LABELS.mine}</option>
                <option value="newspaper">{PROPOSAL_LABELS.newspaper}</option>
              </select>
              <button
                type="button"
                className={`payment-check ${entry.approved ? 'is-on' : ''}`}
                disabled={entry.paid}
                onClick={() => toggleCheck(entry, 'approved')}
                title="Aprobada"
              >
                {entry.approved ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>Aprobada</span>
              </button>
              <button
                type="button"
                className={`payment-check ${entry.published ? 'is-on' : ''}`}
                disabled={entry.paid}
                onClick={() => toggleCheck(entry, 'published')}
                title="Publicada"
              >
                {entry.published ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>Publicada</span>
              </button>
              <span className="payment-row__amount">
                {formatArs(getEntryAmount(entry.proposalType))}
              </span>
              <button
                type="button"
                className="payment-row__delete"
                disabled={entry.paid}
                onClick={() => deletePaymentEntry(entry.id)}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="payment-rates-hint glass-panel p-4">
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-secondary">Tarifas:</strong> propuesta propia {formatArs(20000)} ·
          propuesta del diario {formatArs(30000)}. La bolsa suma solo notas marcadas como{' '}
          <em>aprobadas</em> y pendientes de cobro. Al cobrar, usá <em>Marcar semana como pagada</em>.
        </p>
      </div>
    </div>
  );
};
