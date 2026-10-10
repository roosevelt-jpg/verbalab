import Foundation

/// AccessLine REST client — native-language telephone logistics (simulator + admin APIs).
public struct AccessLineClient: @unchecked Sendable {
  private let http: LugemiHttp
  public var actorId: String?

  public init(http: LugemiHttp, actorId: String? = nil) {
    self.http = http
    self.actorId = actorId
  }

  private var headers: [String: String] {
    guard let actorId, !actorId.isEmpty else { return [:] }
    return ["X-AccessLine-Actor-Id": actorId]
  }

  public func catalog() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/accessline/catalog", method: "GET", json: nil, extraHeaders: headers)
  }

  public func capabilities() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/accessline/capabilities", method: "GET", json: nil, extraHeaders: headers)
  }

  public func metrics() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/accessline/metrics", method: "GET", json: nil, extraHeaders: headers)
  }

  public func listLines() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/accessline/lines", method: "GET", json: nil, extraHeaders: headers)
  }

  public func createLine(
    name: String,
    inboundNumber: String,
    jurisdiction: String = "KE",
    timeZone: String = "Africa/Nairobi",
    enabledLanguages: [String] = ["sw-KE", "en"],
    recordingEnabled: Bool = false,
    knowledgeSnippet: String? = nil,
    integrationMode: String = "simulated"
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "name": name,
      "inboundNumber": inboundNumber,
      "jurisdiction": jurisdiction,
      "timeZone": timeZone,
      "enabledLanguages": enabledLanguages,
      "recordingEnabled": recordingEnabled,
      "integrationMode": integrationMode,
    ]
    if let knowledgeSnippet { body["knowledgeSnippet"] = knowledgeSnippet }
    return try await http.requestJSON(path: "/v1/accessline/lines", method: "POST", json: body, extraHeaders: headers)
  }

  public func getLine(lineId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/lines/\(enc(lineId))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func listCalls() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/accessline/calls", method: "GET", json: nil, extraHeaders: headers)
  }

  public func getCall(callId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/calls/\(enc(callId))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func callSummary(callId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/calls/\(enc(callId))/summary",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func requestHandoff(
    callId: String,
    reason: String = "api_requested",
    destinationId: String? = nil,
    idempotencyKey: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["reason": reason]
    if let destinationId { body["destinationId"] = destinationId }
    if let idempotencyKey { body["idempotencyKey"] = idempotencyKey }
    return try await http.requestJSON(
      path: "/v1/accessline/calls/\(enc(callId))/handoff",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func simulateStart(lineId: String, callerId: String? = nil) async throws -> [String: Any] {
    var body: [String: Any] = ["lineId": lineId]
    if let callerId { body["callerId"] = callerId }
    return try await http.requestJSON(
      path: "/v1/accessline/simulate/start",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func simulateDtmf(callId: String, digits: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/simulate/\(enc(callId))/dtmf",
      method: "POST",
      json: ["digits": digits],
      extraHeaders: headers
    )
  }

  public func simulateSpeech(callId: String, text: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/simulate/\(enc(callId))/speech",
      method: "POST",
      json: ["text": text],
      extraHeaders: headers
    )
  }

  public func simulateHangup(callId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/accessline/simulate/\(enc(callId))/hangup",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  private func enc(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }
}
