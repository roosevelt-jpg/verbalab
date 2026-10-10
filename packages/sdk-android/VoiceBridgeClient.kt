package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject

/**
 * VoiceBridge REST client — private multilingual voice threads.
 * Set [actorId] for X-VoiceBridge-Actor-Id (API-key / test actors).
 */
class VoiceBridgeClient(
  private val http: LugemiHttp,
  var actorId: String? = null,
  private val uploader: ResumableUploader = ResumableUploader(http),
) {
  private fun headers(): Map<String, String> =
    actorId?.let { mapOf("X-VoiceBridge-Actor-Id" to it) } ?: emptyMap()

  fun catalog(): JSONObject = http.requestJson("GET", "/v1/voicebridge/catalog", null, headers())

  fun peekInvite(token: String): JSONObject =
    http.requestJson("GET", "/v1/voicebridge/invites/${enc(token)}", null, headers())

  fun listThreads(): JSONObject = http.requestJson("GET", "/v1/voicebridge/threads", null, headers())

  fun createThread(
    title: String,
    language: String,
    category: String? = null,
    variety: String? = null,
    corridor: String? = null,
  ): JSONObject {
    val body = JSONObject().put("title", title).put("language", language)
    if (category != null) body.put("category", category)
    if (variety != null) body.put("variety", variety)
    if (corridor != null) body.put("corridor", corridor)
    return http.requestJson("POST", "/v1/voicebridge/threads", body, headers())
  }

  fun getThread(threadId: String): JSONObject =
    http.requestJson("GET", "/v1/voicebridge/threads/${enc(threadId)}", null, headers())

  fun createInvite(threadId: String, expiresInHours: Int? = null): JSONObject {
    val body = JSONObject()
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    return http.requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/invites", body, headers())
  }

  fun join(
    threadId: String,
    token: String,
    language: String,
    variety: String? = null,
    consents: List<Pair<String, String>> = listOf("processing" to "granted"),
  ): JSONObject {
    val arr = JSONArray()
    for ((purpose, decision) in consents) {
      arr.put(JSONObject().put("purpose", purpose).put("decision", decision))
    }
    val body = JSONObject().put("token", token).put("language", language).put("consents", arr)
    if (variety != null) body.put("variety", variety)
    return http.requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/join", body, headers())
  }

  fun patchMemberMe(
    threadId: String,
    language: String? = null,
    variety: String? = null,
    notificationsEnabled: Boolean? = null,
  ): JSONObject {
    val body = JSONObject()
    if (language != null) body.put("language", language)
    if (variety != null) body.put("variety", variety)
    if (notificationsEnabled != null) body.put("notificationsEnabled", notificationsEnabled)
    return http.requestJson("PATCH", "/v1/voicebridge/threads/${enc(threadId)}/members/me", body, headers())
  }

  fun issueUploadAuth(threadId: String): UploadAuth =
    UploadAuth.from(http.requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/uploads", JSONObject(), headers()))

  fun createTextDraft(
    threadId: String,
    text: String,
    language: String? = null,
    idempotencyKey: String? = null,
    replyToMessageId: String? = null,
    replyToRevisionId: String? = null,
  ): JSONObject {
    val body = JSONObject().put("text", text)
    if (language != null) body.put("language", language)
    if (idempotencyKey != null) body.put("idempotencyKey", idempotencyKey)
    if (replyToMessageId != null) body.put("replyToMessageId", replyToMessageId)
    if (replyToRevisionId != null) body.put("replyToRevisionId", replyToRevisionId)
    return http.requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/messages", body, headers())
  }

  fun createAudioDraft(
    threadId: String,
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String? = null,
    idempotencyKey: String? = null,
  ): JSONObject {
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    if (idempotencyKey != null) fields["idempotencyKey"] = idempotencyKey
    return http.multipartJson(
      "POST",
      "/v1/voicebridge/threads/${enc(threadId)}/messages",
      fields,
      "file",
      filename,
      mimeType,
      audio,
      headers(),
    )
  }

  /** Upload with retry/backoff after consulting upload auth limits. */
  fun createAudioDraftResumable(
    threadId: String,
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String? = null,
    idempotencyKey: String? = null,
    onProgress: ((UploadProgress) -> Unit)? = null,
  ): JSONObject {
    val auth = issueUploadAuth(threadId)
    if (mimeType !in auth.allowedMimeTypes && auth.allowedMimeTypes.isNotEmpty()) {
      throw LugemiException(
        "Unsupported mime type $mimeType; allowed=${auth.allowedMimeTypes}",
        code = "validation_error",
        status = 400,
      )
    }
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    if (idempotencyKey != null) fields["idempotencyKey"] = idempotencyKey
    return uploader.uploadMultipart(
      path = auth.uploadPath.ifBlank { "/v1/voicebridge/threads/${enc(threadId)}/messages" },
      fields = fields,
      fileField = "file",
      filename = filename,
      mimeType = mimeType,
      fileBytes = audio,
      maxBytes = auth.maxBytes,
      extraHeaders = headers(),
      onProgress = onProgress,
    )
  }

  fun updateDraft(
    messageId: String,
    reviewedTranscript: String,
    expectedDraftRevisionId: String,
  ): JSONObject {
    val body = JSONObject()
      .put("reviewedTranscript", reviewedTranscript)
      .put("expectedDraftRevisionId", expectedDraftRevisionId)
    return http.requestJson("PATCH", "/v1/voicebridge/messages/${enc(messageId)}/draft", body, headers())
  }

  fun publishMessage(
    messageId: String,
    expectedDraftRevisionId: String,
    reviewedTranscript: String? = null,
  ): JSONObject {
    val body = JSONObject().put("expectedDraftRevisionId", expectedDraftRevisionId)
    if (reviewedTranscript != null) body.put("reviewedTranscript", reviewedTranscript)
    return http.requestJson("POST", "/v1/voicebridge/messages/${enc(messageId)}/publish", body, headers())
  }

  fun correctMessage(
    messageId: String,
    expectedActiveRevisionId: String,
    reviewedTranscript: String,
    correctionReason: String? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("expectedActiveRevisionId", expectedActiveRevisionId)
      .put("reviewedTranscript", reviewedTranscript)
    if (correctionReason != null) body.put("correctionReason", correctionReason)
    return http.requestJson("POST", "/v1/voicebridge/messages/${enc(messageId)}/corrections", body, headers())
  }

  fun acknowledgeRevision(revisionId: String): JSONObject =
    http.requestJson("POST", "/v1/voicebridge/revisions/${enc(revisionId)}/acknowledgments", JSONObject(), headers())

  fun recordPlayback(revisionId: String): JSONObject =
    http.requestJson("POST", "/v1/voicebridge/revisions/${enc(revisionId)}/playback", JSONObject(), headers())

  fun createDealDraft(
    threadId: String,
    selectedRevisionIds: List<String>,
    partyAUserId: String,
    partyBUserId: String,
    category: String? = null,
    idempotencyKey: String? = null,
  ): JSONObject {
    val ids = JSONArray()
    selectedRevisionIds.forEach { ids.put(it) }
    val body = JSONObject()
      .put("selectedRevisionIds", ids)
      .put("partyAUserId", partyAUserId)
      .put("partyBUserId", partyBUserId)
    if (category != null) body.put("category", category)
    if (idempotencyKey != null) body.put("idempotencyKey", idempotencyKey)
    return http.requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/deal-drafts", body, headers())
  }

  private fun enc(s: String): String = java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20")
}
