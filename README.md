# expo-speech-transcriber

On-device speech transcription for Expo apps using Apple's Speech framework.

## Features

- 🎯 On-device transcription - Works offline, privacy-focused
- 🚀 Two APIs - Legacy SFSpeechRecognizer (iOS 13+) and SpeechAnalyzer (iOS 26+)
- 📦 Easy integration - Auto-configures permissions
- 🔒 Secure - All processing happens on device
- ⚡ Realtime transcription - Get live speech-to-text updates with built-in audio capture
- 📁 File transcription - Transcribe pre-recorded audio files
- 🎤 Buffer-based transcription - Stream audio buffers from external sources for real-time transcription

## Installation

```bash
npx expo install expo-speech-transcriber expo-audio
```

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-audio", "expo-speech-transcriber"]
  }
}
```

### Custom permission message (recommended):

Apple requires a clear purpose string for speech recognition and microphone permissions. Without it, your app may be rejected during App Store review. Provide a descriptive message explaining why your app needs access.

```json
{
  "expo": {
    "plugins": [
      "expo-audio",
      [
        "expo-speech-transcriber",
        {
          "speechRecognitionPermission": "We need speech recognition to transcribe your recordings",
          "microphonePermission": "We need microphone access to record audio for transcription"
        }
      ]
    ]
  }
}
```

For more details, see Apple's guidelines on [requesting access to protected resources](https://developer.apple.com/documentation/uikit/requesting-access-to-protected-resources).

## Usage

### Realtime Transcription

Start transcribing speech in real-time. This does not require `expo-audio`.

```typescript
import * as SpeechTranscriber from "expo-speech-transcriber";

// Request permissions
const speechPermission = await SpeechTranscriber.requestPermissions();
const micPermission = await SpeechTranscriber.requestMicrophonePermissions();
if (speechPermission !== "authorized" || micPermission !== "granted") {
  console.log("Permissions denied");
  return;
}

// Use the hook for realtime updates
const { text, isFinal, error, isRecording } =
  SpeechTranscriber.useRealTimeTranscription();

// Start transcription
await SpeechTranscriber.recordRealTimeAndTranscribe();

// Stop when done
SpeechTranscriber.stopListening();
```

### File Transcription

Transcribe pre-recorded audio files. Our library handles transcription but not recording—use `expo-audio` to record audio (see [expo-audio documentation](https://docs.expo.dev/versions/latest/sdk/audio/)), or implement your own recording logic with microphone access via `requestMicrophonePermissions()`.

```typescript
import * as SpeechTranscriber from "expo-speech-transcriber";
import { useAudioRecorder, RecordingPresets } from "expo-audio";

// Record audio with expo-audio
const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
await audioRecorder.prepareToRecordAsync();
audioRecorder.record();
// ... user speaks ...
await audioRecorder.stop();
const audioUri = audioRecorder.uri;

// Transcribe with SFSpeechRecognizer (preferred)
const text = await SpeechTranscriber.transcribeAudioWithSFRecognizer(audioUri);
console.log("Transcription:", text);

// Or with SpeechAnalyzer if available
if (SpeechTranscriber.isAnalyzerAvailable()) {
  const text = await SpeechTranscriber.transcribeAudioWithAnalyzer(audioUri);
  console.log("Transcription:", text);
}
```

For custom recording without `expo-audio`:

```typescript
// Request microphone permission for your custom recording implementation
const micPermission = await SpeechTranscriber.requestMicrophonePermissions();
// Implement your own audio recording logic here to save a file
// Then transcribe the resulting audio file URI
```

### Buffer-Based Transcription

Stream audio buffers directly to the transcriber for real-time processing. This is ideal for integrating with audio processing libraries like [react-native-audio-api](https://docs.swmansion.com/react-native-audio-api/).

```typescript
import * as SpeechTranscriber from "expo-speech-transcriber";
import { AudioManager, AudioRecorder } from "react-native-audio-api";

// Set up audio recorder
const recorder = new AudioRecorder({
  sampleRate: 16000,
  bufferLengthInSamples: 1600,
});

AudioManager.setAudioSessionOptions({
  iosCategory: "playAndRecord",
  iosMode: "spokenAudio",
  iosOptions: ["allowBluetooth", "defaultToSpeaker"],
});

// Request permissions
const speechPermission = await SpeechTranscriber.requestPermissions();
const micPermission = await AudioManager.requestRecordingPermissions();

// Stream audio buffers to transcriber
recorder.onAudioReady(({ buffer }) => {
  const channelData = buffer.getChannelData(0);
  SpeechTranscriber.realtimeBufferTranscribe(
    channelData, // Float32Array or number[]
    16000, // sample rate
  );
});

