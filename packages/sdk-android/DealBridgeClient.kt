package com.lugemi.sdk

import org.json.JSONObject
import java.io.BufferedReader
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.ProtocolException
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.UUID

/**
 * DealBridge REST client — proposed multilingual deal sessions.
 * Set [actorId] for X-DealBridge-Actor-Id when using API keys.
 */
class DealBridgeClient(
  private val apiKey: String,
  private val baseUrl: String = "https://api.lugemi.com",
  var actorId: String? = null,
  var organizationId: String? = null,
  var workspaceId: String? = null,
) {
  fun catalog(): JSONObject = requestJson("GET", "/v1/dealbridge/catalog", null)

  fun peekInvite(token: String): JSONObject =
    requestJson("GET", "/v1/dealbridge/invites/${enc(token)}", null)

  fun listSessions(): JSONObject = requestJson("GET", "/v1/dealbridge/sessions", null)

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
    return requestJson("POST", "/v1/dealbridge/sessions", body)
  }

  fun getSession(sessionId: String): JSONObject =
    requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}", null)

  fun createInvite(sessionId: String, expiresInHours: Int? = null): JSONObject {
    val body = JSONObject()
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/invites", body)
  }

  fun join(sessionId: String, token: String, language: String, variety: String? = null): JSONObject {
    val body = JSONObject().put("token", token).put("language", language)
    if (variety != null) body.put("variety", variety)
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/join", body)
  }

  fun recordConsent(
    sessionId: String,
    purpose: String,
    decision: String,
    noticeVersion: String? = null,
  ): JSONObject {
    val body = JSONObject().put("purpose", purpose).put("decision", decision)
    if (noticeVersion != null) body.put("noticeVersion", noticeVersion)
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/consents", body)
  }

  fun issueUploadAuth(sessionId: String): JSONObject =
    requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/turns/uploads", JSONObject())

  fun createTextTurn(
    sessionId: String,
    text: String,
    language: String? = null,
    expectedRevision: Int? = null,
  ): JSONObject {
    val body = JSONObject().put("text", text)
    if (language != null) body.put("language", language)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/turns", body)
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
    return multipart(
      "POST",
      "/v1/dealbridge/sessions/${enc(sessionId)}/turns",
      fields,
      "file",
      filename,
      mimeType,
      audio,
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
    return requestJson(
      "PATCH",
      "/v1/dealbridge/sessions/${enc(sessionId)}/turns/${enc(turnId)}",
      body,
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
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/snapshots", body)
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
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/checks", body)
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
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/confirmations", body)
  }

  fun getReceipt(sessionId: String): JSONObject =
    requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}/receipt", null)

  fun startRevision(sessionId: String, reason: String? = null, expectedRevision: Int? = null): JSONObject {
    val body = JSONObject()
    if (reason != null) body.put("reason", reason)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return requestJson("POST", "/v1/dealbridge/sessions/${enc(sessionId)}/revisions", body)
  }

  fun requestDeletion(sessionId: String): JSONObject =
    requestJson("DELETE", "/v1/dealbridge/sessions/${enc(sessionId)}", null)

  fun listEvents(sessionId: String, cursor: String? = null): JSONObject {
    val q = if (cursor.isNullOrBlank()) "" else "?cursor=${enc(cursor)}"
    return requestJson("GET", "/v1/dealbridge/sessions/${enc(sessionId)}/events$q", null)
  }

  private fun enc(s: String): String = java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20")

  private fun open(method: String, path: String): HttpURLConnection {
    val url = URL(baseUrl.trimEnd('/') + path)
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = 30_000
    conn.readTimeout = 180_000
    conn.doInput = true
    conn.setRequestProperty("Authorization", "Bearer $apiKey")
    actorId?.let { conn.setRequestProperty("X-DealBridge-Actor-Id", it) }
    organizationId?.let { conn.setRequestProperty("X-Lugemi-Organization-Id", it) }
    workspaceId?.let { conn.setRequestProperty("X-Lugemi-Workspace-Id", it) }
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
    return conn
  }

  private fun requestJson(method: String, path: String, body: JSONObject?): JSONObject {
    val conn = open(method, path)
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("Accept", "application/json")
    if (body != null || method == "POST" || method == "PATCH" || method == "DELETE") {
      if (body != null) {
        conn.doOutput = true
        conn.outputStream.use { it.write(body.toString().toByteArray(StandardCharsets.UTF_8)) }
      }
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
    val boundary = "----LugemiDB" + UUID.randomUUID().toString().replace("-", "")
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
