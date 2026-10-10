import Foundation

/// VoiceBridge REST client — private multilingual voice threads.
public struct VoiceBridgeClient: Sendable {
  public var apiKey: String
  public var baseURL: URL
  public var session: URLSession
  /// Maps to `X-VoiceBridge-Actor-Id` (required for API-key / test actors).
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

  public func catalog() async throws -> [String: Any] {
    try await requestJSON(path: "/v1/voicebridge/catalog", method: "GET", json: nil)
  }

  public func peekInvite(token: String) async throws -> [String: Any] {
    try await requestJSON(path: "/v1/voicebridge/invites/\(enc(token))", method: "GET", json: nil)
  }

  public func listThreads() async throws -> [String: Any] {
    try await requestJSON(path: "/v1/voicebridge/threads", method: "GET", json: nil)
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
    return try await requestJSON(path: "/v1/voicebridge/threads", method: "POST", json: body)
  }

  public func getThread(threadId: String) async throws -> [String: Any] {
    try await requestJSON(path: "/v1/voicebridge/threads/\(enc(threadId))", method: "GET", json: nil)
  }

  public func createInvite(threadId: String, expiresInHours: Int? = nil) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    return try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/invites",
      method: "POST",
      json: body
    )
  }

  public func join(
    threadId: String,
    token: String,
    language: String,
    variety: String? = nil,
    consents: [[String: String]] = [["purpose": "processing", "decision": "granted"]]
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "token": token,
      "language": language,
      "consents": consents,
    ]
    if let variety { body["variety"] = variety }
    return try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/join",
      method: "POST",
      json: body
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
    return try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/members/me",
      method: "PATCH",
      json: body
    )
  }

  public func issueUploadAuth(threadId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/uploads",
      method: "POST",
      json: [:]
    )
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
    return try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/messages",
      method: "POST",
      json: body
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
    return try await multipart(
      path: "/v1/voicebridge/threads/\(enc(threadId))/messages",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio
    )
  }

  public func updateDraft(
    messageId: String,
    reviewedTranscript: String,
    expectedDraftRevisionId: String
  ) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/draft",
      method: "PATCH",
      json: [
        "reviewedTranscript": reviewedTranscript,
        "expectedDraftRevisionId": expectedDraftRevisionId,
      ]
    )
  }

  public func publishMessage(
    messageId: String,
    expectedDraftRevisionId: String,
    reviewedTranscript: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["expectedDraftRevisionId": expectedDraftRevisionId]
    if let reviewedTranscript { body["reviewedTranscript"] = reviewedTranscript }
    return try await requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/publish",
      method: "POST",
      json: body
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
    return try await requestJSON(
      path: "/v1/voicebridge/messages/\(enc(messageId))/corrections",
      method: "POST",
      json: body
    )
  }

  public func acknowledgeRevision(revisionId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/voicebridge/revisions/\(enc(revisionId))/acknowledgments",
      method: "POST",
      json: [:]
    )
  }

  public func recordPlayback(revisionId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/voicebridge/revisions/\(enc(revisionId))/playback",
      method: "POST",
      json: [:]
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
    return try await requestJSON(
      path: "/v1/voicebridge/threads/\(enc(threadId))/deal-drafts",
      method: "POST",
      json: body
    )
  }

  private func enc(_ s: String) -> String {
    s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? s
  }

  private func requestJSON(path: String, method: String, json: [String: Any]?) async throws -> [String: Any] {
    let (data, response) = try await send(path: path, method: method, json: json, multipart: nil)
    return try Self.decodeJSON(data: data, response: response)
  }

  private func multipart(
    path: String,
    fields: [String: String],
    fileField: String,
    filename: String,
    mimeType: String,
    fileData: Data
  ) async throws -> [String: Any] {
    let boundary = "LugemiVB\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
    var body = Data()
    for (k, v) in fields {
      body.append("--\(boundary)\r\n".data(using: .utf8)!)
      body.append("Content-Disposition: form-data; name=\"\(k)\"\r\n\r\n".data(using: .utf8)!)
      body.append("\(v)\r\n".data(using: .utf8)!)
    }
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append(
      "Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(filename)\"\r\n"
        .data(using: .utf8)!
    )
    body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
    body.append(fileData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    let (data, response) = try await send(
      path: path,
      method: "POST",
      json: nil,
      multipart: (boundary, body)
    )
    return try Self.decodeJSON(data: data, response: response)
  }

  private func send(
    path: String,
    method: String,
    json: [String: Any]?,
    multipart: (String, Data)?
  ) async throws -> (Data, URLResponse) {
    let root = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard let url = URL(string: root + path) else { throw LugemiError.invalidResponse }
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    if let actorId { request.setValue(actorId, forHTTPHeaderField: "X-VoiceBridge-Actor-Id") }
    if let organizationId { request.setValue(organizationId, forHTTPHeaderField: "X-Lugemi-Organization-Id") }
    if let workspaceId { request.setValue(workspaceId, forHTTPHeaderField: "X-Lugemi-Workspace-Id") }
    if let multipart {
      request.setValue("multipart/form-data; boundary=\(multipart.0)", forHTTPHeaderField: "Content-Type")
      request.httpBody = multipart.1
    } else if let json {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = try JSONSerialization.data(withJSONObject: json)
    } else if method == "POST" || method == "PATCH" {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = Data("{}".utf8)
    }
    return try await session.data(for: request)
  }

  private static func decodeJSON(data: Data, response: URLResponse) throws -> [String: Any] {
    guard let http = response as? HTTPURLResponse else { throw LugemiError.invalidResponse }
    if !(200...299).contains(http.statusCode) {
      throw try decodeError(data: data, status: http.statusCode)
    }
    if data.isEmpty { return [:] }
    let obj = try JSONSerialization.jsonObject(with: data)
    return obj as? [String: Any] ?? [:]
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
