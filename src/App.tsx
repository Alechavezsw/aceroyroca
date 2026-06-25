import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { GeminiAgent } from './components/GeminiAgent';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { Settings } from './components/Settings';
import { MiningCourse } from './components/MiningCourse';
import { ProjectsPanel } from './components/ProjectsPanel';
import { GlossaryPanel } from './components/GlossaryPanel';
import { CommandSearch } from './components/CommandSearch';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const MainAppContent: React.FC = () => {
  const { activeSection, loading } = useApp();
  useKeyboardShortcuts();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-[#0A0D10] gap-4">
        <div className="w-10 h-10 border-t-2 border-amber-500 border-solid rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400">Iniciando Portal del Columnista...</p>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'editor':
        return <Editor />;
      case 'agent':
        return <GeminiAgent />;
      case 'course':
        return <MiningCourse />;
      case 'projects':
        return <ProjectsPanel />;
      case 'glossary':
        return <GlossaryPanel />;
      case 'tasks':
        return <KanbanBoard />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main">
        {renderSection()}
      </div>
      <CommandSearch />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
