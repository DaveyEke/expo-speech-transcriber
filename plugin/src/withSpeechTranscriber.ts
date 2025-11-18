import { ConfigPlugin, IOSConfig } from 'expo/config-plugins';

const SPEECH_RECOGNITION_USAGE = 'Allow $(PRODUCT_NAME) to use speech recognition to transcribe audio';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

const withSpeechTranscriber: ConfigPlugin<{ speechRecognitionPermission?: string | false; microphonePermission?: string | false } | void> = (
  config,
  { speechRecognitionPermission, microphonePermission } = {}
) => {
  config = IOSConfig.Permissions.createPermissionsPlugin({
    NSSpeechRecognitionUsageDescription: SPEECH_RECOGNITION_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSSpeechRecognitionUsageDescription: speechRecognitionPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  return config;
};

export default withSpeechTranscriber;