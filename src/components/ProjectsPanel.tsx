import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MINING_PROJECTS } from '../data/miningProjects';
import { MapPin, Cpu, Filter, Building2, TrendingUp, Activity, DollarSign, Star } from 'lucide-react';

const COMMODITIES = ['Todos', 'Cobre', 'Oro y Plata', 'Litio', 'Oro', 'Plata'] as const;

const COMMODITY_COLORS: Record<string, string> = {
  Cobre: 'copper',
  Litio: 'lithium',
  'Oro y Plata': 'gold',
  Oro: 'gold',
  Plata: 'silver'
};

export const ProjectsPanel: React.FC = () => {
  const { setActiveSection, watchlist, toggleWatchlist, isWatchlisted } = useApp();
  const [filter, setFilter] = useState<string>('Todos');
  const [selected, setSelected] = useState(MINING_PROJECTS[0].id);

  const filtered = filter === 'Todos'
    ? MINING_PROJECTS
    : MINING_PROJECTS.filter(p => p.commodity === filter || (filter === 'Oro' && p.commodity === 'Oro y Plata'));

  const project = MINING_PROJECTS.find(p => p.id === selected) || MINING_PROJECTS[0];
  const commodityClass = COMMODITY_COLORS[project.commodity] || 'copper';
  const watched = isWatchlisted(project.id);

  const askAgent = () => {
    localStorage.setItem('ar_discuss_news', JSON.stringify({
      title: `Análisis del proyecto ${project.name}`,
      source: 'Mapa de Proyectos Acero & Roca',
      contentSnippet: `${project.highlight} Operador: ${project.operator}. Etapa: ${project.stage}. ${project.status}`,
      link: '#',
      category: project.commodity
    }));
    setActiveSection('agent');
  };

  return (
    <div className="main-content main-content--scroll animate-fade-in">
      <header className="dashboard-hero stagger-1">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">
            <MapPin size={12} /> Argentina · NOA y Patagonia
          </span>
          <h2 className="dashboard-hero__title">
            Mapa de <span className="dashboard-hero__title-accent">Proyectos</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            {MINING_PROJECTS.length} proyectos clave · {watchlist.length} en seguimiento (watchlist)
          </p>
        </div>
      </header>

      {watchlist.length > 0 && (
        <div className="watchlist-alert watchlist-alert--compact stagger-2">
          <div className="watchlist-alert__header">
            <span className="watchlist-alert__title flex items-center gap-2">
              <Star size={14} className="text-accent-gold" /> En seguimiento
            </span>
          </div>
          <div className="watchlist-alert__projects">
            {watchlist.map(id => {
              const p = MINING_PROJECTS.find(x => x.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={`watchlist-project-chip ${selected === id ? 'is-active' : ''}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="project-filters stagger-2">
        <Filter size={14} className="text-text-muted shrink-0" />
        {COMMODITIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`glass-button text-xs py-1.5 ${filter === c ? 'active' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="projects-layout stagger-3">
        <div className="projects-map glass-panel">
          <div className="projects-map__grid">
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={`project-pin ${selected === p.id ? 'is-selected' : ''} ${isWatchlisted(p.id) ? 'is-watched' : ''}`}
                style={{
                  left: `${((p.lng + 74) / 12) * 85 + 5}%`,
                  top: `${((35 - p.lat) / 18) * 80 + 8}%`
                }}
                title={p.name}
              >
                <span className="project-pin__dot" data-commodity={p.commodity} />
                {isWatchlisted(p.id) && <Star size={8} className="project-pin__star" />}
                <span className="project-pin__label">{p.name}</span>
              </button>
            ))}
          </div>
          <p className="projects-map__caption">Mapa esquemático — Cordillera de los Andes</p>
        </div>

        <div className={`glass-panel project-detail project-detail--${commodityClass}`}>
          <div className={`project-detail__accent project-detail__accent--${commodityClass}`} />

          <div className="project-detail__header">
            <div className="flex justify-between items-start gap-3">
              <span className={`project-detail__badge project-detail__badge--${commodityClass}`}>
                {project.commodity}
              </span>
              <button
                type="button"
                onClick={() => toggleWatchlist(project.id)}
                className={`project-watchlist-btn ${watched ? 'is-active' : ''}`}
                title={watched ? 'Quitar de seguimiento' : 'Agregar a seguimiento'}
              >
                <Star size={18} fill={watched ? 'currentColor' : 'none'} />
              </button>
            </div>
            <h3 className="project-detail__name">{project.name}</h3>
            <p className="project-detail__province">
              <MapPin size={13} /> {project.province}, Argentina
            </p>
          </div>

          <div className="project-detail__stats">
            <div className="project-stat">
              <Building2 size={16} className="project-stat__icon" />
              <div>
                <span className="project-stat__label">Operador</span>
                <span className="project-stat__value">{project.operator}</span>
              </div>
            </div>
            <div className="project-stat">
              <Activity size={16} className="project-stat__icon" />
              <div>
                <span className="project-stat__label">Etapa</span>
                <span className="project-stat__value">{project.stage}</span>
              </div>
            </div>
            {project.investment && (
              <div className="project-stat">
                <DollarSign size={16} className="project-stat__icon" />
                <div>
                  <span className="project-stat__label">Inversión est.</span>
                  <span className="project-stat__value">{project.investment}</span>
                </div>
              </div>
            )}
            <div className="project-stat project-stat--wide">
              <TrendingUp size={16} className="project-stat__icon" />
              <div>
                <span className="project-stat__label">Estado actual</span>
                <span className="project-stat__value">{project.status}</span>
              </div>
            </div>
          </div>

          <div className="project-detail__highlight">
            <span className="project-detail__highlight-label">Resumen clave</span>
            <p>{project.highlight}</p>
          </div>

          <div className="project-detail__actions">
            <button type="button" className="glass-button active text-sm flex-1 justify-center" onClick={askAgent}>
              <Cpu size={16} /> Analizar con Agente IA
            </button>
            <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('course')}>
              Ver curso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
