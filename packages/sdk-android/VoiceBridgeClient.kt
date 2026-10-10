package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.ProtocolException
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.UUID

/**
 * VoiceBridge REST client — private multilingual voice threads.
 * Requires API key auth; set [actorId] for X-VoiceBridge-Actor-Id (API-key / test actors).
 */
class VoiceBridgeClient(
  private val apiKey: String,
  private val baseUrl: String = "https://api.lugemi.com",
  /** Required when authenticating with an API key (maps to X-VoiceBridge-Actor-Id). */
  var actorId: String? = null,
  var organizationId: String? = null,
  var workspaceId: String? = null,
) {
  fun catalog(): JSONObject = requestJson("GET", "/v1/voicebridge/catalog", null)

  fun peekInvite(token: String): JSONObject =
    requestJson("GET", "/v1/voicebridge/invites/${enc(token)}", null)

  fun listThreads(): JSONObject = requestJson("GET", "/v1/voicebridge/threads", null)

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
    return requestJson("POST", "/v1/voicebridge/threads", body)
  }

  fun getThread(threadId: String): JSONObject =
    requestJson("GET", "/v1/voicebridge/threads/${enc(threadId)}", null)

  fun createInvite(threadId: String, expiresInHours: Int? = null): JSONObject {
    val body = JSONObject()
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    return requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/invites", body)
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
    val body = JSONObject()
      .put("token", token)
      .put("language", language)
      .put("consents", arr)
    if (variety != null) body.put("variety", variety)
    return requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/join", body)
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
    return requestJson("PATCH", "/v1/voicebridge/threads/${enc(threadId)}/members/me", body)
  }

  fun issueUploadAuth(threadId: String): JSONObject =
    requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/uploads", JSONObject())

  /** Text draft — sender must review then [publishMessage]. */
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
    return requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/messages", body)
  }

  /** Audio draft via multipart (browser/mobile recording). */
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
    return multipart(
      "POST",
      "/v1/voicebridge/threads/${enc(threadId)}/messages",
      fields,
      fileField = "file",
      filename = filename,
      mimeType = mimeType,
      fileBytes = audio,
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
    return requestJson("PATCH", "/v1/voicebridge/messages/${enc(messageId)}/draft", body)
  }

  fun publishMessage(
    messageId: String,
    expectedDraftRevisionId: String,
    reviewedTranscript: String? = null,
  ): JSONObject {
    val body = JSONObject().put("expectedDraftRevisionId", expectedDraftRevisionId)
    if (reviewedTranscript != null) body.put("reviewedTranscript", reviewedTranscript)
    return requestJson("POST", "/v1/voicebridge/messages/${enc(messageId)}/publish", body)
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
    return requestJson("POST", "/v1/voicebridge/messages/${enc(messageId)}/corrections", body)
  }

  fun acknowledgeRevision(revisionId: String): JSONObject =
    requestJson("POST", "/v1/voicebridge/revisions/${enc(revisionId)}/acknowledgments", JSONObject())

  fun recordPlayback(revisionId: String): JSONObject =
    requestJson("POST", "/v1/voicebridge/revisions/${enc(revisionId)}/playback", JSONObject())

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
    return requestJson("POST", "/v1/voicebridge/threads/${enc(threadId)}/deal-drafts", body)
  }

  private fun enc(s: String): String = java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20")

  private fun open(method: String, path: String): HttpURLConnection {
    val url = URL(baseUrl.trimEnd('/') + path)
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = 30_000
    conn.readTimeout = 180_000
    conn.doInput = true
    conn.setRequestProperty("Authorization", "Bearer $apiKey")
    actorId?.let { conn.setRequestProperty("X-VoiceBridge-Actor-Id", it) }
    organizationId?.let { conn.setRequestProperty("X-Lugemi-Organization-Id", it) }
    workspaceId?.let { conn.setRequestProperty("X-Lugemi-Workspace-Id", it) }
    setMethod(conn, method)
    return conn
  }

  private fun setMethod(conn: HttpURLConnection, method: String) {
    try {
      conn.requestMethod = method
    } catch (e: ProtocolException) {
      if (method == "PATCH" || method == "DELETE") {
        conn.requestMethod = "POST"
        conn.setRequestProperty("X-HTTP-Method-Override", method)
      } else {
        throw e
      }
    }
  }

  private fun requestJson(method: String, path: String, body: JSONObject?): JSONObject {
    val conn = open(method, path)
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("Accept", "application/json")
    if (body != null) {
      conn.doOutput = true
      conn.outputStream.use { it.write(body.toString().toByteArray(StandardCharsets.UTF_8)) }
    }
    return readJson(conn)
  }

  private fun multipart(
    method: String,
    path: String,
    fields: Map<String, String>,
    fileField: String,
    filename: String,
    mimeType: String,
    fileBytes: ByteArray,
  ): JSONObject {
    val boundary = "----LugemiVB" + UUID.randomUUID().toString().replace("-", "")
    val conn = open(method, path)
    conn.doOutput = true
    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
    conn.setRequestProperty("Accept", "application/json")
    DataOutputStream(conn.outputStream).use { out ->
      for ((k, v) in fields) {
        out.writeBytes("--$boundary\r\n")
        out.writeBytes("Content-Disposition: form-data; name=\"$k\"\r\n\r\n")
        out.writeBytes("$v\r\n")
      }
      out.writeBytes("--$boundary\r\n")
      out.writeBytes(
        "Content-Disposition: form-data; name=\"$fileField\"; filename=\"$filename\"\r\n",
      )
      out.writeBytes("Content-Type: $mimeType\r\n\r\n")
      out.write(fileBytes)
      out.writeBytes("\r\n--$boundary--\r\n")
    }
    return readJson(conn)
  }

  private fun readJson(conn: HttpURLConnection): JSONObject {
    val code = conn.responseCode
    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
    val text = stream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    if (code !in 200..299) {
      val err = runCatching { JSONObject(text) }.getOrNull()
      throw LugemiException(
        err?.optJSONObject("error")?.optString("message") ?: text.ifBlank { "Request failed ($code)" },
        err?.optJSONObject("error")?.optString("code"),
        code,
      )
    }
    return if (text.isBlank()) JSONObject() else JSONObject(text)
  }
}
