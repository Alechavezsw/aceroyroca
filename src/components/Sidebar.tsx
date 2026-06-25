import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  KanbanSquare, 
  Calendar, 
  Settings, 
  PenSquare,
  Menu,
  X,
  GraduationCap,
  MapPin,
  BookMarked
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { SyncIndicator } from './SyncIndicator';

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, createNote, isDbConnected } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor', label: 'Redacción', icon: FileText },
    { id: 'agent', label: 'Agente IA', icon: Cpu },
    { id: 'course', label: 'Curso de Minería', icon: GraduationCap },
    { id: 'projects', label: 'Mapa Proyectos', icon: MapPin },
    { id: 'glossary', label: 'Glosario', icon: BookMarked },
    { id: 'tasks', label: 'Tablero Kanban', icon: KanbanSquare },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const handleQuickNote = async () => {
    const title = `Nueva Columna - ${new Date().toLocaleDateString('es-AR')}`;
    await createNote(title, '# ' + title + '\n\nEscribe tu contenido aquí...');
    setActiveSection('editor');
    setIsOpen(false);
  };

  const handleNav = (section: string) => {
    setActiveSection(section);
    setIsOpen(false);
  };

  return (
    <>
      {/* HEADER MÓVIL (Solo visible en pantallas pequeñas) */}
      <header className="mobile-header no-print">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 text-white hover:text-lime rounded-lg bg-white/5 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center font-bold text-black text-xs">
              A
            </div>
            <span className="font-display font-bold text-sm text-white tracking-tight leading-none">ACERO & ROCA</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: isDbConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }} 
          />
          <span className="text-[10px] text-text-secondary uppercase font-semibold">
            {isDbConnected ? 'Cloud' : 'Local'}
          </span>
        </div>
      </header>

      {/* BACKDROP PARA MOVIL */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="sidebar-backdrop no-print"
        />
      )}

      {/* BARRA LATERAL (Desktop y Cajón Móvil) */}
      <aside className={`sidebar bg-secondary border-r border-border-color flex flex-col justify-between no-print ${
        isOpen ? 'open' : ''
      }`}>
        {/* Header / Logo */}
        <div className="p-7 pb-6">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="brand-logo">A</div>
              <div>
                <h1 className="brand-title">ACERO & ROCA</h1>
                <span className="brand-subtitle">Portal del Columnista</span>
              </div>
            </div>

            {/* Cerrar móvil */}
            <button 
              onClick={() => setIsOpen(false)}
              className="mobile-close-btn p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action */}
          <button 
            onClick={handleQuickNote}
            className="w-full glass-button active py-3.5 justify-center mb-8"
          >
            <PenSquare size={18} />
            Nueva Columna
          </button>

          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={18} className={`sidebar-nav-icon ${isActive ? '' : 'text-text-muted'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Database Indicator */}
        <div className="sidebar-footer flex items-center justify-between">
          <SyncIndicator />
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
};
