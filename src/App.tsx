import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
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
import { PaymentPanel } from './components/PaymentPanel';
import { BriefingModal } from './components/MorningBriefing';
import { WordPressImageTool } from './components/WordPressImageTool';
import { ContactsPanel } from './components/ContactsPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const MainAppContent: React.FC = () => {
  const { activeSection, loading } = useApp();
  useKeyboardShortcuts();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-loader__logo">A</div>
        <div className="app-loader__spinner" />
        <p className="app-loader__text">Iniciando Portal del Columnista</p>
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
      case 'payments':
        return <PaymentPanel />;
      case 'contacts':
        return <ContactsPanel />;
      case 'wordpress-images':
        return <WordPressImageTool />;
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
      <BriefingModal />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

const AppGate: React.FC = () => {
  const { username, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="app-loader">
        <div className="app-loader__logo">A</div>
        <div className="app-loader__spinner" />
        <p className="app-loader__text">Verificando sesión</p>
      </div>
    );
  }

  if (!username) {
    return <Login />;
  }

  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
