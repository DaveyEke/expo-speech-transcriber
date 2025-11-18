import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type TranscriptionProgressPayload = {
  text: string;
  isFinal: boolean;
};


export type TranscriptionErrorPayload = {
  error: string;
};

export type ExpoSpeechTranscriberModuleEvents = {
  onTranscriptionProgress(payload: TranscriptionProgressPayload): void;
  onTranscriptionError(payload: TranscriptionErrorPayload): void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoSpeechTranscriberViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
