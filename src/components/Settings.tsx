import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, User, Cpu, Database, Save, CheckCircle, Rss, Target, Palette } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Settings: React.FC = () => {
  const { config, updateConfig, isDbConnected } = useApp();
  const [authorName, setAuthorName] = useState(config.authorName);
  const [geminiModel, setGeminiModel] = useState(config.geminiModel);
  const [rssFeeds, setRssFeeds] = useState(config.rssFeeds.join('\n'));
  const [wordGoalMin, setWordGoalMin] = useState(config.wordGoalMin);
  const [wordGoalMax, setWordGoalMax] = useState(config.wordGoalMax);
  const [showSavedAlert, setShowSavedAlert] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const feeds = rssFeeds
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
    updateConfig({
      authorName,
      geminiModel,
      rssFeeds: feeds,
      wordGoalMin: Math.max(100, wordGoalMin),
      wordGoalMax: Math.max(wordGoalMin + 100, wordGoalMax)
    });
    setShowSavedAlert(true);
    setTimeout(() => setShowSavedAlert(false), 3000);
  };

  return (
    <div className="main-content main-content--scroll max-w-2xl animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-border-color">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-lime/10 rounded-xl text-lime lime-glow">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Configuración del Sistema</h2>
            <p className="text-xs text-text-secondary">Personaliza tu perfil editorial y las conexiones a los servicios de Inteligencia Artificial y Base de Datos</p>
          </div>
        </div>
      </header>

      {/* Alerta de Guardado */}
      {showSavedAlert && (
        <div className="bg-emerald-500/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={16} />
          <span>Configuración guardada exitosamente en este navegador.</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Sección 1: Perfil de Columnista */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <User size={18} className="text-lime" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Perfil del Columnista</h3>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary">Firma / Nombre de Autor</label>
            <input 
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ej: Carlos Fernández"
              className="glass-input"
              required
            />
            <span className="text-[10px] text-text-muted mt-1">
              Este nombre se utilizará como la firma oficial en la cabecera del PDF impreso para tus columnas.
            </span>
          </div>
        </div>

        {/* Sección: Apariencia */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Palette size={18} className="text-lime" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Apariencia</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white">Tema de la interfaz</span>
              <p className="text-[10px] text-text-muted mt-0.5">Oscuro (editorial) o claro para redactar de día</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Sección: Objetivos editoriales */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Target size={18} className="text-accent-steel" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Meta de Palabras</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary">Mínimo</label>
              <input type="number" min={100} value={wordGoalMin} onChange={e => setWordGoalMin(Number(e.target.value))} className="glass-input" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary">Máximo (columna dominical)</label>
              <input type="number" min={500} value={wordGoalMax} onChange={e => setWordGoalMax(Number(e.target.value))} className="glass-input" />
            </div>
          </div>
          <span className="text-[10px] text-text-muted">La barra de progreso en el Editor usa estos valores como referencia.</span>
        </div>

        {/* Sección: Fuentes RSS */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Rss size={18} className="text-accent-emerald" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Fuentes de Noticias (RSS)</h3>
          </div>
          <textarea
            value={rssFeeds}
            onChange={e => setRssFeeds(e.target.value)}
            placeholder="Una URL por línea. Ej:&#10;https://news.google.com/rss/search?q=minería+argentina&#10;https://www.mining.com/feed/"
            className="glass-input min-h-[100px] resize-y font-mono text-xs"
          />
          <span className="text-[10px] text-text-muted">Si está vacío, se usan Google News y Mining.com por defecto.</span>
        </div>

        {/* Sección 2: Configuración de Inteligencia Artificial */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Cpu size={18} className="text-accent-steel" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Motor de Inteligencia Artificial</h3>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary">Modelo de Gemini</label>
            <select 
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="glass-input text-sm"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recomendado: Ultra veloz y preciso)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento profundo y técnico complejo)</option>
            </select>
            <span className="text-[10px] text-text-muted mt-1">
              Las peticiones de IA se procesan de manera segura a través de Vercel Serverless Functions para proteger tu API Key.
            </span>
          </div>
        </div>

        {/* Sección 3: Conexión de Base de Datos */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Database size={18} className="text-accent-emerald" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Estado de Base de Datos (Supabase)</h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                Conexión a PostgreSQL:
              </span>
              <span className="text-xs text-text-secondary mt-0.5">
                {isDbConnected 
                  ? 'Conectado a la base de datos de la nube en Supabase.' 
                  : 'Desconectado. Almacenando localmente en este navegador (localStorage).'
                }
              </span>
            </div>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              isDbConnected 
                ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20' 
                : 'bg-white/5 text-text-muted border border-white/10'
            }`}>
              {isDbConnected ? 'En la Nube' : 'Sin Nube'}
            </span>
          </div>

          <div className="text-xs text-text-secondary bg-black/20 p-4 rounded-lg flex flex-col gap-2 leading-relaxed">
            <span className="font-bold text-white">¿Cómo activar la base de datos en Supabase?</span>
            <ol className="list-decimal list-inside flex flex-col gap-1.5 text-text-muted text-[11px]">
              <li>Crea un proyecto gratis en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-lime hover:underline">Supabase.com</a>.</li>
              <li>Abre el editor SQL de Supabase y ejecuta el script provisto <code className="text-white bg-white/10 px-1 py-0.5 rounded text-[10px]">supabase_schema.sql</code>.</li>
              <li>Crea un archivo <code className="text-white bg-white/10 px-1 py-0.5 rounded text-[10px]">.env</code> en el directorio raíz de este proyecto con tus credenciales:</li>
            </ol>
            <pre className="bg-black/40 p-2.5 rounded font-mono text-[10px] text-white mt-1 border border-white/5">
{`VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica`}
            </pre>
          </div>
        </div>

        {/* Botón Guardar */}
        <button 
          type="submit"
          className="glass-button active py-3 justify-center text-sm font-semibold"
        >
          <Save size={16} /> Guardar Configuración
        </button>
      </form>
    </div>
  );
};
