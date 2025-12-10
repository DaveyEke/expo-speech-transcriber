// Reexport the native module. On web, it will be resolved to ExpoSpeechTranscriberModule.web.ts
// and on native platforms to ExpoSpeechTranscriberModule.ts
import ExpoSpeechTranscriberModule from './ExpoSpeechTranscriberModule';
import type {
  TranscriptionProgressPayload,
  TranscriptionErrorPayload,
  MicrophonePermissionTypes,
  PermissionTypes
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

export function requestPermissions(): Promise<PermissionTypes> {
  return ExpoSpeechTranscriberModule.requestPermissions();
}

export function requestMicrophonePermissions(): Promise<MicrophonePermissionTypes> {
  return ExpoSpeechTranscriberModule.requestMicrophonePermissions();
}

export function isRecording(): boolean {
  return ExpoSpeechTranscriberModule.isRecording();
}

export function isAnalyzerAvailable(): boolean {
  return ExpoSpeechTranscriberModule.isAnalyzerAvailable();
}

export function realtimeBufferTranscribe(
  buffer: number[] | Float32Array,
  sampleRate: number,
): Promise<void> {
  const bufferArray = Array.isArray(buffer) ? buffer : Array.from(buffer);
  return ExpoSpeechTranscriberModule.realtimeBufferTranscribe(
    bufferArray,
    sampleRate,
  );
}

export function stopBufferTranscription(): void {
  return ExpoSpeechTranscriberModule.stopBufferTranscription();
}

export function useRealTimeTranscription() {
  const [text, setText] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const progressListener = ExpoSpeechTranscriberModule.addListener('onTranscriptionProgress', (payload: TranscriptionProgressPayload) => {
      setText(payload.text);
      setIsFinal(payload.isFinal);
    });

    const errorListener = ExpoSpeechTranscriberModule.addListener('onTranscriptionError', (payload: TranscriptionErrorPayload) => {
      setError(payload.error);
    })


    const interval = setInterval(() => {
      const newIsRecording = ExpoSpeechTranscriberModule.isRecording();
      setIsRecording(prev => (prev !== newIsRecording ? newIsRecording : prev));
    }, 100);

    return () => {
      clearInterval(interval);
      progressListener.remove();
      errorListener.remove();
    };
  }, []);


    useEffect(() => {
      if (isRecording) {
        setText('');
        setIsFinal(false);
        setError(null);
      }
    }, [isRecording]);

  return { text, isFinal, error, isRecording };
}
