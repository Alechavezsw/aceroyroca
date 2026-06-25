import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, Trash2, Cpu, Loader2 } from 'lucide-react';


interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GeminiAgent: React.FC = () => {
  const { config } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mensaje de bienvenida inicial
  const welcomeMessage = `Hola Carlos. Soy tu **Agente Minero Experto de Acero & Roca**.
  
¿En qué proyecto o columna trabajamos hoy? Puedo ayudarte a:
* **Analizar proyectos locales** de cobre, oro o litio (Los Azules, Josemaría, Veladero, etc.).
* **Explicar tecnicismos geológicos** o procesos industriales (lixiviación, flotación, RIGI).
* **Escribir y estructurar** tus columnas dominicales o reportajes técnicos.
* **Resumir y opinar** sobre noticias recientes del sector minero.`;

  useEffect(() => {
    // Inicializar chat
    const savedChat = sessionStorage.getItem('ar_columnist_chat');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, []);

  // Verificar si venimos del Dashboard para analizar una noticia
  useEffect(() => {
    const newsToDiscuss = localStorage.getItem('ar_discuss_news');
    if (newsToDiscuss) {
      try {
        const item = JSON.parse(newsToDiscuss);
        localStorage.removeItem('ar_discuss_news'); // Limpiar de inmediato
        
        const promptText = `Hola. Me gustaría analizar esta noticia reciente del sector:
        
Título: "${item.title}"
Fuente: ${item.source}
Detalle: ${item.contentSnippet}
Enlace: ${item.link}

Por favor, haz un resumen ejecutivo de esta noticia y bríndame tu análisis técnico y de opinión como experto en minería para mi próxima columna en Acero & Roca.`;
        
        // Agregar mensaje de usuario y ejecutar llamada
        setTimeout(() => {
          handleSendMessage(promptText);
        }, 300);
      } catch (e) {
        console.error('Error procesando noticia para discusión:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Guardar historial
    if (messages.length > 0) {
      sessionStorage.setItem('ar_columnist_chat', JSON.stringify(messages));
    }
    // Auto-scroll
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    if (!textToSend) setInput('');
    setLoading(true);

    const userMessage: ChatMessage = { role: 'user', content: queryText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          temperature: 0.7,
          model: config.geminiModel
        })
      });

      if (!res.ok) throw new Error('Error al conectar con el servidor.');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: '❌ **Error de comunicación**: No se pudo obtener respuesta del agente. Por favor, asegúrate de que el servidor local está en ejecución y que la variable de entorno `GEMINI_API_KEY` esté configurada correctamente.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('¿Quieres limpiar la conversación actual?')) {
      const initial: ChatMessage[] = [{ role: 'assistant', content: welcomeMessage }];
      setMessages(initial);
      sessionStorage.setItem('ar_columnist_chat', JSON.stringify(initial));
    }
  };

  // Convertidor de Markdown para los globos del chat
  const renderMessageContent = (text: string) => {
    let html = text;
    
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const lines = html.split('\n');
    const output: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const isBullet = /^\*\s+/.test(trimmed);

      if (isBullet) {
        if (!inList) {
          output.push('<ul>');
          inList = true;
        }
        output.push(`<li>${trimmed.replace(/^\*\s+/, '')}</li>`);
        continue;
      }

      if (inList) {
        output.push('</ul>');
        inList = false;
      }

      if (!trimmed) continue;
      output.push(`<p>${trimmed}</p>`);
    }

    if (inList) output.push('</ul>');
    return output.join('');
  };

  const promptTemplates = [
    { label: 'Analizar Proyecto Los Azules', prompt: 'Dame un reporte técnico-económico detallado del proyecto de cobre Los Azules en Calingasta: reservas estimadas, ley de mineral, plan de lixiviación y estado de desarrollo.' },
    { label: 'Efecto del RIGI en Minería', prompt: 'Explica los puntos clave del RIGI (Régimen de Incentivos) aplicados al sector minero en Argentina. ¿Cómo beneficia a los proyectos de cobre y litio?' },
    { label: 'Concepto: Ley de Corte', prompt: 'Explica pedagógicamente qué es la "ley de corte" (cut-off grade) en un yacimiento de pórfidos de cobre y cómo influye en la viabilidad económica de una mina.' },
    { label: 'Ideas para Columna Semanal', prompt: 'Sugiere 3 enfoques o temas de columnas de opinión potentes y actuales para escribir este domingo relacionados con la transición energética y la minería argentina.' }
  ];

  return (
    <div className="main-content flex flex-col animate-fade-in h-full">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-border-color shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-gold/10 rounded-xl text-accent-gold">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Agente Experto en Minería</h2>
            <p className="text-xs text-text-secondary">Desarrollado con Gemini - Asesor técnico, económico y editorial</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="glass-button text-xs py-1.5 hover:text-accent-red"
          title="Limpiar Conversación"
        >
          <Trash2 size={14} /> Limpiar Chat
        </button>
      </header>

      {/* Grid de Plantillas Rápidas (Solo visibles si no hay chat largo) */}
      {messages.length <= 1 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 mt-4">
          {promptTemplates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(tpl.prompt)}
              className="glass-panel p-4 text-left hover:border-accent-gold/40 hover:bg-white/[0.02] transition-all duration-200 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2 text-accent-gold text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={12} />
                {tpl.label}
              </div>
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {tpl.prompt}
              </p>
            </button>
          ))}
        </section>
      )}

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-5 py-4 min-h-0 pr-2">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex gap-3 w-full max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              msg.role === 'user'
                ? 'bg-accent-gold text-white font-semibold shadow-sm'
                : 'bg-accent-steel/20 text-accent-steel border border-accent-steel/30'
            }`}>
              {msg.role === 'user' ? 'CF' : 'G'}
            </div>

            <div className={`p-4 rounded-xl text-sm leading-relaxed border break-words shadow-sm ${
              msg.role === 'user'
                ? 'bg-accent-gold/10 border-accent-gold/30 text-white'
                : 'bg-bg-secondary border-border-color text-text-primary'
            }`}>
              <div 
                className="prose-chat prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }} 
              />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="w-8 h-8 rounded-lg bg-accent-steel/20 text-accent-steel border border-accent-steel/30 flex items-center justify-center">
              <Loader2 className="animate-spin" size={14} />
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-color text-xs text-text-secondary flex items-center gap-2 typing-cursor shadow-sm">
              <span>Gemini procesando y analizando datos de minería...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensaje */}
      <footer className="flex gap-3 items-center pt-4 border-t border-border-color shrink-0 mt-auto">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre proyectos mineros, leyes geológicas o redacta partes de una columna..."
          className="glass-input flex-1 py-3 px-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage('');
          }}
          disabled={loading}
        />
        <button 
          onClick={() => handleSendMessage('')}
          className="glass-button active px-6 py-3 shadow-sm"
          disabled={loading || !input.trim()}
        >
          <Send size={16} /> Enviar
        </button>
      </footer>
    </div>
  );
};
