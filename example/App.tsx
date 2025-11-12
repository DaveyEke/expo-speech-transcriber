import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import * as SpeechTranscriber from "expo-speech-transcriber"

const App = () => {
  const [transcription, setTranscription] = useState('');
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission denied', 'Microphone access is required.');
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setTranscription('Transcribing...');
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      // Simulate transcription (replace with actual API call or library)
      const result =  await SpeechTranscriber.transcribeAudio(uri || "")
        setTranscription(result || "");
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const handleRecordPress = async () => {
    if (recorderState?.isRecording) {
      await stopRecordingAndTranscribe();
    } else {
      await startRecording();
    }
  };

  const isRecording = recorderState?.isRecording ?? false;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech Transcriber</Text>
      <TouchableOpacity
        onPress={handleRecordPress}
        style={[styles.button, isRecording && styles.recordingButton]}
      >
        <Ionicons
          name={isRecording ? 'mic' : 'mic-outline'}
          size={28}
          color="#FFF"
        />
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.statusText}>
        {isRecording
          ? `Recording... ${recorderState?.durationMillis ?? 0}ms`
          : 'Tap to start recording'}
      </Text>
      {transcription ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Transcription:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
  },
  recordingButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  transcriptionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#666',
  },
});

export default App;