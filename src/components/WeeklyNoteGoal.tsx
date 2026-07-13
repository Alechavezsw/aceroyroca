import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import {
  WEEKLY_NOTE_GOALS,
  type WeeklyNoteGoalStats
} from '../utils/weeklyNoteGoals';

interface WeeklyNoteGoalProps {
  stats: WeeklyNoteGoalStats;
  compact?: boolean;
}

export const WeeklyNoteGoal: React.FC<WeeklyNoteGoalProps> = ({ stats, compact = false }) => {
  const { minimo, ideal, super: superGoal } = WEEKLY_NOTE_GOALS;
  const markerMin = (minimo / superGoal) * 100;
  const markerIdeal = (ideal / superGoal) * 100;

  const message =
    stats.tier === 'super'
      ? `Semana super: ${stats.count} notas. Objetivo máximo alcanzado.`
      : stats.tier === 'ideal'
        ? `Ideal alcanzado. Faltan ${stats.remainingToSuper} para super (${superGoal}).`
        : stats.tier === 'minimo'
          ? `Semana bien. Faltan ${stats.remainingToIdeal} para ideal (${ideal}).`
          : `Faltan ${stats.remainingToMin} para una semana bien (${minimo}).`;

  return (
    <section className={`weekly-goal glass-panel ${compact ? 'weekly-goal--compact' : ''} weekly-goal--${stats.tier}`}>
      <div className="weekly-goal__header">
        <div className="weekly-goal__title-row">
          <Target size={compact ? 16 : 18} className="text-accent-gold" />
          <div>
            <h3 className="weekly-goal__title">Objetivo semanal de notas</h3>
            {!compact && (
              <p className="weekly-goal__week">{stats.weekLabel}</p>
            )}
          </div>
        </div>
        <div className="weekly-goal__count-wrap">
          <span className="weekly-goal__count">{stats.count}</span>
          <span className="weekly-goal__of">/ {superGoal}</span>
          <span className={`weekly-goal__badge weekly-goal__badge--${stats.tier}`}>
            {stats.tierLabel}
          </span>
        </div>
      </div>

      <div className="weekly-goal__bar" role="progressbar" aria-valuenow={stats.count} aria-valuemin={0} aria-valuemax={superGoal}>
        <div className="weekly-goal__fill" style={{ width: `${stats.progressPct}%` }} />
        <span className="weekly-goal__marker" style={{ left: `${markerMin}%` }} title={`Bien ${minimo}`} />
        <span className="weekly-goal__marker weekly-goal__marker--ideal" style={{ left: `${markerIdeal}%` }} title={`Ideal ${ideal}`} />
      </div>

      <div className="weekly-goal__tiers">
        <span className={stats.count >= minimo ? 'is-done' : ''}>
          Bien {minimo}
        </span>
        <span className={stats.count >= ideal ? 'is-done' : ''}>
          Ideal {ideal}
        </span>
        <span className={stats.count >= superGoal ? 'is-done' : ''}>
          Super {superGoal}
        </span>
      </div>

      <p className="weekly-goal__msg">
        <TrendingUp size={12} />
        {message}
        {stats.publishedCount > 0 && (
          <span className="weekly-goal__pub"> · {stats.publishedCount} publicadas</span>
        )}
      </p>
    </section>
  );
};
