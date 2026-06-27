import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceRecorderStatus = 'idle' | 'requesting' | 'recording' | 'recorded' | 'transcribing';

const MAX_SECONDS = 120;
const MIN_BYTES = 512;

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

export function useVoiceRecorder() {
  const [status, setStatus] = useState<VoiceRecorderStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<number | null>(null);

  const releaseResources = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    blobRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    releaseResources();
    setSeconds(0);
    setError(null);
    setStatus('idle');
  }, [releaseResources]);

  const fail = useCallback((message: string) => {
    releaseResources();
    setSeconds(0);
    setStatus('idle');
    setError(message);
  }, [releaseResources]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
        recorder.requestData();
      }
    } catch {
      /* some browsers throw if no buffered data */
    }

    recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    if (!window.isSecureContext) {
      fail('La grabación requiere HTTPS. Abrí el portal desde aceroyroca.vercel.app.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      fail('Tu navegador no soporta grabación de voz.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      fail('Tu navegador no soporta MediaRecorder. Probá Chrome, Edge o Safari reciente.');
      return;
    }

    const mimeType = pickMimeType();
    if (!mimeType) {
      fail('No hay formato de audio compatible en este navegador.');
      return;
    }

    releaseResources();
    setSeconds(0);
    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        blobRef.current = blob;

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;

        if (blob.size < MIN_BYTES) {
          blobRef.current = null;
          setError('No se capturó audio. Grabá al menos 1 segundo y volvé a intentar.');
          setStatus('idle');
          return;
        }

        setStatus('recorded');
      };

      recorder.onerror = () => {
        fail('Error durante la grabación.');
      };

      recorder.start(500);
      setStatus('recording');
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => {
          if (prev + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        fail('Permiso de micrófono denegado. Permitilo en la barra del navegador y recargá.');
      } else if (name === 'NotFoundError') {
        fail('No se encontró micrófono en este dispositivo.');
      } else {
        fail('No se pudo acceder al micrófono. Revisá permisos y recargá la página.');
      }
    }
  }, [fail, releaseResources, stopRecording]);

  useEffect(() => () => {
    releaseResources();
  }, [releaseResources]);

  const getRecordedBlob = () => blobRef.current;

  const setTranscribing = (value: boolean) => {
    setStatus(value ? 'transcribing' : blobRef.current ? 'recorded' : 'idle');
  };

  return {
    status,
    seconds,
    error,
    startRecording,
    stopRecording,
    reset,
    getRecordedBlob,
    setTranscribing,
    setError
  };
}

export function formatRecordingTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
