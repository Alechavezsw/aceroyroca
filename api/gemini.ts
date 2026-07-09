import { GoogleGenAI } from '@google/genai';

import { EDITORIAL_SYSTEM_PROMPT } from '../shared/editorialPrompt.js';

const SYSTEM_INSTRUCTION = `${EDITORIAL_SYSTEM_PROMPT}

Además actuás como Agente Minero Experto de Acero & Roca para asistir a Ale Chávez en San Juan, Argentina:
- Explicar conceptos geológicos (ley de corte, pórfidos, lixiviación, flotación).
- Analizar proyectos: Los Azules, Josemaría, El Pachón, Filo del Sol, Veladero, litio en el NOA, etc.
- Contexto RIGI, regalías, EIA, licencia social y huella hídrica.
Cuando redactes o mejores texto, aplicá siempre la estructura editorial anterior en Markdown.`;

export default async function handler(req: any, res: any) {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ 
      error: 'API Key de Gemini no configurada en el servidor. Configura la variable de entorno GEMINI_API_KEY.' 
    });
    return;
  }

  const { messages, temperature = 0.7, model: requestedModel = 'gemini-2.0-flash' } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'El cuerpo de la petición debe contener un arreglo de "messages".' });
    return;
  }

  const contents = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: requestedModel,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature,
        maxOutputTokens: 4096,
      }
    });

    res.status(200).json({
      role: 'assistant',
      content: response.text || ''
    });
  } catch (error: any) {
    const fallbackModels = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const fallbacks = fallbackModels.filter(m => m !== requestedModel);

    for (const fallback of fallbacks) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: fallback,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature,
            maxOutputTokens: 4096,
          }
        });
        res.status(200).json({ role: 'assistant', content: response.text || '', modelUsed: fallback });
        return;
      } catch {
        /* try next */
      }
    }

    console.error('Error en Gemini API proxy:', error);
    res.status(500).json({ 
      error: 'Error interno procesando la solicitud con Gemini.', 
      details: error.message 
    });
  }
}
