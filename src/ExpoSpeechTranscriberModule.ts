import { requireNativeModule, NativeModule } from 'expo-modules-core';
import type {
  ExpoSpeechTranscriberModuleEvents,
} from './ExpoSpeechTranscriber.types';

declare class ExpoSpeechTranscriberNative extends NativeModule<ExpoSpeechTranscriberModuleEvents> {
  recordRealTimeAndTranscribe(): Promise<void>;
  stopListening(): void;
  transcribeAudioWithSFRecognizer(audioFilePath: string): Promise<string>;
  transcribeAudioWithAnalyzer(audioFilePath: string): Promise<string>;
  requestPermissions(): Promise<string>;
  isAnalyzerAvailable(): boolean;
}

const ExpoSpeechTranscriberModule =
  requireNativeModule<ExpoSpeechTranscriberNative>('ExpoSpeechTranscriber');

export default ExpoSpeechTranscriberModule;
