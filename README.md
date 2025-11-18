# expo-speech-transcriber

On-device speech transcription for Expo apps using Apple's Speech framework.

## Features

- 🎯 On-device transcription - Works offline, privacy-focused
- 🚀 Two APIs - Legacy SFSpeechRecognizer (iOS 13+) and SpeechAnalyzer (iOS 26+)
- 📦 Easy integration - Auto-configures permissions
- 🔒 Secure - All processing happens on device
- ⚡ Realtime transcription - Get live speech-to-text updates

## Installation

```bash
npx expo install expo-speech-transcriber expo-audio
```

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-audio",
      "expo-speech-transcriber"
    ]
  }
}
```

### Custom permission message (recommended):

Apple requires a clear purpose string for speech recognition permissions. Without it, your app may be rejected during App Store review. Provide a descriptive message explaining why your app needs access.

```json
{
  "expo": {
    "plugins": [
      "expo-audio",
      [
        "expo-speech-transcriber",
        {
          "speechRecognitionPermission": "We need speech recognition to transcribe your recordings"
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
import * as SpeechTranscriber from 'expo-speech-transcriber';

// Request permissions
const permission = await SpeechTranscriber.requestPermissions();
if (permission !== 'authorized') {
  console.log('Permission denied');
  return;
}

// Use the hook for realtime updates
const { text, isFinal, error } = SpeechTranscriber.useRealTimeTranscription();

// Start transcription
await SpeechTranscriber.recordRealTimeAndTranscribe();

// Stop when done
SpeechTranscriber.stopListening();
```

### File Transcription

Transcribe pre-recorded audio files. This requires `expo-audio` to obtain audio URIs.

```typescript
import * as SpeechTranscriber from 'expo-speech-transcriber';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';

// Record audio
const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
await audioRecorder.prepareToRecordAsync();
audioRecorder.record();
// ... user speaks ...
await audioRecorder.stop();
const audioUri = audioRecorder.uri;

// Transcribe with SFSpeechRecognizer (preferred)
const text = await SpeechTranscriber.transcribeAudioWithSFRecognizer(audioUri);
console.log('Transcription:', text);

// Or with SpeechAnalyzer if available
if (SpeechTranscriber.isAnalyzerAvailable()) {
  const text = await SpeechTranscriber.transcribeAudioWithAnalyzer(audioUri);
  console.log('Transcription:', text);
}
```

## API Reference

### `requestPermissions()`
Request speech recognition permission.

**Returns:** `Promise<string>` - `"authorized"`, `"denied"`, `"restricted"`, or `"notDetermined"`

**Example:**
```typescript
const status = await SpeechTranscriber.requestPermissions();
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

### `transcribeAudioWithSFRecognizer(audioFilePath: string)`
Transcribe audio from a file using SFSpeechRecognizer. I prefer this API for its reliability.

**Requires:** iOS 13+, audio file URI (use `expo-audio` to record)

**Returns:** `Promise<string>` - Transcribed text

**Example:**
```typescript
const transcription = await SpeechTranscriber.transcribeAudioWithSFRecognizer('file://path/to/audio.m4a');
```

### `transcribeAudioWithAnalyzer(audioFilePath: string)`
Transcribe audio from a file using SpeechAnalyzer.

**Requires:** iOS 26+, audio file URI (use `expo-audio` to record)

**Returns:** `Promise<string>` - Transcribed text

**Example:**
```typescript
const transcription = await SpeechTranscriber.transcribeAudioWithAnalyzer('file://path/to/audio.m4a');
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

**Returns:** `{ text: string, isFinal: boolean, error: string | null }`

**Example:**
```typescript
const { text, isFinal, error } = SpeechTranscriber.useRealTimeTranscription();
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
- **expo-audio required for file transcription** - Realtime transcription works without it

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/daveyeke).

## Author

Dave Mkpa Eke - [GitHub](https://github.com/daveyeke) | [X](https://x.com/1804davey)