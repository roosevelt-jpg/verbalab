import Foundation

/// MeetingBridge REST client — multilingual meetings with revision-linked transcripts
/// and explicit confirmations. Paths under `/v1/meetingbridge/*`.
public struct MeetingBridgeClient: @unchecked Sendable {
  private let http: LugemiHttp
  public var actorId: String?

  public init(http: LugemiHttp, actorId: String? = nil) {
    self.http = http
    self.actorId = actorId
  }

  private var headers: [String: String] {
    guard let actorId else { return [:] }
    return ["X-MeetingBridge-Actor-Id": actorId]
  }

  public func catalog() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/meetingbridge/catalog", method: "GET", json: nil, extraHeaders: headers)
  }

  public func peekInvite(token: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/invites/\(token.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? token)",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func listMeetings() async throws -> [String: Any] {
    try await http.requestJSON(path: "/v1/meetingbridge/meetings", method: "GET", json: nil, extraHeaders: headers)
  }

  public func createMeeting(
    title: String,
    agenda: String? = nil,
    timeZone: String = "Africa/Accra",
    corridor: String = "en-ak",
    speakingLanguage: String = "en",
    listeningLanguage: String = "ak",
    maxParticipants: Int = 6,
    isDemo: Bool = false
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "title": title,
      "timeZone": timeZone,
      "corridor": corridor,
      "speakingLanguage": speakingLanguage,
      "listeningLanguage": listeningLanguage,
      "maxParticipants": maxParticipants,
      "isDemo": isDemo,
    ]
    if let agenda { body["agenda"] = agenda }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func getMeeting(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func createInvite(meetingId: String, expiresInHours: Int? = nil) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let expiresInHours { body["expiresInHours"] = expiresInHours }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/invites",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func join(
    meetingId: String,
    token: String,
    speakingLanguage: String,
    listeningLanguage: String,
    listeningMode: String = "captions_only"
  ) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/join",
      method: "POST",
      json: [
        "token": token,
        "speakingLanguage": speakingLanguage,
        "listeningLanguage": listeningLanguage,
        "listeningMode": listeningMode,
      ],
      extraHeaders: headers
    )
  }

  public func openLobby(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/lobby",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func start(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/start",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func updatePreferences(
    meetingId: String,
    speakingLanguage: String? = nil,
    listeningLanguage: String? = nil,
    listeningMode: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [:]
    if let speakingLanguage { body["speakingLanguage"] = speakingLanguage }
    if let listeningLanguage { body["listeningLanguage"] = listeningLanguage }
    if let listeningMode { body["listeningMode"] = listeningMode }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/members/me",
      method: "PATCH",
      json: body,
      extraHeaders: headers
    )
  }

  public func correctUtterance(
    meetingId: String,
    utteranceId: String,
    text: String,
    reason: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["utteranceId": utteranceId, "text": text]
    if let reason { body["reason"] = reason }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/utterance-corrections",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func commitUtterance(meetingId: String, text: String, language: String? = nil) async throws -> [String: Any] {
    var body: [String: Any] = ["text": text]
    if let language { body["language"] = language }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/utterances",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func proposeItem(
    meetingId: String,
    kind: String,
    wording: String,
    ownerParticipantIds: [String]? = nil,
    dueDate: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = ["kind": kind, "wording": wording]
    if let ownerParticipantIds { body["ownerParticipantIds"] = ownerParticipantIds }
    if let dueDate { body["dueDate"] = dueDate }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/items",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func confirmItem(
    itemId: String,
    meetingId: String,
    action: String,
    idempotencyKey: String,
    note: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "meetingId": meetingId,
      "action": action,
      "idempotencyKey": idempotencyKey,
    ]
    if let note { body["note"] = note }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/items/\(enc(itemId))/confirmations",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func reviseItem(
    itemId: String,
    meetingId: String,
    expectedRevision: Int,
    wording: String? = nil,
    dueDate: String? = nil
  ) async throws -> [String: Any] {
    var body: [String: Any] = [
      "meetingId": meetingId,
      "expectedRevision": expectedRevision,
    ]
    if let wording { body["wording"] = wording }
    if let dueDate { body["dueDate"] = dueDate }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/items/\(enc(itemId))/revisions",
      method: "POST",
      json: body,
      extraHeaders: headers
    )
  }

  public func syncItem(
    itemId: String,
    meetingId: String,
    idempotencyKey: String,
    destination: String = "private_download",
    target: String? = nil
  ) async throws -> [String: Any] {
    var json: [String: Any] = [
      "meetingId": meetingId,
      "idempotencyKey": idempotencyKey,
      "destination": destination,
    ]
    if let target { json["target"] = target }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/items/\(enc(itemId))/sync",
      method: "POST",
      json: json,
      extraHeaders: headers
    )
  }

  public func mintMediaToken(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/media/token",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func lobbyMicCheck(
    meetingId: String,
    levelPeak: Double = 0,
    muted: Bool = false,
    deviceLabel: String? = nil
  ) async throws -> [String: Any] {
    var json: [String: Any] = ["levelPeak": levelPeak, "muted": muted]
    if let deviceLabel { json["deviceLabel"] = deviceLabel }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/lobby/mic-check",
      method: "POST",
      json: json,
      extraHeaders: headers
    )
  }

  public func confirmationInbox(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/inbox",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func diagnostics(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/diagnostics",
      method: "GET",
      json: nil,
      extraHeaders: headers
    )
  }

  public func joinConferencing(
    meetingId: String,
    provider: String,
    meetingUrl: String? = nil
  ) async throws -> [String: Any] {
    var json: [String: Any] = ["provider": provider]
    if let meetingUrl { json["meetingUrl"] = meetingUrl }
    return try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/conferencing",
      method: "POST",
      json: json,
      extraHeaders: headers
    )
  }

  public func handoffDealBridge(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/handoff/dealbridge",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func handoffVoiceBridge(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/handoff/voicebridge",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func close(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/close",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func issueMinutes(meetingId: String) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/meetings/\(enc(meetingId))/minutes",
      method: "POST",
      json: [:],
      extraHeaders: headers
    )
  }

  public func exportMinutes(
    minutesId: String,
    meetingId: String,
    format: String = "markdown",
    idempotencyKey: String
  ) async throws -> [String: Any] {
    try await http.requestJSON(
      path: "/v1/meetingbridge/minutes/\(enc(minutesId))/exports",
      method: "POST",
      json: [
        "meetingId": meetingId,
        "format": format,
        "idempotencyKey": idempotencyKey,
      ],
      extraHeaders: headers
    )
  }

  private func enc(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
  }
}
