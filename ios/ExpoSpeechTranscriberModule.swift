import ExpoModulesCore
import Speech
import AVFoundation

public class ExpoSpeechTranscriberModule: Module {
  private var audioEngine = AVAudioEngine()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var startedListening = false
    
  public func definition() -> ModuleDefinition {
    Name("ExpoSpeechTranscriber")
    
    Events("onTranscriptionProgress", "onTranscriptionError")
    
    // expose realtime recording/transcription
    AsyncFunction("recordRealTimeAndTranscribe") { () async -> Void in
     await self.recordRealTimeAndTranscribe()
    }
    
    // Method 2: Transcribe from URL using SFSpeechRecognizer (iOS 13+)
    AsyncFunction("transcribeAudioWithSFRecognizer") { (audioFilePath: String) async throws -> String in
      
      let url: URL
      if audioFilePath.hasPrefix("file://") {
        url = URL(string: audioFilePath)!
      } else {
        url = URL(fileURLWithPath: audioFilePath)
      }
      
      let transcription = await self.transcribeAudio(url: url)
      return transcription
    }
    
    // Method 3: Transcribe from URL using SpeechAnalyzer (iOS 26+)
    AsyncFunction("transcribeAudioWithAnalyzer") { (audioFilePath: String) async throws -> String in
      
      if #available(iOS 26.0, *) {
        let url: URL
        if audioFilePath.hasPrefix("file://") {
          url = URL(string: audioFilePath)!
        } else {
          url = URL(fileURLWithPath: audioFilePath)
        }
        
        let transcription = try await self.transcribeAudioWithAnalyzer(url: url)
        return transcription
      } else {
        throw NSError(domain: "ExpoSpeechTranscriber", code: 501,
                     userInfo: [NSLocalizedDescriptionKey: "SpeechAnalyzer requires iOS 26.0 or later"])
      }
    }
    
    AsyncFunction("requestPermissions") { () async -> String in
      return await self.requestTranscribePermissions()
    }
      
    Function("stopListening"){ () -> Void in
          return self.stopListening()
    }
    Function("isAnalyzerAvailable") { () -> Bool in
      if #available(iOS 26.0, *) {
        return true
      }
      return false
    }
  }
  
  // MARK: - Private Implementation Methods
  
  // startRecordingAndTranscription using SFSpeechRecognizer
  private func recordRealTimeAndTranscribe() async -> Void  {
    let speechRecognizer = SFSpeechRecognizer()!
    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    guard let recognitionRequest = recognitionRequest else {
      self.sendEvent("onTranscriptionError", ["message": "Unable to create recognition request"])
      return
    }
    recognitionRequest.shouldReportPartialResults = true

    let inputNode = audioEngine.inputNode
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.removeTap(onBus: 0)

    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, when in
      recognitionRequest.append(buffer)
    }

    audioEngine.prepare()
    do {
      try audioEngine.start()
      startedListening = true
    } catch {
      self.sendEvent("onTranscriptionError", ["message": error.localizedDescription])
      return
    }

    recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
      if let error = error {
        self.stopListening()
        self.sendEvent("onTranscriptionError", ["message": error.localizedDescription])
        return
      }

      guard let result = result else {
        return
      }

      let recognizedText = result.bestTranscription.formattedString
      self.sendEvent(
        "onTranscriptionProgress",
        ["text": recognizedText, "isFinal": result.isFinal]
      )

      if result.isFinal {
        self.stopListening()
      }
    }
  }

  private func stopListening() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        //recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
  }


    
  
