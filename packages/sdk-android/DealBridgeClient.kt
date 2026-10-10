package com.lugemi.sdk

import org.json.JSONObject

/**
 * DealBridge REST client — proposed multilingual deal sessions.
 * Set [actorId] for X-DealBridge-Actor-Id when using API keys.
 */
class DealBridgeClient(
  private val http: LugemiHttp,
  var actorId: String? = null,
  private val uploader: ResumableUploader = ResumableUploader(http),
) {
  private fun headers(): Map<String, String> =
    actorId?.let { mapOf("X-DealBridge-Actor-Id" to it) } ?: emptyMap()

  fun catalog(): JSONObject = http.requestJson("GET", "/v1/dealbridge/catalog", null, headers())

  fun peekInvite(token: String): JSONObject =
    http.requestJson("GET", "/v1/dealbridge/invites/${enc(token)}", null, headers())

  fun listSessions(): JSONObject = http.requestJson("GET", "/v1/dealbridge/sessions", null, headers())

  fun createSession(
    merchantLanguage: String,
    buyerLanguage: String,
    category: String? = null,
    timeZone: String? = null,
    expiresInHours: Int? = null,
    idempotencyKey: String? = null,
    isDemo: Boolean? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("merchantLanguage", merchantLanguage)
      .put("buyerLanguage", buyerLanguage)
    if (category != null) body.put("category", category)
    if (timeZone != null) body.put("timeZone", timeZone)
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    if (idempotencyKey != null) body.put("idempotencyKey", idempotencyKey)
    if (isDemo != null) body.put("isDemo", isDemo)
    return http.requestJson("POST", "/v1/dealbridge/sessions", body, headers())
  }

  fun getSession(sessionId: String): JSONObject =
    http.requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}", null, headers())

  fun createInvite(sessionId: String, expiresInHours: Int? = null): JSONObject {
    val body = JSONObject()
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/invites", body, headers())
  }

  fun join(sessionId: String, token: String, language: String, variety: String? = null): JSONObject {
    val body = JSONObject().put("token", token).put("language", language)
    if (variety != null) body.put("variety", variety)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/join", body, headers())
  }

  fun recordConsent(
    sessionId: String,
    purpose: String,
    decision: String,
    noticeVersion: String? = null,
  ): JSONObject {
    val body = JSONObject().put("purpose", purpose).put("decision", decision)
    if (noticeVersion != null) body.put("noticeVersion", noticeVersion)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/consents", body, headers())
  }

  fun issueUploadAuth(sessionId: String): UploadAuth =
    UploadAuth.from(
      http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/turns/uploads", JSONObject(), headers()),
    )

  fun createTextTurn(
    sessionId: String,
    text: String,
    language: String? = null,
    expectedRevision: Int? = null,
  ): JSONObject {
    val body = JSONObject().put("text", text)
    if (language != null) body.put("language", language)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/turns", body, headers())
  }

  fun createAudioTurn(
    sessionId: String,
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String? = null,
    expectedRevision: Int? = null,
  ): JSONObject {
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    if (expectedRevision != null) fields["expectedRevision"] = expectedRevision.toString()
    return http.multipartJson(
      "POST",
      "/v1/dealbridge/sessions/${enc(sessionId)}/turns",
      fields,
      "file",
      filename,
      mimeType,
      audio,
      headers(),
    )
  }

  fun createAudioTurnResumable(
    sessionId: String,
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String? = null,
    expectedRevision: Int? = null,
    onProgress: ((UploadProgress) -> Unit)? = null,
  ): JSONObject {
    val auth = issueUploadAuth(sessionId)
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    if (expectedRevision != null) fields["expectedRevision"] = expectedRevision.toString()
    return uploader.uploadMultipart(
      path = "/v1/dealbridge/sessions/${enc(sessionId)}/turns",
      fields = fields,
      fileField = "file",
      filename = filename,
      mimeType = mimeType,
      fileBytes = audio,
      maxBytes = auth.maxBytes.takeIf { it > 0 },
      extraHeaders = headers(),
      onProgress = onProgress,
    )
  }

  fun correctTurn(
    sessionId: String,
    turnId: String,
    text: String,
    expectedRevision: Int? = null,
  ): JSONObject {
    val body = JSONObject().put("text", text)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson(
      "PATCH",
      "/v1/dealbridge/sessions/${enc(sessionId)}/turns/${enc(turnId)}",
      body,
      headers(),
    )
  }

  fun proposeSnapshot(
    sessionId: String,
    expectedRevision: Int? = null,
    overrides: JSONObject? = null,
  ): JSONObject {
    val body = JSONObject()
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    if (overrides != null) body.put("overrides", overrides)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/snapshots", body, headers())
  }

  fun submitCheck(
    sessionId: String,
    snapshotId: String,
    presentationHash: String,
    responseText: String,
    responseTurnId: String? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("snapshotId", snapshotId)
      .put("presentationHash", presentationHash)
      .put("responseText", responseText)
    if (responseTurnId != null) body.put("responseTurnId", responseTurnId)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/checks", body, headers())
  }

  fun confirm(
    sessionId: String,
    snapshotId: String,
    contentHash: String,
    presentationHash: String,
    action: String,
    idempotencyKey: String,
  ): JSONObject {
    val body = JSONObject()
      .put("snapshotId", snapshotId)
      .put("contentHash", contentHash)
      .put("presentationHash", presentationHash)
      .put("action", action)
      .put("idempotencyKey", idempotencyKey)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/confirmations", body, headers())
  }

  fun getReceipt(sessionId: String): JSONObject =
    http.requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}/receipt", null, headers())

  fun startRevision(sessionId: String, reason: String? = null, expectedRevision: Int? = null): JSONObject {
    val body = JSONObject()
    if (reason != null) body.put("reason", reason)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/revisions", body, headers())
  }

  fun requestDeletion(sessionId: String): JSONObject =
    http.requestJson("DELETE", "/v1/dealbridge/sessions/${enc(sessionId)}", null, headers())

  fun listEvents(sessionId: String, cursor: String? = null): JSONObject {
    val q = if (cursor.isNullOrBlank()) "" else "?cursor=${enc(cursor)}"
    return http.requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}/events$q", null, headers())
  }

  private fun enc(s: String): String = java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20")
}
