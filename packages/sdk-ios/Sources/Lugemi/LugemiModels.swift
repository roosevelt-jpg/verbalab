import Foundation

public struct SpeechRequest: Sendable {
  public var text: String
  public var voice: String
  public var language: String?
  public var format: String

  public init(text: String, voice: String, language: String? = nil, format: String = "mp3") {
    self.text = text
    self.voice = voice
    self.language = language
    self.format = format
  }
}

public struct SpeechResult: Sendable {
  public let audio: Data
  public let mimeType: String
  public let voice: String?
  public let provider: String?
  public let characters: Int?
}

public struct TranslateRequest: Sendable {
  public var text: String
  public var source: String
  public var target: String

  public init(text: String, source: String = "auto", target: String) {
    self.text = text
    self.source = source
    self.target = target
  }
}

public struct DetectResult: Sendable {
  public let language: String
  public let confidence: Double
  public let provider: String
  public let characters: Int?

  public init(json: [String: Any]) {
    language = json["language"] as? String ?? ""
    confidence = json["confidence"] as? Double ?? 0
    provider = json["provider"] as? String ?? ""
    characters = json["characters"] as? Int
  }
}

public struct TranslateResult: Sendable {
  public let text: String
  public let source: String
  public let target: String?
  public let provider: String?
  public let characters: Int?
  public let detection: DetectResult?

  public init(json: [String: Any], fallbackSource: String = "auto", fallbackTarget: String? = nil) {
    text = json["text"] as? String ?? ""
    source = json["source"] as? String ?? fallbackSource
    target = json["target"] as? String ?? fallbackTarget
    provider = json["provider"] as? String
    characters = json["characters"] as? Int
    if let d = json["detection"] as? [String: Any] {
      detection = DetectResult(json: d)
    } else {
      detection = nil
    }
  }
}

public enum TranslateStreamEvent: Sendable {
  case start(chunkCount: Int, source: String, target: String)
  case chunk(index: Int, text: String, characters: Int?, provider: String?, tmHit: Bool?)
  case done(text: String, chunkCount: Int)
  case error(message: String)

  public init(json: [String: Any]) {
    switch json["event"] as? String {
    case "start":
      self = .start(
        chunkCount: json["chunkCount"] as? Int ?? 0,
        source: json["source"] as? String ?? "",
        target: json["target"] as? String ?? ""
      )
    case "chunk":
      self = .chunk(
        index: json["index"] as? Int ?? 0,
        text: json["text"] as? String ?? "",
        characters: json["characters"] as? Int,
        provider: json["provider"] as? String,
        tmHit: json["tmHit"] as? Bool
      )
    case "done":
      self = .done(text: json["text"] as? String ?? "", chunkCount: json["chunkCount"] as? Int ?? 0)
    case "error":
      self = .error(message: json["message"] as? String ?? "stream error")
    default:
      self = .error(message: "Unknown stream event")
    }
  }
}

public struct TranscribeResult: Sendable {
  public let text: String
  public let language: String?
  public let durationSeconds: Double?
  public let durationMinutes: Double?
  public let provider: String?
  public let raw: [String: Any]

  public init(json: [String: Any]) {
    text = json["text"] as? String ?? ""
    language = json["language"] as? String
    durationSeconds = json["durationSeconds"] as? Double
    durationMinutes = json["durationMinutes"] as? Double
    provider = json["provider"] as? String
    raw = json
  }
}

public struct SpeechRecognizeSegment: Sendable {
  public let id: Int
  public let start: Double
  public let end: Double
  public let text: String
  public let confidence: Double?
}

public struct SpeechRecognizeResult: Sendable {
  public let text: String
  public let language: String?
  public let durationSeconds: Double?
  public let durationMinutes: Double?
  public let provider: String?
  public let confidence: Double?
  public let segments: [SpeechRecognizeSegment]
  public let vocabularyApplied: Bool
  public let industryPacks: [String]
  public let raw: [String: Any]

  public init(json: [String: Any]) {
    text = json["text"] as? String ?? ""
    language = json["language"] as? String
    durationSeconds = json["durationSeconds"] as? Double
    durationMinutes = json["durationMinutes"] as? Double
    provider = json["provider"] as? String
    confidence = json["confidence"] as? Double
    vocabularyApplied = json["vocabularyApplied"] as? Bool ?? false
    industryPacks = json["industryPacks"] as? [String] ?? []
    raw = json
    if let arr = json["segments"] as? [[String: Any]] {
      segments = arr.map {
        SpeechRecognizeSegment(
          id: $0["id"] as? Int ?? 0,
          start: $0["start"] as? Double ?? 0,
          end: $0["end"] as? Double ?? 0,
          text: $0["text"] as? String ?? "",
          confidence: $0["confidence"] as? Double
        )
      }
    } else {
      segments = []
    }
  }
}

public struct UploadAuth: Sendable {
  public let maxBytes: Int64
  public let maxRecordingSeconds: Int?
  public let allowedMimeTypes: [String]
  public let uploadPath: String
  public let expiresAt: String?

  public init(json: [String: Any]) {
    if let n = json["maxBytes"] as? NSNumber {
      maxBytes = n.int64Value
    } else {
      maxBytes = Int64(json["maxBytes"] as? Int ?? 0)
    }
    maxRecordingSeconds = json["maxRecordingSeconds"] as? Int
    allowedMimeTypes = json["allowedMimeTypes"] as? [String] ?? []
    uploadPath = json["uploadPath"] as? String ?? ""
    expiresAt = json["expiresAt"] as? String
  }
}

public struct UploadProgress: Sendable {
  public let bytesSent: Int64
  public let totalBytes: Int64
  public let attempt: Int
  public var fraction: Double {
    totalBytes <= 0 ? 0 : Double(bytesSent) / Double(totalBytes)
  }
}

public enum LugemiError: Error, Sendable {
  case invalidResponse
  case api(message: String, code: String?, status: Int, requestId: String?)

  public var isConflict: Bool {
    if case let .api(_, code, status, _) = self {
      return status == 409 || code == "conflict"
    }
    return false
  }

  public var isFeatureDisabled: Bool {
    if case let .api(_, code, status, _) = self {
      return status == 403 || code == "feature_disabled"
    }
    return false
  }

  public var isAuthError: Bool {
    if case let .api(_, code, status, _) = self {
      return status == 401 || status == 503 || code == "auth_not_configured" || code == "actor_required"
    }
    return false
  }
}