// Implemetation for URL transcription with SFSpeechRecognizer
  private func transcribeAudio(url: URL) async -> String {
    
    guard FileManager.default.fileExists(atPath: url.path) else {
      let err = "Error: Audio file not found at \(url.path)"
      return err
    }
    
    return await withCheckedContinuation { continuation in
      guard let recognizer = SFSpeechRecognizer() else {
        let err = "Error: Speech recognizer not available for current locale"
        continuation.resume(returning: err)
        return
      }
      
      guard recognizer.isAvailable else {
        let err = "Error: Speech recognizer not available at this time"
        continuation.resume(returning: err)
        return
      }
      
      let request = SFSpeechURLRecognitionRequest(url: url)
      request.shouldReportPartialResults = false
      recognizer.recognitionTask(with: request) { (result, error) in
        if let error = error {
          let errorMsg = "Error: \(error.localizedDescription)"
          continuation.resume(returning: errorMsg)
          return
        }
        
        guard let result = result else {
          let errorMsg = "Error: No transcription available"
          continuation.resume(returning: errorMsg)
          return
        }
        
        if result.isFinal {
          let text = result.bestTranscription.formattedString
          let finalResult = text.isEmpty ? "No speech detected" : text
          continuation.resume(returning: finalResult)
        }
      }
    }
  }
  
  // Implementation for URL transcription with SpeechAnalyzer (iOS 26+)
  @available(iOS 26.0, *)
  private func transcribeAudioWithAnalyzer(url: URL) async throws -> String {
    
    guard FileManager.default.fileExists(atPath: url.path) else {
      throw NSError(domain: "ExpoSpeechTranscriber", code: 404,
                   userInfo: [NSLocalizedDescriptionKey: "Audio file not found at \(url.path)"])
    }
    
    let locale = Locale(identifier: "en_US")
    
    guard await isLocaleSupported(locale: locale) else {
      throw NSError(domain: "ExpoSpeechTranscriber", code: 400,
                   userInfo: [NSLocalizedDescriptionKey: "English locale not supported"])
    }
    
    let transcriber = SpeechTranscriber(
      locale: locale,
      transcriptionOptions: [],
      reportingOptions: [.volatileResults],
      attributeOptions: [.audioTimeRange]
    )
    
    try await ensureModel(transcriber: transcriber, locale: locale)
    
    let analyzer = SpeechAnalyzer(modules: [transcriber])
    
    let audioFile = try AVAudioFile(forReading: url)
    if let lastSample = try await analyzer.analyzeSequence(from: audioFile) {
      try await analyzer.finalizeAndFinish(through: lastSample)
    } else {
      await analyzer.cancelAndFinishNow()
    }
    
    var finalText = ""
    for try await recResponse in transcriber.results {
      if recResponse.isFinal {
        finalText += String(recResponse.text.characters)
      }
    }
    
    let result = finalText.isEmpty ? "No speech detected" : finalText
    return result
  }
  
  @available(iOS 26.0, *)
  private func isLocaleSupported(locale: Locale) async -> Bool {
    guard SpeechTranscriber.isAvailable else { return false }
    let supported = await DictationTranscriber.supportedLocales
    return supported.map { $0.identifier(.bcp47) }.contains(locale.identifier(.bcp47))
  }
  
  @available(iOS 26.0, *)
  private func isLocaleInstalled(locale: Locale) async -> Bool {
    let installed = await Set(SpeechTranscriber.installedLocales)
    return installed.map { $0.identifier(.bcp47) }.contains(locale.identifier(.bcp47))
  }
  
  @available(iOS 26.0, *)
  private func ensureModel(transcriber: SpeechTranscriber, locale: Locale) async throws {
    guard await isLocaleSupported(locale: locale) else {
      throw NSError(domain: "ExpoSpeechTranscriber", code: 400,
                   userInfo: [NSLocalizedDescriptionKey: "Locale not supported"])
    }
    
    if await isLocaleInstalled(locale: locale) {
      return
    } else {
      try await downloadModelIfNeeded(for: transcriber)
    }
  }
  
  @available(iOS 26.0, *)
  private func downloadModelIfNeeded(for module: SpeechTranscriber) async throws {
    if let downloader = try await AssetInventory.assetInstallationRequest(supporting: [module]) {
      try await downloader.downloadAndInstall()
    }
  }
  
  private func requestTranscribePermissions() async -> String {
    return await withCheckedContinuation { continuation in
      SFSpeechRecognizer.requestAuthorization { authStatus in
        let result: String
        switch authStatus {
        case .authorized:
          result = "authorized"
        case .denied:
          result = "denied"
        case .restricted:
          result = "restricted"
        case .notDetermined:
          result = "notDetermined"
        @unknown default:
          result = "unknown"
        }
        continuation.resume(returning: result)
      }
    }
  }
}

