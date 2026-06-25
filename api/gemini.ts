import { GoogleGenerativeAI } from '@google/generative-ai';

// Prompt del sistema para el experto en minería
const SYSTEM_INSTRUCTION = `Actúas como el Agente Minero Experto de Acero & Roca, un asesor técnico, económico y geopolítico de minería de primer nivel.
Tu objetivo es asistir a Carlos Fernández, columnista estrella de "Acero y Roca" en San Juan, Argentina, a:
1. Redactar, corregir, mejorar y analizar artículos, columnas de opinión y notas de prensa.
2. Explicar de forma clara conceptos geológicos complejos (ley de corte, mineralización, pórfidos de cobre, yacimientos epitermales de oro, flotación, lixiviación, etc.).
3. Analizar la economía y el estado de proyectos mineros clave en Argentina, como:
   - Cobre: Los Azules, Josemaría, El Pachón, Filo del Sol, Taca Taca, Agua Rica (Proyecto MARA).
   - Litio: Olaroz, Cauchari-Olaroz, Fénix, Sal de Oro, Centenario Ratones, Tres Quebradas.
   - Oro y Plata: Veladero, Gualcamayo, Cerro Negro, San José, Manantial Espejo.
4. Proveer análisis sobre el impacto del RIGI (Régimen de Incentivo para Grandes Inversiones), regalías mineras, impacto ambiental, huella hídrica y licencia social, siempre con una mirada objetiva, técnica e informada.
5. Sugerir titulares atractivos, copetes, ganchos de lectura y estructuras narrativas para columnas periodísticas de gran impacto.

Adopta un tono profesional, periodístico, analítico, técnicamente riguroso pero accesible. Cuando respondas sobre proyectos de San Juan u otra provincia, demuestra conocimiento geográfico local (ej. Iglesia, Calingasta, Jáchal, Sarmiento), la empresa operadora actual (ej. Lundin Mining, Glencore, McEwen Mining, Barrick Gold) y su estado regulatorio o de factibilidad.`;

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

  try {
    const { messages, temperature = 0.7, model: requestedModel = 'gemini-1.5-flash' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'El cuerpo de la petición debe contener un arreglo de "messages".' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Mapear historial al formato de Gemini
    // El formato de chat de Gemini requiere alternar 'user' y 'model' roles en un arreglo de contents.
    // Filtrar el primer mensaje si es un prompt de sistema o integrarlo como systemInstruction
    const model = genAI.getGenerativeModel({ 
      model: requestedModel,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Formatear mensajes para la API de Gemini
    // En Gemini: { role: 'user' | 'model', parts: [{ text: string }] }
    // Nota: El último mensaje debe ser del usuario para generar una respuesta.
    const geminiHistory = messages.slice(0, -1).map((msg: any) => {
      let role = 'user';
      if (msg.role === 'assistant' || msg.role === 'model') {
        role = 'model';
      }
      return {
        role: role,
        parts: [{ text: msg.content }]
      };
    });

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      res.status(400).json({ error: 'El último mensaje debe ser del rol "user".' });
      return;
    }

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 2048,
      }
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const responseText = response.text();

    res.status(200).json({
      role: 'assistant',
      content: responseText
    });
  } catch (error: any) {
    console.error('Error en Gemini API proxy:', error);
    res.status(500).json({ 
      error: 'Error interno procesando la solicitud con Gemini.', 
      details: error.message 
    });
  }
}
