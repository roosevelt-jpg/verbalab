package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.nio.charset.StandardCharsets

/**
 * Voice Studio REST client — collaborative script → translate → speech → review → export.
 * Paths under `/v1/voice-studio/workspace/*` plus VL-174 library helpers.
 */
class VoiceStudioClient(
  private val http: LugemiHttp,
) {
  fun capabilities(): JSONObject =
    http.requestJson("GET", "/v1/voice-studio/workspace/capabilities", null)

  fun engine(): JSONObject =
    http.requestJson("GET", "/v1/voice-studio/engine", null)

  fun library(): JSONObject =
    http.requestJson("GET", "/v1/voice-studio/library", null)

  fun listProjects(): JSONObject =
    http.requestJson("GET", "/v1/voice-studio/workspace/projects", null)

  fun createProject(
    name: String,
    sourceLanguage: String = "en",
    reviewPolicy: String = "independent_reviewer",
    description: String = "",
  ): JSONObject {
    val body = JSONObject()
      .put("name", name)
      .put("sourceLanguage", sourceLanguage)
      .put("reviewPolicy", reviewPolicy)
      .put("description", description)
    return http.requestJson("POST", "/v1/voice-studio/workspace/projects", body)
  }

  fun getProject(projectId: String): JSONObject =
    http.requestJson("GET", "/v1/voice-studio/workspace/projects/${enc(projectId)}", null)

  fun importScript(projectId: String, script: String, parentRevisionId: String? = null): JSONObject {
    val body = JSONObject().put("script", script)
    if (parentRevisionId != null) body.put("parentRevisionId", parentRevisionId)
    return http.requestJson("POST", "/v1/voice-studio/workspace/projects/${enc(projectId)}/scripts", body)
  }

  fun createEdition(
    projectId: String,
    languageVariety: String,
    voiceId: String,
    sourceRevisionId: String? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("languageVariety", languageVariety)
      .put("voiceId", voiceId)
    if (sourceRevisionId != null) body.put("sourceRevisionId", sourceRevisionId)
    return http.requestJson("POST", "/v1/voice-studio/workspace/projects/${enc(projectId)}/editions", body)
  }

  fun translateEdition(editionId: String, expectedRevision: Int? = null): JSONObject {
    val body = JSONObject()
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson("POST", "/v1/voice-studio/workspace/editions/${enc(editionId)}/translations", body)
  }

  fun generateEdition(
    editionId: String,
    expectedRevision: Int? = null,
    segmentIds: List<String>? = null,
  ): JSONObject {
    val body = JSONObject()
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    if (segmentIds != null) {
      val arr = JSONArray()
      for (id in segmentIds) arr.put(id)
      body.put("segmentIds", arr)
    }
    return http.requestJson("POST", "/v1/voice-studio/workspace/editions/${enc(editionId)}/generations", body)
  }

  fun regenerateSegment(
    editionId: String,
    stableSegmentId: String,
    translatedText: String? = null,
    expandContext: Boolean = false,
    expectedRevision: Int? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("stableSegmentId", stableSegmentId)
      .put("expandContext", expandContext)
    if (translatedText != null) body.put("translatedText", translatedText)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson("POST", "/v1/voice-studio/workspace/editions/${enc(editionId)}/regenerations", body)
  }

  fun reviewTake(
    takeId: String,
    decision: String,
    ratings: Map<String, Int>,
    qualifications: List<String> = emptyList(),
    takeHash: String? = null,
    pronunciationNotes: String? = null,
    meaningNotes: String? = null,
  ): JSONObject {
    val ratingsJson = JSONObject()
    for ((k, v) in ratings) ratingsJson.put(k, v)
    val quals = JSONArray()
    for (q in qualifications) quals.put(q)
    val body = JSONObject()
      .put("decision", decision)
      .put("ratings", ratingsJson)
      .put("qualifications", quals)
    if (takeHash != null) body.put("takeHash", takeHash)
    if (pronunciationNotes != null) body.put("pronunciationNotes", pronunciationNotes)
    if (meaningNotes != null) body.put("meaningNotes", meaningNotes)
    return http.requestJson("POST", "/v1/voice-studio/workspace/takes/${enc(takeId)}/reviews", body)
  }

  /** Binary audio for a take. Rejects non-audio / JSON error bodies. */
  fun takeAudio(takeId: String): Pair<ByteArray, HttpURLConnection> {
    val (bytes, conn) = http.requestBytes(
      "GET",
      "/v1/voice-studio/workspace/takes/${enc(takeId)}/audio",
      body = null,
      accept = "audio/*,application/octet-stream",
    )
    assertAudioPayload(bytes, conn.contentType)
    return bytes to conn
  }

  fun assembleEdition(
    editionId: String,
    takeIds: List<String>,
    pauseMs: Int = 180,
    expectedRevision: Int? = null,
  ): JSONObject {
    val arr = JSONArray()
    for (id in takeIds) arr.put(id)
    val body = JSONObject().put("takeIds", arr).put("pauseMs", pauseMs)
    if (expectedRevision != null) body.put("expectedRevision", expectedRevision)
    return http.requestJson("POST", "/v1/voice-studio/workspace/editions/${enc(editionId)}/assemblies", body)
  }

  fun assemblyAudio(assemblyId: String): Pair<ByteArray, HttpURLConnection> {
    val (bytes, conn) = http.requestBytes(
      "GET",
      "/v1/voice-studio/workspace/assemblies/${enc(assemblyId)}/audio",
      body = null,
      accept = "audio/*,application/octet-stream",
    )
    assertAudioPayload(bytes, conn.contentType)
    return bytes to conn
  }

  fun approveRelease(
    assemblyId: String,
    assemblyHash: String,
    expectedEditionRevision: Int? = null,
  ): JSONObject {
    val body = JSONObject().put("assemblyHash", assemblyHash)
    if (expectedEditionRevision != null) body.put("expectedEditionRevision", expectedEditionRevision)
    return http.requestJson("POST", "/v1/voice-studio/workspace/assemblies/${enc(assemblyId)}/approvals", body)
  }

  fun exportRelease(releaseId: String, format: String = "wav"): JSONObject =
    http.requestJson(
      "POST",
      "/v1/voice-studio/workspace/releases/${enc(releaseId)}/exports",
      JSONObject().put("format", format),
    )

  fun upsertPronunciation(
    writtenForm: String,
    value: String,
    languageVariety: String,
    scope: String = "tenant",
    projectId: String? = null,
    status: String = "awaiting_native_review",
    representation: String = "pronunciation_alias",
    notes: String = "",
  ): JSONObject {
    val body = JSONObject()
      .put("writtenForm", writtenForm)
      .put("value", value)
      .put("languageVariety", languageVariety)
      .put("scope", scope)
      .put("status", status)
      .put("representation", representation)
      .put("notes", notes)
    if (projectId != null) body.put("projectId", projectId)
    return http.requestJson("POST", "/v1/voice-studio/workspace/pronunciations", body)
  }

  /** VL-174 single-clip preview (binary). */
  fun preview(
    text: String,
    voice: String,
    language: String? = null,
    format: String = "wav",
  ): Pair<ByteArray, HttpURLConnection> {
    val body = JSONObject().put("text", text).put("voice", voice).put("format", format)
    if (language != null) body.put("language", language)
    val (bytes, conn) = http.requestBytes("POST", "/v1/voice-studio/preview", body, accept = "audio/*")
    assertAudioPayload(bytes, conn.contentType)
    return bytes to conn
  }

  private fun enc(value: String): String =
    java.net.URLEncoder.encode(value, StandardCharsets.UTF_8.name()).replace("+", "%20")

  private fun assertAudioPayload(bytes: ByteArray, contentType: String?) {
    val mime = (contentType ?: "").lowercase()
    if (mime.contains("json") || mime.contains("text") || mime.contains("html")) {
      throw LugemiException(
        message = "Voice Studio returned a non-audio payload",
        code = "provider_error",
        status = 502,
      )
    }
    if (bytes.size < 64) {
      throw LugemiException(
        message = "Voice Studio audio payload too small",
        code = "provider_error",
        status = 502,
      )
    }
    val head = String(bytes.copyOfRange(0, minOf(4, bytes.size)), StandardCharsets.US_ASCII)
    if (head.startsWith("{") || head.startsWith("<")) {
      throw LugemiException(
        message = "Voice Studio returned JSON/HTML instead of audio",
        code = "provider_error",
        status = 502,
      )
    }
  }
}
