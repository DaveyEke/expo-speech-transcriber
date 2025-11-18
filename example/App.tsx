import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SpeechTranscriber from 'expo-speech-transcriber';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';

const App = () => {
  const { text, isFinal, error } = SpeechTranscriber.useRealTimeTranscription();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sfTranscription, setSfTranscription] = useState<string>('');
  const [analyzerTranscription, setAnalyzerTranscription] = useState<string>('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    if (isFinal) {
      setIsTranscribing(false);
    }
  }, [isFinal]);

  const requestAllPermissions = async () => {
    try {
      const speechPermission = await SpeechTranscriber.requestPermissions();
      const recordingPermission = await AudioModule.requestRecordingPermissionsAsync();
      if (speechPermission === 'authorized' && recordingPermission.granted) {
        // Set audio mode for recording
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        setPermissionsGranted(true);
        Alert.alert('Permissions Granted', 'All permissions are now available.');
      } else {
        Alert.alert('Permissions Required', 'Speech and recording permissions are needed.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const handleStartTranscription = async () => {
    if (!permissionsGranted) {
      await requestAllPermissions();
      return;
    }
    try {
      setIsTranscribing(true);
      await SpeechTranscriber.recordRealTimeAndTranscribe();
    } catch (err) {
      Alert.alert('Error', 'Failed to start transcription');
      setIsTranscribing(false);
    }
  };

  const handleStopTranscription = () => {
    SpeechTranscriber.stopListening();
    setIsTranscribing(false);
  };

  const startRecording = async () => {
    if (!permissionsGranted) {
      await requestAllPermissions();
      return;
    }
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        setRecordedUri(audioRecorder.uri);
        Alert.alert('Recording Complete', `Audio saved at: ${audioRecorder.uri}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const transcribeWithSF = async () => {
    if (!recordedUri) {
      Alert.alert('No Recording', 'Please record audio first.');
      return;
    }
    try {
      const transcription = await SpeechTranscriber.transcribeAudioWithSFRecognizer(recordedUri);
      setSfTranscription(transcription);
    } catch (err) {
      Alert.alert('Error', 'Failed to transcribe with SF Recognizer');
    }
  };

  const transcribeWithAnalyzer = async () => {
    if (!recordedUri) {
      Alert.alert('No Recording', 'Please record audio first.');
      return;
    }
    if (!SpeechTranscriber.isAnalyzerAvailable()) {
      Alert.alert('Not Available', 'SpeechAnalyzer is not available on this device.');
      return;
    }
    try {
      const transcription = await SpeechTranscriber.transcribeAudioWithAnalyzer(recordedUri);
      setAnalyzerTranscription(transcription);
    } catch (err) {
      Alert.alert('Error', 'Failed to transcribe with Analyzer');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Speech Transcriber Demo</Text>

      {!permissionsGranted && (
        <TouchableOpacity onPress={requestAllPermissions} style={[styles.button, styles.permissionButton]}>
          <Ionicons name="key" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Request Permissions</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Realtime Transcription</Text>
      <TouchableOpacity
        onPress={handleStartTranscription}
        disabled={isTranscribing}
        style={[styles.button, styles.recordButton, isTranscribing && styles.disabled]}
      >
        <Ionicons name="mic" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Start Realtime Transcription</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStopTranscription}
        disabled={!isTranscribing}
        style={[styles.button, styles.stopButton, !isTranscribing && styles.disabled]}
      >
        <Ionicons name="stop-circle" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Stop Realtime Transcription</Text>
      </TouchableOpacity>

      {isTranscribing && (
        <View style={styles.recordingIndicator}>
          <Ionicons name="radio-button-on" size={20} color="#dc3545" />
          <Text style={styles.recordingText}>Transcribing...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Realtime Error: {error}</Text>
        </View>
      )}

      {text && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Realtime Transcription:</Text>
          <Text style={styles.transcriptionText}>{text}</Text>
          {isFinal && <Text style={styles.finalText}>Final!</Text>}
        </View>
      )}

      <Text style={styles.sectionTitle}>File Transcription</Text>
      <TouchableOpacity onPress={startRecording} style={[styles.button, styles.recordButton]}>
        <Ionicons name="mic-circle" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Start Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={stopRecording} style={[styles.button, styles.stopButton]}>
        <Ionicons name="stop-circle" size={24} color="#FFF" />
        <Text style={styles.buttonText}>Stop Recording</Text>
      </TouchableOpacity>

      {recorderState.isRecording && (
        <View style={styles.recordingIndicator}>
          <Ionicons name="radio-button-on" size={20} color="#dc3545" />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}

      {recordedUri && (
        <>
          <TouchableOpacity onPress={transcribeWithSF} style={[styles.button, styles.transcribeButton]}>
            <Ionicons name="document-text" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Transcribe with SF Recognizer</Text>
          </TouchableOpacity>

          {SpeechTranscriber.isAnalyzerAvailable() && (
            <TouchableOpacity onPress={transcribeWithAnalyzer} style={[styles.button, styles.transcribeButton]}>
              <Ionicons name="document-text-outline" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Transcribe with Analyzer</Text>
            </TouchableOpacity>
          )}

          {sfTranscription && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionTitle}>SF Recognizer Result:</Text>
              <Text style={styles.transcriptionText}>{sfTranscription}</Text>
            </View>
          )}

          {analyzerTranscription && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionTitle}>Analyzer Result:</Text>
              <Text style={styles.transcriptionText}>{analyzerTranscription}</Text>
            </View>
          )}
        </>
      )}

      {!isTranscribing && !text && !recordedUri && (
        <Text style={styles.hintText}>
          Request permissions, then try realtime transcription or record audio for file transcription.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionButton: {
    backgroundColor: '#6c757d',
  },
  recordButton: {
    backgroundColor: '#007bff',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  transcribeButton: {
    backgroundColor: '#28a745',
  },
  disabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingText: {
    fontSize: 16,
    color: '#dc3545',
    marginLeft: 10,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  errorText: {
    fontSize: 16,
    color: '#721c24',
  },
  transcriptionContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  finalText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
    marginTop: 10,
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default App;