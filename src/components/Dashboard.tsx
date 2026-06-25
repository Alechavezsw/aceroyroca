import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MorningBriefing } from './MorningBriefing';
import { DeadlineBanner } from './DeadlineBanner';
import { SkeletonNews } from './Skeleton';

import { 
  FileText, 
  TrendingUp, 
  CheckSquare, 
  Clock, 
  RefreshCw, 
  ArrowRight, 
  MessageSquare,
  Newspaper
} from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet: string;
  category: string;
}

export const Dashboard: React.FC = () => {
  const { notes, tasks, events, config, setActiveSection, setActiveNoteId } = useApp();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [commodities, setCommodities] = useState<Array<{ symbol: string; name: string; price: number; unit: string; change: number }>>([]);

  const fetchCommodities = async () => {
    try {
      const res = await fetch('/api/commodities');
      const data = await res.json();
      if (data.items) setCommodities(data.items);
    } catch { /* fallback static in UI */ }
  };

  useEffect(() => { fetchCommodities(); }, []);

  // Cargar noticias desde el backend envuelto
  const fetchNews = async () => {
    setLoadingNews(true);
    setNewsError(false);
    try {
      const feeds = encodeURIComponent(config.rssFeeds.join(','));
      const res = await fetch(`/api/news?feeds=${feeds}`);
      if (!res.ok) throw new Error('Error de red');
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.error('Error cargando noticias:', e);
      setNewsError(true);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [config.rssFeeds]);

  // Calcular métricas
  const totalNotes = notes.length;
  const totalWords = notes.reduce((sum, n) => sum + (n.words_count || 0), 0);
  
  const pendingTasks = tasks.filter(t => t.status !== 'published').length;

  
  // Calcular próximo vencimiento de entrega de columna
  const deliveryEvents = events
    .filter(e => e.type === 'delivery' && new Date(e.start_date).getTime() > Date.now())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    
  const nextDeadlineText = deliveryEvents.length > 0 
    ? new Date(deliveryEvents[0].start_date).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin entregas próximas';

  const handleNoteClick = (noteId: string) => {
    setActiveNoteId(noteId);
    setActiveSection('editor');
  };

  // Enviar noticia a Gemini para discusión
  const handleDiscussWithAI = (item: NewsItem) => {
    // Guardamos la noticia seleccionada para que GeminiAgent la tome al cargar
    localStorage.setItem('ar_discuss_news', JSON.stringify(item));
    setActiveSection('agent');
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <DeadlineBanner />

      <div className="ticker-container no-print">
        {(commodities.length ? commodities : [
          { symbol: 'COBRE', name: 'Cobre (LME)', price: 4.52, unit: 'USD/lb', change: -1.2 },
          { symbol: 'LITIO', name: 'Litio', price: 14200, unit: 'USD/t', change: 1.85 },
          { symbol: 'ORO', name: 'Oro', price: 2340.5, unit: 'USD/oz', change: 0.45 },
          { symbol: 'PLATA', name: 'Plata', price: 29.15, unit: 'USD/oz', change: -0.3 }
        ]).map(c => (
          <div key={c.symbol} className="ticker-card">
            <span className="font-bold text-lime">{c.name}</span>
            <span className="ticker-price">
              {c.unit.startsWith('USD') ? '$' : ''}{c.price.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {c.unit}
            </span>
            <span className={c.change >= 0 ? 'ticker-change--up' : 'ticker-change--down'}>
              {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h2 className="dashboard-hero__title">
            <span className="text-gradient-lime">Hola, Carlos</span> 👋
          </h2>
          <p className="dashboard-hero__subtitle">
            Esto es lo que está pasando hoy en tu espacio editorial de Acero & Roca.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          <MorningBriefing />
          <button 
            onClick={() => handleNoteClick(notes[0]?.id || '')}
            className="glass-button active text-sm"
            disabled={notes.length === 0}
          >
            Último Borrador <ArrowRight size={16} />
          </button>
        </div>
      </header>


      {/* Grid de Métricas */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel metric-card metric-card--lime">
          <div className="metric-card__icon">
            <FileText size={24} />
          </div>
          <div>
            <span className="metric-card__label">Borradores creados</span>
            <span className="metric-card__value">{totalNotes}</span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--steel">
          <div className="metric-card__icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="metric-card__label">Palabras redactadas</span>
            <span className="metric-card__value">{totalWords.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--emerald">
          <div className="metric-card__icon">
            <CheckSquare size={24} />
          </div>
          <div>
            <span className="metric-card__label">Tareas pendientes</span>
            <span className="metric-card__value">{pendingTasks} / {tasks.length}</span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--red">
          <div className="metric-card__icon">
            <Clock size={24} />
          </div>
          <div>
            <span className="metric-card__label">Próxima entrega</span>
            <span className="metric-card__value metric-card__value--sm">{nextDeadlineText}</span>
          </div>
        </div>
      </section>

      {/* Contenido Principal (Borradores y Tareas) */}
      <div className="dashboard-split">
        {/* Borradores Recientes */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="panel-header">
            <h3 className="panel-header__title">
              <FileText size={20} />
              Borradores de Columnas
            </h3>
            <button onClick={() => setActiveSection('editor')} className="text-xs text-lime hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div className="dashboard-scroll-list">
            {notes.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">No hay borradores creados. ¡Crea tu primer artículo!</p>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  className="list-row"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white leading-snug">{note.title}</h4>
                    <span className="text-xs text-text-muted mt-1 inline-block">
                      Actualizado: {new Date(note.updated_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      {note.words_count} palabras
                    </span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                      note.status === 'published' 
                        ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20' 
                        : note.status === 'review'
                        ? 'bg-accent-steel/15 text-accent-steel border border-accent-steel/20'
                        : 'bg-lime/10 text-lime border border-amber-600/20'
                    }`}>
                      {note.status === 'published' ? 'Publicado' : note.status === 'review' ? 'Revisión' : 'Borrador'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tareas Editorial */}
        <div className="glass-panel p-6 flex flex-col">
          <div className="panel-header">
            <h3 className="panel-header__title">
              <CheckSquare size={20} />
              Tareas Urgentes
            </h3>
            <button onClick={() => setActiveSection('tasks')} className="text-xs text-lime hover:underline flex items-center gap-1">
              Tablero <ArrowRight size={12} />
            </button>
          </div>
          <div className="dashboard-scroll-list">
            {tasks.filter(t => t.status !== 'published').length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">No hay tareas pendientes. ¡Buen trabajo!</p>
            ) : (
              tasks
                .filter(t => t.status !== 'published')
                .slice(0, 5)
                .map(task => (
                  <div 
                    key={task.id}
                    className="task-card"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="task-card__title">{task.title}</h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        task.priority === 'high' 
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                          : task.priority === 'medium'
                          ? 'bg-lime/15 text-lime border border-lime/20'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                    {task.description && <p className="task-card__desc">{task.description}</p>}
                    <div className="task-card__meta">
                      <span>Etapa: {task.status}</span>
                      {task.due_date && <span>Plazo: {task.due_date}</span>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Agregador de Noticias del Sector (Se alimenta de /api/news) */}
      <section className="glass-panel p-6 flex flex-col">
        <div className="panel-header">
          <h3 className="panel-header__title">
            <Newspaper size={22} />
            Actualidad Minera Nacional e Internacional
          </h3>
          <button 
            onClick={fetchNews}
            className="glass-button text-xs py-1.5 px-3"
            disabled={loadingNews}
          >
            <RefreshCw size={12} className={loadingNews ? 'animate-spin' : ''} />
            Actualizar Noticias
          </button>
        </div>

        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonNews key={i} />)}
          </div>
        ) : newsError ? (
          <div className="text-center py-8">
            <p className="text-sm text-accent-red mb-2">Error al cargar feeds de noticias externas.</p>
            <button onClick={fetchNews} className="glass-button text-xs">Reintentar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, idx) => {
              const categoryClass = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
              return (
                <div 
                  key={idx}
                  className="glass-panel news-card-item border-white/5 bg-white/[0.01] group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className={`news-badge ${categoryClass}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(item.pubDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-bold text-white hover:text-lime transition-colors line-clamp-2 leading-snug group-hover:underline"
                    >
                      {item.title}
                    </a>
                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                      {item.contentSnippet}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[10px]">
                    <span className="font-semibold text-text-muted truncate max-w-[120px]">
                      Fuente: {item.source}
                    </span>
                    <button 
                      onClick={() => handleDiscussWithAI(item)}
                      className="text-lime font-semibold hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare size={12} /> Analizar con Agente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
