import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

export const DeadlineBanner: React.FC = () => {
  const { events, setActiveSection } = useApp();

  const upcoming = events
    .filter(e => e.type === 'delivery' && new Date(e.start_date).getTime() > Date.now())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

  if (!upcoming) return null;

  const hoursLeft = (new Date(upcoming.start_date).getTime() - Date.now()) / 3600000;
  if (hoursLeft > 72) return null;

  const urgent = hoursLeft <= 48;

  return (
    <div className={`deadline-banner ${urgent ? 'deadline-banner--urgent' : ''}`}>
      <AlertTriangle size={18} />
      <div className="flex-1">
        <strong>{urgent ? 'Entrega próxima' : 'Recordatorio editorial'}</strong>
        <p className="text-sm opacity-90">
          {upcoming.title} — {new Date(upcoming.start_date).toLocaleString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
          {urgent && ` (en ${Math.max(1, Math.round(hoursLeft))} h)`}
        </p>
      </div>
      <button type="button" className="glass-button text-xs" onClick={() => setActiveSection('calendar')}>
        Ver agenda
      </button>
    </div>
  );
};