// Use the hook to get transcription updates
const { text, isFinal, error } = SpeechTranscriber.useRealTimeTranscription();

// Start streaming
recorder.start();

// Stop when done
recorder.stop();
SpeechTranscriber.stopBufferTranscription();
```

See the [BufferTranscriptionExample](./example/BufferTranscriptionExample.tsx) for a complete implementation.



## API Reference

### `requestPermissions()`
Request speech recognition permission.

**Returns:** `Promise<PermissionTypes>` - One of: `'authorized'`, `'denied'`, `'restricted'`, or `'notDetermined'`

**Example:**

```typescript
const status = await SpeechTranscriber.requestPermissions();
```

### `requestMicrophonePermissions()`

Request microphone permission.

**Returns:** `Promise<MicrophonePermissionTypes>` - One of: `'granted'` or `'denied'`

**Example:**

```typescript
const status = await SpeechTranscriber.requestMicrophonePermissions();
```

### `recordRealTimeAndTranscribe()`

Start real-time speech transcription. Listen for events via `useRealTimeTranscription` hook.

**Returns:** `Promise<void>`

**Example:**

```typescript
await SpeechTranscriber.recordRealTimeAndTranscribe();
```

### `stopListening()`

Stop real-time transcription.

**Returns:** `void`

**Example:**

```typescript
SpeechTranscriber.stopListening();
```

### `isRecording()`

Check if real-time transcription is currently recording.

**Returns:** `boolean`

**Example:**

```typescript
const recording = SpeechTranscriber.isRecording();
```

### `transcribeAudioWithSFRecognizer(audioFilePath: string)`

Transcribe audio from a pre-recorded file using SFSpeechRecognizer. I prefer this API for its reliability.

**Requires:** iOS 13+, pre-recorded audio file URI (record with `expo-audio` or your own implementation)

**Returns:** `Promise<string>` - Transcribed text

**Example:**

```typescript
const transcription = await SpeechTranscriber.transcribeAudioWithSFRecognizer(
  "file://path/to/audio.m4a"
);
```

### `transcribeAudioWithAnalyzer(audioFilePath: string)`

Transcribe audio from a pre-recorded file using SpeechAnalyzer.

**Requires:** iOS 26+, pre-recorded audio file URI (record with `expo-audio` or your own implementation)

**Returns:** `Promise<string>` - Transcribed text

**Example:**

```typescript
const transcription = await SpeechTranscriber.transcribeAudioWithAnalyzer(
  "file://path/to/audio.m4a"
);
```

### `isAnalyzerAvailable()`

Check if SpeechAnalyzer API is available.

**Returns:** `boolean` - `true` if iOS 26+, `false` otherwise

**Example:**

```typescript
if (SpeechTranscriber.isAnalyzerAvailable()) {
  // Use SpeechAnalyzer
}
```

### `useRealTimeTranscription()`

React hook for real-time transcription state.

**Returns:** `{ text: string, isFinal: boolean, error: string | null, isRecording: boolean }`

**Example:**

```typescript
const { text, isFinal, error, isRecording } =
  SpeechTranscriber.useRealTimeTranscription();
```

### `realtimeBufferTranscribe(buffer, sampleRate, channels)`

Stream audio buffers for real-time transcription. Ideal for integration with audio processing libraries.

**Parameters:**

- `buffer: Float32Array | number[]` - Audio samples
- `sampleRate: number` - Sample rate in Hz (e.g., 16000)

**NOTE** We currently support transcription for mono audio only. Natively, the channel is set to 1. 

**Returns:** `Promise<void>`

**Example:**

```typescript
const audioBuffer = new Float32Array([...]);
await SpeechTranscriber.realtimeBufferTranscribe(audioBuffer, 16000);
```

### `stopBufferTranscription()`

Stop buffer-based transcription and clean up resources.

**Returns:** `void`

**Example:**

```typescript
SpeechTranscriber.stopBufferTranscription();
```

## Example

See the [example app](./example) for a complete implementation demonstrating all APIs.

## Requirements

- iOS 13.0+
- Expo SDK 52+
- Development build (Expo Go not supported - [why?](https://expo.dev/blog/expo-go-vs-development-builds))

## Limitations

- **iOS only** - Android not supported (Speech framework is Apple-only)
- **English only** - Currently hardcoded to `en_US` locale
- **File size** - Best for short recordings (< 1 minute)
- **Recording not included** - Real-time transcription captures audio internally; file transcription requires pre-recorded audio files (use `expo-audio` or implement your own recording with `requestMicrophonePermissions()`)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/daveyeke).

## Author

Dave Mkpa Eke - [GitHub](https://github.com/daveyeke) | [X](https://x.com/1804davey)
