import Foundation

/// Official Swift client for Lugemi on iOS / macOS.
public struct LugemiClient: @unchecked Sendable {
  public var apiKey: String
  public var baseURL: URL
  public var session: URLSession
  public var actorId: String?
  public var organizationId: String?
  public var workspaceId: String?

  public init(
    apiKey: String,
    baseURL: URL = URL(string: "https://api.lugemi.com")!,
    session: URLSession = .shared,
    actorId: String? = nil,
    organizationId: String? = nil,
    workspaceId: String? = nil
  ) {
    self.apiKey = apiKey
    self.baseURL = baseURL
    self.session = session
    self.actorId = actorId
    self.organizationId = organizationId
    self.workspaceId = workspaceId
  }

  private var http: LugemiHttp {
    LugemiHttp(
      apiKey: apiKey,
      baseURL: baseURL,
      session: session,
      organizationId: organizationId,
      workspaceId: workspaceId
    )
  }

  public var uploads: ResumableUploader { ResumableUploader(http: http) }

  public var voiceBridge: VoiceBridgeClient {
    VoiceBridgeClient(
      http: http,
      actorId: actorId,
      uploader: uploads
    )
  }

  public var dealBridge: DealBridgeClient {
    DealBridgeClient(
      http: http,
      actorId: actorId,
      uploader: uploads
    )
  }

  public func speech(_ request: SpeechRequest) async throws -> SpeechResult {
    var body: [String: Any] = [
      "text": request.text,
      "voice": request.voice,
      "format": request.format,
    ]
    if let language = request.language { body["language"] = language }
    let (data, httpResp) = try await http.requestBytes(
      path: "/v1/audio/speech",
      method: "POST",
      json: body
    )
    return SpeechResult(
      audio: data,
      mimeType: httpResp.value(forHTTPHeaderField: "Content-Type") ?? "audio/mpeg",
      voice: httpResp.value(forHTTPHeaderField: "x-lugemi-voice"),
      provider: httpResp.value(forHTTPHeaderField: "x-lugemi-provider"),
      characters: Int(httpResp.value(forHTTPHeaderField: "x-lugemi-characters") ?? "")
    )
  }

  /// Incremental read of the speech response body (chunked delivery to the callback).
  public func speechStream(
    _ request: SpeechRequest,
    onChunk: @Sendable (Data) -> Void
  ) async throws -> SpeechResult {
    let result = try await speech(request)
    // URLSession returns the full body; deliver in paced chunks for player buffering.
    let chunkSize = 16 * 1024
    var offset = 0
    while offset < result.audio.count {
      let end = min(offset + chunkSize, result.audio.count)
      onChunk(result.audio.subdata(in: offset..<end))
      offset = end
    }
    return result
  }

  public func translate(_ request: TranslateRequest) async throws -> TranslateResult {
    let json = try await http.requestJSON(
      path: "/v1/translate",
      method: "POST",
      json: ["text": request.text, "source": request.source, "target": request.target]
    )
    return TranslateResult(json: json, fallbackSource: request.source, fallbackTarget: request.target)
  }

  public func translateStream(_ request: TranslateRequest) -> AsyncThrowingStream<TranslateStreamEvent, Error> {
    let stream = http.streamSSE(
      path: "/v1/translate/stream",
      json: ["text": request.text, "source": request.source, "target": request.target]
    )
    return AsyncThrowingStream { continuation in
      Task {
        do {
          for try await obj in stream {
            continuation.yield(TranslateStreamEvent(json: obj))
          }
          continuation.finish()
        } catch {
          continuation.finish(throwing: error)
        }
      }
    }
  }

  public func detect(text: String) async throws -> DetectResult {
    let json = try await http.requestJSON(
      path: "/v1/detect",
      method: "POST",
      json: ["text": text]
    )
    return DetectResult(json: json)
  }

  public func transcribe(
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil
  ) async throws -> TranscribeResult {
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    let json = try await http.multipartJSON(
      path: "/v1/audio/transcriptions",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio
    )
    return TranscribeResult(json: json)
  }

  public func recognizeSpeech(
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil,
    industryPacks: [String]? = nil,
    vocabulary: [String]? = nil
  ) async throws -> SpeechRecognizeResult {
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    if let industryPacks, !industryPacks.isEmpty {
      fields["industryPacks"] = industryPacks.joined(separator: ",")
    }
    if let vocabulary, !vocabulary.isEmpty {
      fields["vocabulary"] = vocabulary.joined(separator: ",")
    }
    let json = try await http.multipartJSON(
      path: "/v1/speech/recognize",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio
    )
    return SpeechRecognizeResult(json: json)
  }

  public func languages() async throws -> [[String: Any]] {
    let json = try await http.requestJSON(path: "/v1/languages", method: "GET", json: nil)
    return json["data"] as? [[String: Any]] ?? []
  }

  public func voices() async throws -> [[String: Any]] {
    let json = try await http.requestJSON(path: "/v1/audio/voices", method: "GET", json: nil)
    return json["data"] as? [[String: Any]] ?? []
  }

  public func videoVoiceLine(
    text: String,
    target: String,
    voice: String,
    source: String = "auto"
  ) async throws -> (TranslateResult, SpeechResult) {
    let translated = try await translate(TranslateRequest(text: text, source: source, target: target))
    let audio = try await speech(SpeechRequest(text: translated.text, voice: voice, language: target))
    return (translated, audio)
  }
}
