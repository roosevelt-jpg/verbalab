import Foundation

/// DealBridge REST client — proposed multilingual deal sessions.
public struct DealBridgeClient: @unchecked Sendable {
  private let http: LugemiHttp
  public var actorId: String?
  private let uploader: ResumableUploader

  public init(http: LugemiHttp, actorId: String? = nil, uploader: ResumableUploader? = nil) {
    self.http = http
    self.actorId = actorId
    self.uploader = uploader ?? ResumableUploader(http: http)
  }

  private var headers: [String: String] {
    guard let actorId else { return [:] }
    return ["X-DealBridge-Actor-Id": actorId]
  }

  public func catalog() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/dealbridge/catalog", method: "GET", json: nil, extraHeaders: headers)
  }

  public func peekInvite(token: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/dealbridge/invites/\(enc(token))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func listSessions() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/dealbridge/sessions", method: "GET", json: nil, extraHeaders: headers)
  }

  public func createSession(
    merchantLanguage: String,
    buyerLanguage: String,
    category: String? = nil,
    timeZone: String? = nil,
    expiresInHours: Int? = nil,
    idempotencyKey: String? = nil,
    isDemo: Bool? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "merchantLanguage": merchantLanguage,
      "buyerLanguage": buyerLanguage,
    ]
    if let category { body["category"] = category }
    if let timeZone { body["timeZone"] = timeZone }
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    if let idempotencyKey { body["idempotencyKey"] = idempotencyKey }
    if let isDemo { body["isDemo"] = isDemo }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func getSession(sessionId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func createInvite(sessionId: String, expiresInHours: Int? = nil) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/invites",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func join(
    sessionId: String,
    token: String,
    language: String,
    variety: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["token": token, "language": language]
    if let variety { body["variety"] = variety }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/join",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func recordConsent(
    sessionId: String,
    purpose: String,
    decision: String,
    noticeVersion: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["purpose": purpose, "decision": decision]
    if let noticeVersion { body["noticeVersion"] = noticeVersion }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/consents",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func issueUploadAuth(sessionId: String) async throws -> UploadAuth {
    let json = try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns/uploads",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
    return UploadAuth(json: json)
  }

  public func createTextTurn(
    sessionId: String,
    text: String,
    language: String? = nil,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["text": text]
    if let language { body["language"] = language }
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func createAudioTurn(
    sessionId: String,
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    if let expectedRevision { fields["expectedRevision"] = String(expectedRevision) }
    return try await http.multipartJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio,
      extraHeaders: headers
    )
  }

  public func createAudioTurnResumable(
    sessionId: String,
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil,
    expectedRevision: Int? = nil,
    onProgress: (@Sendable (UploadProgress) -> Void)? = nil
  ) async throws -> [String: Any] {
    let auth = try await issueUploadAuth(sessionId: sessionId)
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    if let expectedRevision { fields["expectedRevision"] = String(expectedRevision) }
    return try await uploader.uploadMultipart(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio,
      maxBytes: auth.maxBytes > 0 ? auth.maxBytes : nil,
      extraHeaders: headers,
      onProgress: onProgress
    )
  }

  public func correctTurn(
    sessionId: String,
    turnId: String,
    text: String,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["text": text]
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns/\(enc(turnId))",
      method: "PATCH",
      json: body,
      extraHeaders: headers
    )
  }

  public func proposeSnapshot(
    sessionId: String,
    expectedRevision: Int? = nil,
    overrides: [String: Any]? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    if let overrides { body["overrides"] = overrides }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/snapshots",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func submitCheck(
    sessionId: String,
    snapshotId: String,
    presentationHash: String,
    responseText: String,
    responseTurnId: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "snapshotId": snapshotId,
      "presentationHash": presentationHash,
      "responseText": responseText,
    ]
    if let responseTurnId { body["responseTurnId"] = responseTurnId }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/checks",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func confirm(
    sessionId: String,
    snapshotId: String,
    contentHash: String,
    presentationHash: String,
    action: String,
    idempotencyKey: String
  ) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/confirmations",
      method: "POST",
      json: [
        "snapshotId": snapshotId,
        "contentHash": contentHash,
        "presentationHash": presentationHash,
        "action": action,
        "idempotencyKey": idempotencyKey,
      ],
      extraHeaders: headers
    )
  }

  public func getReceipt(sessionId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/receipt",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func startRevision(
    sessionId: String,
    reason: String? = nil,
    expectedRevision: Int? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let reason { body["reason"] = reason }
    if let expectedRevision { body["expectedRevision"] = expectedRevision }
    return try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/revisions",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func requestDeletion(sessionId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))",
      method: "DELETE",
      json: nil,
      extraHeaders: headers
    )
  }

  public func listEvents(sessionId: String, cursor: String? = nil) async throws -> [String: Any] {
    var path = "/v1/dealbridge/sessions/\(enc(sessionId))/events"
    if let cursor { path += "?cursor=\(enc(cursor))" }
    return try await http.requestJSON(path: path, method: "GET", json: nil, extraHeaders: headers)
  }

  private func enc(_ s: String) -> String {
    s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? s
  }
}
