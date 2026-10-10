package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

/**
 * Official Android / Kotlin client for Lugemi speech, translate, VoiceBridge, and DealBridge.
 * Same REST contracts as @lugemi/sdk — ready for video and mobile apps.
 */
data class SpeechRequest(
  val text: String,
  val voice: String,
  val language: String? = null,
  val format: String = "mp3",
)

data class SpeechResult(
  val audio: ByteArray,
  val mimeType: String,
  val voice: String? = null,
  val provider: String? = null,
  val characters: Int? = null,
)

data class TranslateRequest(
  val text: String,
  val source: String = "auto",
  val target: String,
)

data class TranslateResult(
  val text: String,
  val source: String,
  val characters: Int? = null,
)

class LugemiException(message: String, val code: String? = null, val status: Int? = null) :
  RuntimeException(message)

interface LugemiClient {
  fun speech(request: SpeechRequest): SpeechResult
  fun translate(request: TranslateRequest): TranslateResult
  fun languages(): List<Map<String, Any?>>
  fun voices(): List<Map<String, Any?>>
  fun videoVoiceLine(
    text: String,
    target: String,
    voice: String,
    source: String = "auto",
  ): Pair<TranslateResult, SpeechResult>

  val voiceBridge: VoiceBridgeClient
  val dealBridge: DealBridgeClient
}

class LugemiHttpClient(
  private val apiKey: String,
  private val baseUrl: String = "https://api.lugemi.com",
  actorId: String? = null,
  organizationId: String? = null,
  workspaceId: String? = null,
) : LugemiClient {
  override val voiceBridge = VoiceBridgeClient(
    apiKey = apiKey,
    baseUrl = baseUrl,
    actorId = actorId,
    organizationId = organizationId,
    workspaceId = workspaceId,
  )
  override val dealBridge = DealBridgeClient(
    apiKey = apiKey,
    baseUrl = baseUrl,
    actorId = actorId,
    organizationId = organizationId,
    workspaceId = workspaceId,
  )

  override fun speech(request: SpeechRequest): SpeechResult {
    val body = JSONObject()
      .put("text", request.text)
      .put("voice", request.voice)
      .put("format", request.format)
    if (request.language != null) body.put("language", request.language)

    val conn = open("POST", "/v1/audio/speech")
    conn.setRequestProperty("Accept", "*/*")
    writeJson(conn, body)
    val code = conn.responseCode
    if (code !in 200..299) throw httpError(conn, code)
    val bytes = conn.inputStream.readBytes()
    return SpeechResult(
      audio = bytes,
      mimeType = conn.contentType ?: "audio/mpeg",
      voice = conn.getHeaderField("x-lugemi-voice"),
      provider = conn.getHeaderField("x-lugemi-provider"),
      characters = conn.getHeaderField("x-lugemi-characters")?.toIntOrNull(),
    )
  }

  override fun translate(request: TranslateRequest): TranslateResult {
    val body = JSONObject()
      .put("text", request.text)
      .put("source", request.source)
      .put("target", request.target)
    val json = requestJson("POST", "/v1/translate", body)
    return TranslateResult(
      text = json.optString("text"),
      source = json.optString("source", request.source),
      characters = if (json.has("characters")) json.optInt("characters") else null,
    )
  }

  override fun languages(): List<Map<String, Any?>> {
    val json = requestJson("GET", "/v1/languages", null)
    return jsonArrayToMaps(json.optJSONArray("data") ?: JSONArray())
  }

  override fun voices(): List<Map<String, Any?>> {
    val json = requestJson("GET", "/v1/audio/voices", null)
    return jsonArrayToMaps(json.optJSONArray("data") ?: JSONArray())
  }

  override fun videoVoiceLine(
    text: String,
    target: String,
    voice: String,
    source: String,
  ): Pair<TranslateResult, SpeechResult> {
    val translated = translate(TranslateRequest(text = text, source = source, target = target))
    val audio = speech(
      SpeechRequest(text = translated.text, voice = voice, language = target),
    )
    return translated to audio
  }

  private fun open(method: String, path: String): HttpURLConnection {
    val url = URL(baseUrl.trimEnd('/') + path)
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = method
    conn.connectTimeout = 30_000
    conn.readTimeout = 120_000
    conn.setRequestProperty("Authorization", "Bearer $apiKey")
    conn.setRequestProperty("Content-Type", "application/json")
    conn.doInput = true
    return conn
  }

  private fun writeJson(conn: HttpURLConnection, body: JSONObject) {
    conn.doOutput = true
    OutputStreamWriter(conn.outputStream, StandardCharsets.UTF_8).use { it.write(body.toString()) }
  }

  private fun requestJson(method: String, path: String, body: JSONObject?): JSONObject {
    val conn = open(method, path)
    if (body != null) writeJson(conn, body)
    val code = conn.responseCode
    val stream = if (code in 200..299) conn.inputStream else conn.errorStream
    val text = stream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    if (code !in 200..299) {
      val err = runCatching { JSONObject(text) }.getOrNull()
      val message = err?.optJSONObject("error")?.optString("message")
        ?: text.ifBlank { "Request failed ($code)" }
      val errCode = err?.optJSONObject("error")?.optString("code")
      throw LugemiException(message, errCode, code)
    }
    return if (text.isBlank()) JSONObject() else JSONObject(text)
  }

  private fun httpError(conn: HttpURLConnection, code: Int): LugemiException {
    val text = conn.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    val err = runCatching { JSONObject(text) }.getOrNull()
    return LugemiException(
      err?.optJSONObject("error")?.optString("message") ?: "Request failed ($code)",
      err?.optJSONObject("error")?.optString("code"),
      code,
    )
  }

  private fun jsonArrayToMaps(arr: JSONArray): List<Map<String, Any?>> {
    val out = ArrayList<Map<String, Any?>>(arr.length())
    for (i in 0 until arr.length()) {
      val obj = arr.optJSONObject(i) ?: continue
      val map = LinkedHashMap<String, Any?>()
      val keys = obj.keys()
      while (keys.hasNext()) {
        val k = keys.next()
        map[k] = obj.opt(k)
      }
      out.add(map)
    }
    return out
  }
}
