import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, Trash2, Bot, Loader2, Zap, PenLine } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GeminiAgent: React.FC = () => {
  const { config, createDraftFromSource } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMessage = `Hola Carlos. Soy tu **Agente Minero Experto** de Acero & Roca.

Puedo ayudarte con:
* **Proyectos locales** — Los Azules, Josemaría, Veladero, litio en salares
* **Tecnicismos** — lixiviación, flotación, ley de corte, RIGI
* **Redacción editorial** — estructura de columnas y reportajes técnicos
* **Análisis de noticias** del sector minero argentino e internacional`;

  useEffect(() => {
    const savedChat = sessionStorage.getItem('ar_columnist_chat');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, []);

  useEffect(() => {
    const newsToDiscuss = localStorage.getItem('ar_discuss_news');
    if (newsToDiscuss) {
      try {
        const item = JSON.parse(newsToDiscuss);
        localStorage.removeItem('ar_discuss_news');
        const promptText = `Analiza esta noticia del sector minero:

**Título:** ${item.title}
**Fuente:** ${item.source}
**Detalle:** ${item.contentSnippet}

Dame un resumen ejecutivo y tu análisis técnico-editorial para una columna en Acero & Roca.`;
        setTimeout(() => handleSendMessage(promptText), 300);
      } catch (e) {
        console.error('Error procesando noticia:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('ar_columnist_chat', JSON.stringify(messages));
    }
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
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '**Error de comunicación.** Verifica que el servidor esté activo y que `GEMINI_API_KEY` esté configurada.'
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    if (window.confirm('¿Limpiar la conversación actual?')) {
      const initial: ChatMessage[] = [{ role: 'assistant', content: welcomeMessage }];
      setMessages(initial);
      sessionStorage.setItem('ar_columnist_chat', JSON.stringify(initial));
    }
  };

  const renderMessageContent = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const lines = html.split('\n');
    const output: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const isBullet = /^\*\s+/.test(trimmed);

      if (isBullet) {
        if (!inList) { output.push('<ul>'); inList = true; }
        output.push(`<li>${trimmed.replace(/^\*\s+/, '')}</li>`);
        continue;
      }
      if (inList) { output.push('</ul>'); inList = false; }
      if (!trimmed) continue;
      output.push(`<p>${trimmed}</p>`);
    }
    if (inList) output.push('</ul>');
    return output.join('');
  };

  const promptTemplates = [
    { label: 'Los Azules', prompt: 'Dame un reporte técnico-económico del proyecto Los Azules: reservas, ley, lixiviación y estado de desarrollo.', icon: '⛏️' },
    { label: 'RIGI y minería', prompt: 'Explica los puntos clave del RIGI aplicados al sector minero argentino. ¿Cómo beneficia proyectos de cobre y litio?', icon: '📋' },
    { label: 'Ley de corte', prompt: 'Explica pedagógicamente qué es la ley de corte en un pórfido de cobre y cómo influye en la viabilidad económica.', icon: '📊' },
    { label: 'Ideas de columna', prompt: 'Sugiere 3 temas potentes para una columna dominical sobre transición energética y minería argentina.', icon: '✍️' }
  ];

  const showSuggestions = messages.length <= 1;

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.content !== welcomeMessage);
  const lastUser = [...messages].reverse().find(m => m.role === 'user');

  const handleCreateDraftFromChat = async () => {
    if (!lastAssistant) return;
    const title = lastUser?.content.slice(0, 80) || 'Columna desde Agente IA';
    await createDraftFromSource({
      title,
      analysis: lastAssistant.content,
      source: 'Agente IA — Acero & Roca'
    });
  };

  return (
    <div className="agent-page animate-fade-in">
      <header className="agent-header">
        <div className="agent-header__brand">
          <div className="agent-header__avatar">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="agent-header__title">Agente Experto en Minería</h2>
            <p className="agent-header__meta">
              <span className="agent-status-dot" />
              Gemini · Asesor técnico, económico y editorial
            </p>
          </div>
        </div>
        <div className="agent-header__actions">
        <button onClick={clearChat} className="glass-button text-xs agent-header__clear" title="Limpiar conversación">
          <Trash2 size={14} /> Limpiar
        </button>
        {lastAssistant && messages.length > 1 && (
          <button
            type="button"
            onClick={handleCreateDraftFromChat}
            className="glass-button active text-xs"
            title="Crear borrador en el editor"
          >
            <PenLine size={14} /> Crear borrador
          </button>
        )}
        </div>
      </header>

      <div className="agent-body glass-panel glass-panel--scrollable">
        {showSuggestions && (
          <div className="agent-suggestions">
            <p className="agent-suggestions__label">
              <Zap size={14} /> Consultas rápidas
            </p>
            <div className="agent-suggestions__grid">
              {promptTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(tpl.prompt)}
                  className="agent-suggestion-card"
                >
                  <span className="agent-suggestion-card__icon">{tpl.icon}</span>
                  <span className="agent-suggestion-card__title">{tpl.label}</span>
                  <span className="agent-suggestion-card__desc">{tpl.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="agent-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`agent-msg agent-msg--${msg.role}`}>
              <div className="agent-msg__avatar">
                {msg.role === 'user' ? 'CF' : <Sparkles size={14} />}
              </div>
              <div className="agent-msg__bubble">
                <div
                  className="prose-chat prose-invert"
                  dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="agent-msg agent-msg--assistant">
              <div className="agent-msg__avatar agent-msg__avatar--loading">
                <Loader2 className="animate-spin" size={14} />
              </div>
              <div className="agent-msg__bubble agent-msg__bubble--typing">
                <span className="agent-typing-dots"><span /><span /><span /></span>
                Analizando datos del sector minero...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="agent-composer">
        <div className="agent-composer__inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre proyectos, geología, RIGI o pide ayuda para redactar..."
            className="agent-composer__input"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(''); }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => handleSendMessage('')}
            className="agent-composer__send"
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="agent-composer__hint">Enter para enviar · Respuestas generadas con IA — verificá datos críticos</p>
      </footer>
    </div>
  );
};
