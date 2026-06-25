import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useKeyboardShortcuts() {
  const { setActiveSection, activeSection } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ar:save-note'));
      }
      if (mod && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ar:open-search'));
      }
      if (mod && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ar:briefing'));
      }
      if (mod && e.key === '1') { e.preventDefault(); setActiveSection('dashboard'); }
      if (mod && e.key === '2') { e.preventDefault(); setActiveSection('editor'); }
      if (mod && e.key === '3') { e.preventDefault(); setActiveSection('agent'); }
      if (mod && e.key === '4') { e.preventDefault(); setActiveSection('course'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveSection, activeSection]);
}
