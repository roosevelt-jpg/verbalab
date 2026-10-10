import Foundation

/// Official Swift client for Lugemi speech, translate, VoiceBridge, and DealBridge on iOS / macOS.
/// Same REST contracts as `@lugemi/sdk` — ready for video and mobile apps.
public struct LugemiClient: Sendable {
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

  public var voiceBridge: VoiceBridgeClient {
    VoiceBridgeClient(
      apiKey: apiKey,
      baseURL: baseURL,
      session: session,
      actorId: actorId,
      organizationId: organizationId,
      workspaceId: workspaceId
    )
  }

  public var dealBridge: DealBridgeClient {
    DealBridgeClient(
      apiKey: apiKey,
      baseURL: baseURL,
      session: session,
      actorId: actorId,
      organizationId: organizationId,
      workspaceId: workspaceId
    )
  }

  public struct SpeechResult: Sendable {
    public let audio: Data
    public let mimeType: String
    public let voice: String?
    public let provider: String?
    public let characters: Int?
  }

  public struct TranslateResult: Sendable {
    public let text: String
    public let source: String
    public let characters: Int?
  }

  /// POST /v1/audio/speech — synthesize voice for video/content scripts.
  public func speech(
    text: String,
    voice: String,
    language: String? = nil,
    format: String = "mp3"
  ) async throws -> SpeechResult {
    var body: [String: Any] = ["text": text, "voice": voice, "format": format]
    if let language { body["language"] = language }
    let (data, response) = try await send(path: "/v1/audio/speech", method: "POST", json: body, accept: "*/*")
    guard let http = response as? HTTPURLResponse else {
      throw LugemiError.invalidResponse
    }
    if !(200...299).contains(http.statusCode) {
      throw try Self.decodeError(data: data, status: http.statusCode)
    }
    return SpeechResult(
      audio: data,
      mimeType: http.value(forHTTPHeaderField: "Content-Type") ?? "audio/mpeg",
      voice: http.value(forHTTPHeaderField: "x-lugemi-voice"),
      provider: http.value(forHTTPHeaderField: "x-lugemi-provider"),
      characters: Int(http.value(forHTTPHeaderField: "x-lugemi-characters") ?? "")
    )
  }

  /// POST /v1/translate
  public func translate(
    text: String,
    source: String = "auto",
    target: String
  ) async throws -> TranslateResult {
    let json = try await requestJSON(
      path: "/v1/translate",
      method: "POST",
      json: ["text": text, "source": source, "target": target]
    )
    return TranslateResult(
      text: json["text"] as? String ?? "",
      source: json["source"] as? String ?? source,
      characters: json["characters"] as? Int
    )
  }

  /// GET /v1/languages
  public func languages() async throws -> [[String: Any]] {
    let json = try await requestJSON(path: "/v1/languages", method: "GET", json: nil)
    return json["data"] as? [[String: Any]] ?? []
  }

  /// GET /v1/audio/voices
  public func voices() async throws -> [[String: Any]] {
    let json = try await requestJSON(path: "/v1/audio/voices", method: "GET", json: nil)
    return json["data"] as? [[String: Any]] ?? []
  }

  /// Translate then synthesize — dubbing / video voice line helper.
  public func videoVoiceLine(
    text: String,
    target: String,
    voice: String,
    source: String = "auto"
  ) async throws -> (TranslateResult, SpeechResult) {
    let translated = try await translate(text: text, source: source, target: target)
    let audio = try await speech(text: translated.text, voice: voice, language: target)
    return (translated, audio)
  }

  private func requestJSON(path: String, method: String, json: [String: Any]?) async throws -> [String: Any] {
    let (data, response) = try await send(path: path, method: method, json: json, accept: "application/json")
    guard let http = response as? HTTPURLResponse else { throw LugemiError.invalidResponse }
    if !(200...299).contains(http.statusCode) {
      throw try Self.decodeError(data: data, status: http.statusCode)
    }
    if data.isEmpty { return [:] }
    let obj = try JSONSerialization.jsonObject(with: data)
    return obj as? [String: Any] ?? [:]
  }

  private func send(
    path: String,
    method: String,
    json: [String: Any]?,
    accept: String
  ) async throws -> (Data, URLResponse) {
    let root = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard let url = URL(string: root + path) else { throw LugemiError.invalidResponse }
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(accept, forHTTPHeaderField: "Accept")
    if let json {
      request.httpBody = try JSONSerialization.data(withJSONObject: json)
    }
    return try await session.data(for: request)
  }

  private static func decodeError(data: Data, status: Int) throws -> LugemiError {
    if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       let err = obj["error"] as? [String: Any],
       let message = err["message"] as? String {
      return .api(message: message, code: err["code"] as? String, status: status)
    }
    return .api(message: "Request failed (\(status))", code: nil, status: status)
  }
}

public enum LugemiError: Error, Sendable {
  case invalidResponse
  case api(message: String, code: String?, status: Int)
}
