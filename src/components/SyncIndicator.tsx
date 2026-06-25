import React from 'react';
import { useApp } from '../context/AppContext';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
  const { syncStatus, isDbConnected } = useApp();

  const icon = syncStatus === 'saving' ? <Loader2 size={14} className="animate-spin" />
    : syncStatus === 'saved' ? <Check size={14} />
    : syncStatus === 'error' ? <CloudOff size={14} />
    : isDbConnected ? <Cloud size={14} /> : <CloudOff size={14} />;

  const label = syncStatus === 'saving' ? 'Guardando...'
    : syncStatus === 'saved' ? 'Guardado'
    : syncStatus === 'error' ? 'Error al guardar'
    : isDbConnected ? 'Sincronizado' : 'Modo local';

  return (
    <div className={`sync-indicator sync-indicator--${syncStatus}`} title={label}>
      {icon}
      <span className="sync-indicator__text">{label}</span>
    </div>
  );
};
