import React from 'react';
import { Mic, Square, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useVoiceRecorder, formatRecordingTime } from '../hooks/useVoiceRecorder';
import { transcribeAudio } from '../utils/transcribeService';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  label?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  disabled = false,
  label = 'Grabar nota de voz'
}) => {
  const {
    status,
    seconds,
    error,
    startRecording,
    stopRecording,
    reset,
    getRecordedBlob,
    setTranscribing,
    setError
  } = useVoiceRecorder();

  const handleSaveAndTranscribe = async () => {
    const blob = getRecordedBlob();
    if (!blob || blob.size === 0) {
      setError('No hay audio grabado.');
      return;
    }

    setError(null);
    setTranscribing(true);
    try {
      const transcript = await transcribeAudio(blob);
      if (!transcript) {
        throw new Error('La transcripción llegó vacía.');
      }
      onTranscription(transcript);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al transcribir.';
      setError(msg);
    } finally {
      setTranscribing(false);
    }
  };

  const isBusy = status === 'transcribing' || status === 'requesting' || disabled;

  return (
    <div className="voice-recorder">
      <div className="voice-recorder__header">
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        {status === 'recording' && (
          <span className="voice-recorder__timer">
            <span className="voice-recorder__dot" />
            {formatRecordingTime(seconds)}
          </span>
        )}
      </div>

      <div className="voice-recorder__actions">
        {(status === 'idle' || status === 'requesting') && (
          <button
            type="button"
            disabled={isBusy}
            onClick={startRecording}
            className="voice-recorder__btn voice-recorder__btn--record"
          >
            {status === 'requesting' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Micrófono…
              </>
            ) : (
              <>
                <Mic size={14} />
                Grabar
              </>
            )}
          </button>
        )}

        {status === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="voice-recorder__btn voice-recorder__btn--stop"
          >
            <Square size={12} fill="currentColor" />
            Detener
          </button>
        )}

        {(status === 'recorded' || status === 'transcribing') && (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleSaveAndTranscribe}
              className="voice-recorder__btn voice-recorder__btn--save"
            >
              {status === 'transcribing' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Transcribiendo…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Guardar y transcribir
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={reset}
              className="voice-recorder__btn voice-recorder__btn--discard"
              title="Descartar grabación"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};
