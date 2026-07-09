import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BriefingButton } from './MorningBriefing';
import { matchNewsToProjects, getWatchlistProjectNames } from '../utils/projectWatchlist';
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
  Newspaper,
  PenLine,
  Star,
  MapPin,
  Search,
  Sparkles
} from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet: string;
  category: string;
  origin?: 'rss' | 'gemini';
}

interface NewsMeta {
  total: number;
  rss: number;
  gemini: number;
  geminiEnabled: boolean;
  query: string | null;
}

export const Dashboard: React.FC = () => {
  const { notes, tasks, events, config, setActiveSection, setActiveNoteId, createDraftFromSource, watchlist } = useApp();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [newsQuery, setNewsQuery] = useState('');
  const [newsMeta, setNewsMeta] = useState<NewsMeta | null>(null);
  const [watchlistFilter, setWatchlistFilter] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<Array<{ symbol: string; name: string; price: number; unit: string; change: number }>>([]);

  const fetchCommodities = async () => {
    try {
      const res = await fetch('/api/commodities');
      const data = await res.json();
      if (data.items) setCommodities(data.items);
    } catch (e) { console.warn('Error fetching commodities:', e); }
  };

  useEffect(() => { fetchCommodities(); }, []);

  // Cargar noticias desde el backend envuelto
  const fetchNews = async (query?: string) => {
    setLoadingNews(true);
    setNewsError(false);
    try {
      const params = new URLSearchParams();
      params.set('feeds', config.rssFeeds.join(','));
      const q = (query ?? newsQuery).trim();
      if (q) params.set('q', q);
      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error('Error de red');
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setNews(items);
      setNewsMeta(Array.isArray(data) ? null : data.meta || null);
    } catch (e) {
      console.error('Error cargando noticias:', e);
      setNewsError(true);
      setNewsMeta(null);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleNewsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(newsQuery);
  };

  const clearNewsSearch = () => {
    setNewsQuery('');
    fetchNews('');
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

  const handleCreateDraft = async (item: NewsItem) => {
    await createDraftFromSource({
      title: item.title,
      snippet: item.contentSnippet,
      source: item.source,
      link: item.link,
      pubDate: item.pubDate
    });
  };

  const todayFormatted = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const commodityItems = commodities.length ? commodities : [
    { symbol: 'COBRE', name: 'Cobre (LME)', price: 4.52, unit: 'USD/lb', change: -1.2 },
    { symbol: 'LITIO', name: 'Litio', price: 14200, unit: 'USD/t', change: 1.85 },
    { symbol: 'ORO', name: 'Oro', price: 2340.5, unit: 'USD/oz', change: 0.45 },
    { symbol: 'PLATA', name: 'Plata', price: 29.15, unit: 'USD/oz', change: -0.3 }
  ];

  const getCategoryClass = (category: string) => {
    const normalized = category.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.includes('internacional')) return 'internacional';
    if (normalized.includes('nacional')) return 'nacional';
    if (normalized.includes('tecnolog')) return 'tecnologia';
    if (normalized.includes('mercado')) return 'mercados';
    return 'default';
  };

  const newsWithWatchlist = news.map(item => {
    const text = `${item.title} ${item.contentSnippet}`;
    const matches = matchNewsToProjects(text, watchlist);
    return { ...item, watchlistMatches: matches };
  });

  const watchlistNews = newsWithWatchlist.filter(n => n.watchlistMatches.length > 0);
  const sortedNews = [...newsWithWatchlist].sort((a, b) => {
    if (a.watchlistMatches.length && !b.watchlistMatches.length) return -1;
    if (!a.watchlistMatches.length && b.watchlistMatches.length) return 1;
    return 0;
  });

  const filteredNews = watchlistFilter
    ? sortedNews.filter(n => n.watchlistMatches.some(m => m.projectId === watchlistFilter))
    : sortedNews;

  const renderNewsCard = (item: NewsItem & { watchlistMatches: { projectId: string; projectName: string }[] }, idx: number) => {
    const catClass = getCategoryClass(item.category);
    return (
      <div key={idx} className={`glass-panel news-card-item group ${item.watchlistMatches.length ? 'news-card-item--watchlist' : ''}`}>
        <div className={`news-card-item__accent news-card-item__accent--${catClass}`} />
        <div className="news-card-item__body">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`news-badge ${catClass}`}>{item.category}</span>
              {item.origin === 'gemini' && (
                <span className="news-badge news-badge--gemini">
                  <Sparkles size={9} /> Gemini Search
                </span>
              )}
              {item.watchlistMatches.map(m => (
                <span key={m.projectId} className="watchlist-news-badge">
                  <Star size={9} /> {m.projectName}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-text-muted shrink-0">
              {new Date(item.pubDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-white hover:text-accent-gold transition-colors line-clamp-2 leading-snug">
            {item.title}
          </a>
          <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">{item.contentSnippet}</p>
        </div>
        <div className="news-card-item__footer">
          <span className="font-medium text-text-muted truncate max-w-[100px]">{item.source}</span>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => handleCreateDraft(item)} className="text-accent-steel font-semibold hover:text-white flex items-center gap-1 transition-colors text-[11px]">
              <PenLine size={12} /> Borrador
            </button>
            <button type="button" onClick={() => handleDiscussWithAI(item)} className="text-accent-gold font-semibold hover:text-white flex items-center gap-1 transition-colors text-[11px]">
              <MessageSquare size={12} /> Analizar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <DeadlineBanner />

      <div className="ticker-wrap no-print stagger-1">
        <div className="ticker-container">
          {[...commodityItems, ...commodityItems].map((c, i) => (
            <div key={`${c.symbol}-${i}`} className="ticker-card">
              <span className="ticker-card__symbol">{c.symbol}</span>
              <span className="font-semibold text-text-secondary">{c.name}</span>
              <span className="ticker-price">
                {c.unit.startsWith('USD') ? '$' : ''}{c.price.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                <span className="text-text-muted font-normal ml-1">{c.unit}</span>
              </span>
              <span className={c.change >= 0 ? 'ticker-change--up' : 'ticker-change--down'}>
                {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <header className="dashboard-hero stagger-2">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">{todayFormatted}</span>
          <h2 className="dashboard-hero__title">
            Hola, <span className="dashboard-hero__title-accent">{config.authorName.split(' ')[0]}</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Tu espacio editorial minero — borradores, tareas y actualidad del sector en un solo lugar.
          </p>
        </div>
        <div className="dashboard-hero__actions">
          <BriefingButton />
          <button 
            onClick={() => handleNoteClick(notes[0]?.id || '')}
            className="glass-button active text-sm"
            disabled={notes.length === 0}
          >
            Último Borrador <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <section className="metrics-grid stagger-3">
        <div className="glass-panel metric-card metric-card--lime">
          <div className="metric-card__top">
            <div className="metric-card__icon">
              <FileText size={22} />
            </div>
          </div>
          <div>
            <span className="metric-card__label">Borradores creados</span>
            <span className="metric-card__value">{totalNotes}</span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--steel">
          <div className="metric-card__top">
            <div className="metric-card__icon">
              <TrendingUp size={22} />
            </div>
          </div>
          <div>
            <span className="metric-card__label">Palabras redactadas</span>
            <span className="metric-card__value">{totalWords.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--emerald">
          <div className="metric-card__top">
            <div className="metric-card__icon">
              <CheckSquare size={22} />
            </div>
          </div>
          <div>
            <span className="metric-card__label">Tareas pendientes</span>
            <span className="metric-card__value">{pendingTasks}<span className="text-text-muted text-lg font-medium"> / {tasks.length}</span></span>
          </div>
        </div>

        <div className="glass-panel metric-card metric-card--red">
          <div className="metric-card__top">
            <div className="metric-card__icon">
              <Clock size={22} />
            </div>
          </div>
          <div>
            <span className="metric-card__label">Próxima entrega</span>
            <span className="metric-card__value metric-card__value--sm">{nextDeadlineText}</span>
          </div>
        </div>
      </section>

      <div className="dashboard-split stagger-4">
        <div className="glass-panel panel-section flex flex-col">
          <div className="panel-header">
            <h3 className="panel-header__title">
              <FileText size={20} />
              Borradores de Columnas
            </h3>
            <button onClick={() => setActiveSection('editor')} className="text-xs text-accent-gold hover:underline flex items-center gap-1">
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
                        : 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                    }`}>
                      {note.status === 'published' ? 'Publicado' : note.status === 'review' ? 'Revisión' : 'Borrador'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel panel-section flex flex-col">
          <div className="panel-header">
            <h3 className="panel-header__title">
              <CheckSquare size={20} />
              Tareas Urgentes
            </h3>
            <button onClick={() => setActiveSection('tasks')} className="text-xs text-accent-gold hover:underline flex items-center gap-1">
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
                          ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20'
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

      {watchlist.length > 0 && (
        <section className="watchlist-alert stagger-4">
          <div className="watchlist-alert__header">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-accent-gold" />
              <h3 className="watchlist-alert__title">Seguimiento de proyectos</h3>
            </div>
            <button type="button" onClick={() => setActiveSection('projects')} className="text-xs text-accent-gold hover:underline flex items-center gap-1">
              <MapPin size={12} /> Gestionar watchlist
            </button>
          </div>
          <div className="watchlist-alert__projects">
            {watchlist.map(id => {
              const name = getWatchlistProjectNames([id])[0];
              if (!name) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWatchlistFilter(prev => (prev === id ? null : id))}
                  className={`watchlist-project-chip ${watchlistFilter === id ? 'is-active' : ''}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {watchlistFilter && (
            <button
              type="button"
              onClick={() => setWatchlistFilter(null)}
              className="text-xs text-text-muted hover:text-accent-gold mt-2"
            >
              Ver todas las noticias
            </button>
          )}
          {!loadingNews && watchlistNews.length > 0 && (
            <p className="watchlist-alert__news-count">
              {watchlistNews.length} noticia{watchlistNews.length !== 1 ? 's' : ''} relacionada{watchlistNews.length !== 1 ? 's' : ''} hoy
            </p>
          )}
        </section>
      )}

      <section className="glass-panel panel-section flex flex-col stagger-5">
        <div className="panel-header flex-wrap gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="panel-header__title">
              <Newspaper size={22} />
              Actualidad Minera Nacional e Internacional
            </h3>
            {newsMeta && !loadingNews && (
              <p className="text-[11px] text-text-muted">
                {newsMeta.total} noticias externas
                {newsMeta.geminiEnabled && (
                  <> · {newsMeta.rss} RSS · {newsMeta.gemini} Google Search (Gemini)</>
                )}
                {newsMeta.query && <> · búsqueda: «{newsMeta.query}»</>}
                {' · '}sin notas de aceroyroca.com
              </p>
            )}
          </div>
          <button 
            onClick={() => fetchNews()}
            className="glass-button text-xs py-1.5 px-3 shrink-0"
            disabled={loadingNews}
          >
            <RefreshCw size={12} className={loadingNews ? 'animate-spin' : ''} />
            Actualizar Noticias
          </button>
        </div>

        <form onSubmit={handleNewsSearch} className="news-search-bar no-print">
          <div className="news-search-bar__input-wrap">
            <Search size={14} className="news-search-bar__icon" />
            <input
              type="search"
              value={newsQuery}
              onChange={e => setNewsQuery(e.target.value)}
              placeholder="Buscar con Gemini: Los Azules, RIGI, litio NOA, tratado minero Chile…"
              className="glass-input news-search-bar__input"
              disabled={loadingNews}
            />
          </div>
          <button type="submit" className="glass-button active text-xs py-2 px-4 shrink-0" disabled={loadingNews}>
            <Sparkles size={12} /> Buscar
          </button>
          {newsQuery && (
            <button type="button" onClick={clearNewsSearch} className="glass-button text-xs py-2 px-3 shrink-0" disabled={loadingNews}>
              Limpiar
            </button>
          )}
        </form>

        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonNews key={i} />)}
          </div>
        ) : newsError ? (
          <div className="text-center py-8">
            <p className="text-sm text-accent-red mb-2">Error al cargar feeds de noticias externas.</p>
            <button onClick={() => fetchNews()} className="glass-button text-xs">Reintentar</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredNews.map((item, idx) => renderNewsCard(item, idx))}
          </div>
        )}
      </section>
    </div>
  );
};
