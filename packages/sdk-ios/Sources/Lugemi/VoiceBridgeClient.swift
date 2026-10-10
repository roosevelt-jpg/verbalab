import Foundation

/// VoiceBridge REST client — private multilingual voice threads.
public struct VoiceBridgeClient: @unchecked Sendable {
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
    return ["X-VoiceBridge-Actor-Id": actorId]
  }

  public func catalog() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voicebridge/catalog", method: "GET", json: nil, extraHeaders: headers)
  }

  public func peekInvite(token: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voicebridge/invites/\(enc(token))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func listThreads() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/voicebridge/threads", method: "GET", json: nil, extraHeaders: headers)
  }

  public func createThread(
    title: String,
    language: String,
    category: String? = nil,
    variety: String? = nil,
    corridor: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["title": title, "language": language]
    if let category { body["category"] = category }
    if let variety { body["variety"] = variety }
    if let corridor { body["corridor"] = corridor }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func getThread(threadId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func createInvite(threadId: String, expiresInHours: Int? = nil) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/invites",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func join(
    threadId: String,
    token: String,
    language: String,
    variety: String? = nil,
    consents: [[String: String]] = [["purpose": "processing", "decision": "granted"]]
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["token": token, "language": language, "consents": consents]
    if let variety { body["variety"] = variety }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/join",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func patchMemberMe(
    threadId: String,
    language: String? = nil,
    variety: String? = nil,
    notificationsEnabled: Bool? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let language { body["language"] = language }
    if let variety { body["variety"] = variety }
    if let notificationsEnabled { body["notificationsEnabled"] = notificationsEnabled }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/members/me",
      method: "PATCH",
      json: body,
      extraHeaders: headers
    )
  }

  public func issueUploadAuth(threadId: String) async throws -> UploadAuth {
    let json = try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/uploads",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
    return UploadAuth(json: json)
  }

  public func createTextDraft(
    threadId: String,
    text: String,
    language: String? = nil,
    idempotencyKey: String? = nil,
    replyToMessageId: String? = nil,
    replyToRevisionId: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["text": text]
    if let language { body["language"] = language }
    if let idempotencyKey { body["idempotencyKey"] = idempotencyKey }
    if let replyToMessageId { body["replyToMessageId"] = replyToMessageId }
    if let replyToRevisionId { body["replyToRevisionId"] = replyToRevisionId }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/messages",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func createAudioDraft(
    threadId: String,
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil,
    idempotencyKey: String? = nil
  ) async throws -> [String: Any] {
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    if let idempotencyKey { fields["idempotencyKey"] = idempotencyKey }
    return try await http.multipartJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/messages",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio,
      extraHeaders: headers
    )
  }

  public func createAudioDraftResumable(
    threadId: String,
    audio: Data,
    filename: String,
    mimeType: String,
    language: String? = nil,
    idempotencyKey: String? = nil,
    onProgress: (@Sendable (UploadProgress) -> Void)? = nil
  ) async throws -> [String: Any] {
    let auth = try await issueUploadAuth(threadId: threadId)
    if !auth.allowedMimeTypes.isEmpty, !auth.allowedMimeTypes.contains(mimeType) {
      throw LugemiError.api(
        message: "Unsupported mime type \(mimeType)",
        code: "validation_error",
        status: 400,
        requestId: nil
      )
    }
    var fields: [String: String] = [:]
    if let language { fields["language"] = language }
    if let idempotencyKey { fields["idempotencyKey"] = idempotencyKey }
    let path = auth.uploadPath.isEmpty
      ? "/v1/voicebridge/threads/\(enc(threadId))/messages"
      : auth.uploadPath
    return try await uploader.uploadMultipart(
      path: path,
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio,
      maxBytes: auth.maxBytes,
      extraHeaders: headers,
      onProgress: onProgress
    )
  }

  public func updateDraft(
    messageId: String,
    reviewedTranscript: String,
    expectedDraftRevisionId: String
  ) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/draft",
      method: "PATCH",
      json: [
        "reviewedTranscript": reviewedTranscript,
        "expectedDraftRevisionId": expectedDraftRevisionId,
      ],
      extraHeaders: headers
    )
  }

  public func publishMessage(
    messageId: String,
    expectedDraftRevisionId: String,
    reviewedTranscript: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["expectedDraftRevisionId": expectedDraftRevisionId]
    if let reviewedTranscript { body["reviewedTranscript"] = reviewedTranscript }
    return try await http.requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/publish",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func correctMessage(
    messageId: String,
    expectedActiveRevisionId: String,
    reviewedTranscript: String,
    correctionReason: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "expectedActiveRevisionId": expectedActiveRevisionId,
      "reviewedTranscript": reviewedTranscript,
    ]
    if let correctionReason { body["correctionReason"] = correctionReason }
    return try await http.requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/corrections",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func acknowledgeRevision(revisionId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voicebridge/revisions/\(enc(revisionId))/acknowledgments",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func recordPlayback(revisionId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/voicebridge/revisions/\(enc(revisionId))/playback",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func createDealDraft(
    threadId: String,
    selectedRevisionIds: [String],
    partyAUserId: String,
    partyBUserId: String,
    category: String? = nil,
    idempotencyKey: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "selectedRevisionIds": selectedRevisionIds,
      "partyAUserId": partyAUserId,
      "partyBUserId": partyBUserId,
    ]
    if let category { body["category"] = category }
    if let idempotencyKey { body["idempotencyKey"] = idempotencyKey }
    return try await http.requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/deal-drafts",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  private func enc(_ s: String) -> String {
    s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? s
  }
}
