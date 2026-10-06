import Foundation

/// Swift stub for the Lugemi iOS SDK — mirrors @lugemi/sdk REST contracts.
public struct LugemiClient: Sendable {
  public var apiKey: String
  public var baseURL: URL

  public init(apiKey: String, baseURL: URL = URL(string: "https://api.lugemi.com")!) {
    self.apiKey = apiKey
    self.baseURL = baseURL
  }

  public func speech(text: String, voice: String, language: String? = nil) async throws -> Data {
    // POST /v1/audio/speech — Authorization: Bearer lg_live_…
    throw LugemiError.notImplemented("speech")
  }

  public func translate(text: String, source: String = "auto", target: String) async throws -> [String: Any] {
    throw LugemiError.notImplemented("translate")
  }

  public func languages() async throws -> [[String: Any]] {
    throw LugemiError.notImplemented("languages")
  }

  public func simulateVoice(text: String) async throws -> [String: Any] {
    throw LugemiError.notImplemented("voice.simulate")
  }
}

public enum LugemiError: Error {
  case notImplemented(String)
}
