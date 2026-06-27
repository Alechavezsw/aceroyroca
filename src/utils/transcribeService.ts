function normalizeAudioMimeType(mime: string): string {
  const base = mime.split(';')[0].trim().toLowerCase();
  const map: Record<string, string> = {
    'audio/webm': 'audio/webm',
    'audio/mp4': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
    'audio/aac': 'audio/aac',
    'audio/ogg': 'audio/ogg',
    'audio/mpeg': 'audio/mpeg',
    'audio/wav': 'audio/wav'
  };
  return map[base] || 'audio/webm';
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  if (blob.size < 512) {
    throw new Error('El audio es demasiado corto. Grabá al menos 1 segundo.');
  }

  const base64 = await blobToBase64(blob);
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: normalizeAudioMimeType(blob.type || 'audio/webm')
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.details || 'No se pudo transcribir el audio.');
  }
  return String(data.transcript || '').trim();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el audio.'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Formato de audio inválido.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo de audio.'));
    reader.readAsDataURL(blob);
  });
}
