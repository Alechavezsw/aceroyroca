import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MINING_PROJECTS } from '../data/miningProjects';
import { MapPin, ExternalLink, Cpu, Filter } from 'lucide-react';

const COMMODITIES = ['Todos', 'Cobre', 'Oro y Plata', 'Litio', 'Oro', 'Plata'] as const;

export const ProjectsPanel: React.FC = () => {
  const { setActiveSection } = useApp();
  const [filter, setFilter] = useState<string>('Todos');
  const [selected, setSelected] = useState(MINING_PROJECTS[0].id);

  const filtered = filter === 'Todos'
    ? MINING_PROJECTS
    : MINING_PROJECTS.filter(p => p.commodity === filter || (filter === 'Oro' && p.commodity === 'Oro y Plata'));

  const project = MINING_PROJECTS.find(p => p.id === selected) || MINING_PROJECTS[0];

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
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h2 className="dashboard-hero__title flex items-center gap-3">
            <MapPin className="text-lime" size={28} />
            Mapa de <span className="text-gradient-lime">Proyectos</span>
          </h2>
          <p className="dashboard-hero__subtitle">
            Proyectos mineros clave de Argentina: cobre, oro, plata y litio con estado operativo actualizado.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-text-muted" />
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

      <div className="projects-layout">
        <div className="projects-map glass-panel">
          <div className="projects-map__grid">
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={`project-pin ${selected === p.id ? 'is-selected' : ''}`}
                style={{
                  left: `${((p.lng + 74) / 12) * 85 + 5}%`,
                  top: `${((35 - p.lat) / 18) * 80 + 8}%`
                }}
                title={p.name}
              >
                <span className="project-pin__dot" data-commodity={p.commodity} />
                <span className="project-pin__label">{p.name}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted text-center mt-2">Mapa esquemático — Andes y NOA</p>
        </div>

        <div className="glass-panel p-6 flex flex-col project-detail">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div>
              <span className={`news-badge ${project.commodity.toLowerCase().replace(/\s/g, '')} mb-2 inline-block`}>
                {project.commodity}
              </span>
              <h3 className="text-2xl font-bold text-white">{project.name}</h3>
              <p className="text-sm text-text-muted">{project.province}</p>
            </div>
          </div>
          <dl className="project-detail__grid">
            <div><dt>Operador</dt><dd>{project.operator}</dd></div>
            <div><dt>Etapa</dt><dd>{project.stage}</dd></div>
            {project.investment && <div><dt>Inversión est.</dt><dd>{project.investment}</dd></div>}
            <div className="col-span-2"><dt>Estado</dt><dd>{project.status}</dd></div>
          </dl>
          <p className="text-sm text-text-secondary leading-relaxed mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            {project.highlight}
          </p>
          <div className="flex gap-2 mt-6">
            <button type="button" className="glass-button active text-sm flex-1 justify-center" onClick={askAgent}>
              <Cpu size={16} /> Analizar con Agente IA
            </button>
            <button type="button" className="glass-button text-sm" onClick={() => setActiveSection('course')}>
              <ExternalLink size={14} /> Ir al Curso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
