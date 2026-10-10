package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject

/**
 * Official Android / Kotlin client for Lugemi.
 * Core: speech, translate, detect, ASR; plus VoiceBridge, DealBridge, and Voice Studio.
 */
interface LugemiClient {
  fun speech(request: SpeechRequest): SpeechResult
  fun speechStream(request: SpeechRequest, onChunk: (ByteArray) -> Unit): SpeechResult
  fun translate(request: TranslateRequest): TranslateResult
  fun translateStream(request: TranslateRequest): Sequence<TranslateStreamEvent>
  fun detect(text: String): DetectResult
  fun transcribe(audio: ByteArray, filename: String, mimeType: String, language: String? = null): TranscribeResult
  fun recognizeSpeech(
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String? = null,
    industryPacks: List<String>? = null,
    vocabulary: List<String>? = null,
  ): SpeechRecognizeResult
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
  val voiceStudio: VoiceStudioClient
  val uploads: ResumableUploader
}

class LugemiHttpClient(
  apiKey: String,
  baseUrl: String = "https://api.lugemi.com",
  actorId: String? = null,
  organizationId: String? = null,
  workspaceId: String? = null,
) : LugemiClient {
  private val http = LugemiHttp(
    apiKey = apiKey,
    baseUrl = baseUrl,
    organizationId = organizationId,
    workspaceId = workspaceId,
  )

  override val uploads = ResumableUploader(http)

  override val voiceBridge = VoiceBridgeClient(
    http = http,
    actorId = actorId,
    uploader = uploads,
  )
  override val dealBridge = DealBridgeClient(
    http = http,
    actorId = actorId,
    uploader = uploads,
  )
  override val voiceStudio = VoiceStudioClient(http = http)

  override fun speech(request: SpeechRequest): SpeechResult {
    val body = JSONObject()
      .put("text", request.text)
      .put("voice", request.voice)
      .put("format", request.format)
    if (request.language != null) body.put("language", request.language)
    val (bytes, conn) = http.requestBytes("POST", "/v1/audio/speech", body)
    return SpeechResult(
      audio = bytes,
      mimeType = conn.contentType ?: "audio/mpeg",
      voice = conn.getHeaderField("x-lugemi-voice"),
      provider = conn.getHeaderField("x-lugemi-provider"),
      characters = conn.getHeaderField("x-lugemi-characters")?.toIntOrNull(),
    )
  }

  override fun speechStream(request: SpeechRequest, onChunk: (ByteArray) -> Unit): SpeechResult {
    val body = JSONObject()
      .put("text", request.text)
      .put("voice", request.voice)
      .put("format", request.format)
    if (request.language != null) body.put("language", request.language)
    val (bytes, conn) = http.requestBytes("POST", "/v1/audio/speech", body, onBytes = onChunk)
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
    val json = http.requestJson("POST", "/v1/translate", body)
    return TranslateResult.from(json, request.source, request.target)
  }

  override fun translateStream(request: TranslateRequest): Sequence<TranslateStreamEvent> {
    val body = JSONObject()
      .put("text", request.text)
      .put("source", request.source)
      .put("target", request.target)
    return http.readSseEvents("POST", "/v1/translate/stream", body).map { TranslateStreamEvent.from(it) }
  }

  override fun detect(text: String): DetectResult {
    val json = http.requestJson("POST", "/v1/detect", JSONObject().put("text", text))
    return DetectResult.from(json)
  }

  override fun transcribe(
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String?,
  ): TranscribeResult {
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    val json = http.multipartJson(
      "POST",
      "/v1/audio/transcriptions",
      fields,
      "file",
      filename,
      mimeType,
      audio,
    )
    return TranscribeResult.from(json)
  }

  override fun recognizeSpeech(
    audio: ByteArray,
    filename: String,
    mimeType: String,
    language: String?,
    industryPacks: List<String>?,
    vocabulary: List<String>?,
  ): SpeechRecognizeResult {
    val fields = LinkedHashMap<String, String>()
    if (language != null) fields["language"] = language
    if (!industryPacks.isNullOrEmpty()) fields["industryPacks"] = industryPacks.joinToString(",")
    if (!vocabulary.isNullOrEmpty()) fields["vocabulary"] = vocabulary.joinToString(",")
    val json = http.multipartJson(
      "POST",
      "/v1/speech/recognize",
      fields,
      "file",
      filename,
      mimeType,
      audio,
    )
    return SpeechRecognizeResult.from(json)
  }

  override fun languages(): List<Map<String, Any?>> {
    val json = http.requestJson("GET", "/v1/languages", null)
    return jsonArrayToMaps(json.optJSONArray("data") ?: JSONArray())
  }

  override fun voices(): List<Map<String, Any?>> {
    val json = http.requestJson("GET", "/v1/audio/voices", null)
    return jsonArrayToMaps(json.optJSONArray("data") ?: JSONArray())
  }

  override fun videoVoiceLine(
    text: String,
    target: String,
    voice: String,
    source: String,
  ): Pair<TranslateResult, SpeechResult> {
    val translated = translate(TranslateRequest(text = text, source = source, target = target))
    val audio = speech(SpeechRequest(text = translated.text, voice = voice, language = target))
    return translated to audio
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
