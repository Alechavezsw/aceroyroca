import { GoogleGenAI } from '@google/genai';

const TRANSCRIBE_PROMPT =
  'Transcribe el audio al español. Responde únicamente con el texto hablado, sin comillas, markdown ni explicaciones.';

export default async function handler(req: { method?: string; body?: Record<string, unknown> }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void };
}) {
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
    res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
    return;
  }

  const { audioBase64, mimeType = 'audio/webm' } = req.body || {};

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    res.status(400).json({ error: 'Se requiere "audioBase64" en el cuerpo de la petición.' });
    return;
  }

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  try {
    const ai = new GoogleGenAI({ apiKey });
    let transcript = '';
    let modelUsed = models[0];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: TRANSCRIBE_PROMPT },
                { inlineData: { mimeType: String(mimeType), data: audioBase64 } }
              ]
            }
          ],
          config: { temperature: 0.1, maxOutputTokens: 2048 }
        });
        transcript = (response.text || '').trim();
        modelUsed = model;
        if (transcript) break;
      } catch {
        /* try next model */
      }
    }

    if (!transcript) {
      res.status(422).json({ error: 'No se pudo transcribir el audio. Intenta grabar de nuevo.' });
      return;
    }

    res.status(200).json({ transcript, modelUsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en transcripción:', error);
    res.status(500).json({ error: 'Error transcribiendo audio.', details: message });
  }
}
