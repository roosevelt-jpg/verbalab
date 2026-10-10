import Foundation

/// Voice Studio REST client — script → translate → speech → native review → approved export.
public struct VoiceStudioClient: @unchecked Sendable {
  private let http: LugemiHttp

  public init(http: LugemiHttp) {
    self.http = http
  }

  public func capabilities() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voice-studio/workspace/capabilities", method: "GET", json: nil)
  }

  public func engine() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voice-studio/engine", method: "GET", json: nil)
  }

  public func library() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voice-studio/library", method: "GET", json: nil)
  }

  public func listProjects() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voice-studio/workspace/projects", method: "GET", json: nil)
  }

  public func createProject(
    name: String,
    sourceLanguage: String = "en",
    reviewPolicy: String = "independent_reviewer",
    description: String = ""
  ) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voice-studio/workspace/projects",
      method: "POST",
      json: [
        "name": name,
        "sourceLanguage": sourceLanguage,
        "reviewPolicy": reviewPolicy,
        "description": description,
      ]
    )
  }

  public func getProject(projectId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voice-studio/workspace/projects/\(enc(projectId))",
      method: "GET",
      json: nil
    )
  }

  public func importScript(
    projectId: String,
    script: String,
    parentRevisionId: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["script": script]
    if let parentRevisionId { body["parentRevisionId"] = parentRevisionId }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/projects/\(enc(projectId))/scripts",
      method: "POST",
      json: body
    )
  }

  public func createEdition(
    projectId: String,
    languageVariety: String,
    voiceId: String,
    sourceRevisionId: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "languageVariety": languageVariety,
      "voiceId": voiceId,
    ]
    if let sourceRevisionId { body["sourceRevisionId"] = sourceRevisionId }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/projects/\(enc(projectId))/editions",
      method: "POST",
      json: body
    )
  }

  public func translateEdition(
    editionId: String,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/editions/\(enc(editionId))/translations",
      method: "POST",
      json: body
    )
  }

  public func generateEdition(
    editionId: String,
    expectedRevision: Int? = nil,
    segmentIds: [String]? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    if let segmentIds { body["segmentIds"] = segmentIds }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/editions/\(enc(editionId))/generations",
      method: "POST",
      json: body
    )
  }

  public func regenerateSegment(
    editionId: String,
    stableSegmentId: String,
    translatedText: String? = nil,
    expandContext: Bool = false,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "stableSegmentId": stableSegmentId,
      "expandContext": expandContext,
    ]
    if let translatedText { body["translatedText"] = translatedText }
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/editions/\(enc(editionId))/regenerations",
      method: "POST",
      json: body
    )
  }

  public func reviewTake(
    takeId: String,
    decision: String,
    ratings: [String: Int],
    qualifications: [String] = [],
    takeHash: String? = nil,
    pronunciationNotes: String? = nil,
    meaningNotes: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "decision": decision,
      "ratings": ratings,
      "qualifications": qualifications,
    ]
    if let takeHash { body["takeHash"] = takeHash }
    if let pronunciationNotes { body["pronunciationNotes"] = pronunciationNotes }
    if let meaningNotes { body["meaningNotes"] = meaningNotes }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/takes/\(enc(takeId))/reviews",
      method: "POST",
      json: body
    )
  }

  /// Binary audio for a take. Rejects JSON/HTML error bodies.
  public func takeAudio(takeId: String) async throws -> (Data, HTTPURLResponse) {
    let (data, resp) = try await http.requestBytes(
      path: "/v1/voice-studio/workspace/takes/\(enc(takeId))/audio",
      method: "GET",
      json: nil
    )
    try Self.assertAudioPayload(data, contentType: resp.value(forHTTPHeaderField: "Content-Type"))
    return (data, resp)
  }

  public func assembleEdition(
    editionId: String,
    takeIds: [String],
    pauseMs: Int = 180,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["takeIds": takeIds, "pauseMs": pauseMs]
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/editions/\(enc(editionId))/assemblies",
      method: "POST",
      json: body
    )
  }

  public func assemblyAudio(assemblyId: String) async throws -> (Data, HTTPURLResponse) {
    let (data, resp) = try await http.requestBytes(
      path: "/v1/voice-studio/workspace/assemblies/\(enc(assemblyId))/audio",
      method: "GET",
      json: nil
    )
    try Self.assertAudioPayload(data, contentType: resp.value(forHTTPHeaderField: "Content-Type"))
    return (data, resp)
  }

  public func approveRelease(
    assemblyId: String,
    assemblyHash: String,
    expectedEditionRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["assemblyHash": assemblyHash]
    if let expectedEditionRevision { body["expectedEditionRevision"] = expectedEditionRevision }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/assemblies/\(enc(assemblyId))/approvals",
      method: "POST",
      json: body
    )
  }

  public func exportRelease(releaseId: String, format: String = "wav") async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voice-studio/workspace/releases/\(enc(releaseId))/exports",
      method: "POST",
      json: ["format": format]
    )
  }

  public func upsertPronunciation(
    writtenForm: String,
    value: String,
    languageVariety: String,
    scope: String = "tenant",
    projectId: String? = nil,
    status: String = "awaiting_native_review",
    representation: String = "pronunciation_alias",
    notes: String = ""
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "writtenForm": writtenForm,
      "value": value,
      "languageVariety": languageVariety,
      "scope": scope,
      "status": status,
      "representation": representation,
      "notes": notes,
    ]
    if let projectId { body["projectId"] = projectId }
    return try await http.requestJSON(
      path: "/v1/voice-studio/workspace/pronunciations",
      method: "POST",
      json: body
    )
  }

  /// VL-174 single-clip preview (binary).
  public func preview(
    text: String,
    voice: String,
    language: String? = nil,
    format: String = "wav"
  ) async throws -> (Data, HTTPURLResponse) {
    var body: [String: Any] = ["text": text, "voice": voice, "format": format]
    if let language { body["language"] = language }
    let (data, resp) = try await http.requestBytes(
      path: "/v1/voice-studio/preview",
      method: "POST",
      json: body
    )
    try Self.assertAudioPayload(data, contentType: resp.value(forHTTPHeaderField: "Content-Type"))
    return (data, resp)
  }

  private func enc(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }

  private static func assertAudioPayload(_ data: Data, contentType: String?) throws {
    let mime = (contentType ?? "").lowercased()
    if mime.contains("json") || mime.contains("text") || mime.contains("html") {
      throw LugemiError.api(message: "Voice Studio returned a non-audio payload", code: "provider_error", status: 502, requestId: nil)
    }
    if data.count < 64 {
      throw LugemiError.api(message: "Voice Studio audio payload too small", code: "provider_error", status: 502, requestId: nil)
    }
    if let head = String(data: data.prefix(4), encoding: .ascii),
       head.hasPrefix("{") || head.hasPrefix("<") {
      throw LugemiError.api(message: "Voice Studio returned JSON/HTML instead of audio", code: "provider_error", status: 502, requestId: nil)
    }
  }
}
