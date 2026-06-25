import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { config, updateConfig } = useApp();
  const isLight = config.theme === 'light';

  return (
    <button
      type="button"
      onClick={() => updateConfig({ theme: isLight ? 'dark' : 'light' })}
      className="theme-toggle"
      title={isLight ? 'Modo oscuro' : 'Modo claro'}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};
