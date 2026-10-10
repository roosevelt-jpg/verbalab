import Foundation

/// DealBridge REST client — proposed multilingual deal sessions.
public struct DealBridgeClient: Sendable {
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

  public func catalog() async throws -> [String: Any] {
    try await requestJSON(path: "/v1/dealbridge/catalog", method: "GET", json: nil)
  }

  public func peekInvite(token: String) async throws -> [String: Any] {
    try await requestJSON(path: "/v1/dealbridge/invites/\(enc(token))", method: "GET", json: nil)
  }

  public func listSessions() async throws -> [String: Any] {
    try await requestJSON(path: "/v1/dealbridge/sessions", method: "GET", json: nil)
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
    return try await requestJSON(path: "/v1/dealbridge/sessions", method: "POST", json: body)
  }

  public func getSession(sessionId: String) async throws -> [String: Any] {
    try await requestJSON(path: "/v1/dealbridge/sessions/\(enc(sessionId))", method: "GET", json: nil)
  }

  public func createInvite(sessionId: String, expiresInHours: Int? = nil) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/invites",
      method: "POST",
      json: body
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/join",
      method: "POST",
      json: body
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/consents",
      method: "POST",
      json: body
    )
  }

  public func issueUploadAuth(sessionId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns/uploads",
      method: "POST",
      json: [:]
    )
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns",
      method: "POST",
      json: body
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
    return try await multipart(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns",
      fields: fields,
      fileField: "file",
      filename: filename,
      mimeType: mimeType,
      fileData: audio
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/turns/\(enc(turnId))",
      method: "PATCH",
      json: body
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/snapshots",
      method: "POST",
      json: body
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/checks",
      method: "POST",
      json: body
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
    try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/confirmations",
      method: "POST",
      json: [
        "snapshotId": snapshotId,
        "contentHash": contentHash,
        "presentationHash": presentationHash,
        "action": action,
        "idempotencyKey": idempotencyKey,
      ]
    )
  }

  public func getReceipt(sessionId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/receipt",
      method: "GET",
      json: nil
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
    return try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))/revisions",
      method: "POST",
      json: body
    )
  }

  public func requestDeletion(sessionId: String) async throws -> [String: Any] {
    try await requestJSON(
      path: "/v1/dealbridge/sessions/\(enc(sessionId))",
      method: "DELETE",
      json: nil
    )
  }

  public func listEvents(sessionId: String, cursor: String? = nil) async throws -> [String: Any] {
    var path = "/v1/dealbridge/sessions/\(enc(sessionId))/events"
    if let cursor {
      path += "?cursor=\(enc(cursor))"
    }
    return try await requestJSON(path: path, method: "GET", json: nil)
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
    let boundary = "LugemiDB\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
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
    if let actorId { request.setValue(actorId, forHTTPHeaderField: "X-DealBridge-Actor-Id") }
    if let organizationId { request.setValue(organizationId, forHTTPHeaderField: "X-Lugemi-Organization-Id") }
    if let workspaceId { request.setValue(workspaceId, forHTTPHeaderField: "X-Lugemi-Workspace-Id") }
    if let multipart {
      request.setValue("multipart/form-data; boundary=\(multipart.0)", forHTTPHeaderField: "Content-Type")
      request.httpBody = multipart.1
    } else if let json {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = try JSONSerialization.data(withJSONObject: json)
    } else if method == "POST" || method == "PATCH" || method == "DELETE" {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      if method != "DELETE" { request.httpBody = Data("{}".utf8) }
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
