// Reexport the native module. On web, it will be resolved to ExpoSpeechTranscriberModule.web.ts
// and on native platforms to ExpoSpeechTranscriberModule.ts
import ExpoSpeechTranscriberModule from './ExpoSpeechTranscriberModule';
import type {
  TranscriptionProgressPayload,
  TranscriptionErrorPayload,
} from './ExpoSpeechTranscriber.types';
import { useState, useEffect } from 'react';

export function recordRealTimeAndTranscribe(): Promise<void> {
  return ExpoSpeechTranscriberModule.recordRealTimeAndTranscribe();
}

export { default as ExpoSpeechTranscriberModule } from './ExpoSpeechTranscriberModule';
export * from './ExpoSpeechTranscriber.types';

export function transcribeAudioWithSFRecognizer(audioFilePath: string): Promise<string> {
  return ExpoSpeechTranscriberModule.transcribeAudioWithSFRecognizer(audioFilePath);
}

export function stopListening(): void {
  return ExpoSpeechTranscriberModule.stopListening();
}

export function transcribeAudioWithAnalyzer(audioFilePath: string): Promise<string> {
  return ExpoSpeechTranscriberModule.transcribeAudioWithAnalyzer(audioFilePath);
}

export function requestPermissions(): Promise<string> {
  return ExpoSpeechTranscriberModule.requestPermissions();
}

export function isAnalyzerAvailable(): boolean {
  return ExpoSpeechTranscriberModule.isAnalyzerAvailable();
}

export function useRealTimeTranscription() {
  const [text, setText] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const progressListener = ExpoSpeechTranscriberModule.addListener('onTranscriptionProgress', (payload: TranscriptionProgressPayload) => {
      setText(payload.text);
      setIsFinal(payload.isFinal);
    });

    const errorListener = ExpoSpeechTranscriberModule.addListener('onTranscriptionError', (payload: TranscriptionErrorPayload) => {
      setError(payload.error);
    });

    return () => {
      progressListener.remove();
      errorListener.remove();
    };
  }, []);

  return { text, isFinal, error };
}
