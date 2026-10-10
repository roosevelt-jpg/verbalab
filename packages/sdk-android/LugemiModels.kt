package com.lugemi.sdk

import org.json.JSONObject

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
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is SpeechResult) return false
    return audio.contentEquals(other.audio) &&
      mimeType == other.mimeType &&
      voice == other.voice &&
      provider == other.provider &&
      characters == other.characters
  }

  override fun hashCode(): Int =
    31 * audio.contentHashCode() + mimeType.hashCode()
}

data class TranslateRequest(
  val text: String,
  val source: String = "auto",
  val target: String,
)

data class DetectResult(
  val language: String,
  val confidence: Double,
  val provider: String,
  val characters: Int? = null,
) {
  companion object {
    fun from(json: JSONObject) = DetectResult(
      language = json.optString("language"),
      confidence = json.optDouble("confidence", 0.0),
      provider = json.optString("provider"),
      characters = if (json.has("characters")) json.optInt("characters") else null,
    )
  }
}

data class TranslateResult(
  val text: String,
  val source: String,
  val target: String? = null,
  val provider: String? = null,
  val characters: Int? = null,
  val detection: DetectResult? = null,
) {
  companion object {
    fun from(json: JSONObject, fallbackSource: String = "auto", fallbackTarget: String? = null) =
      TranslateResult(
        text = json.optString("text"),
        source = json.optString("source", fallbackSource),
        target = if (json.has("target")) json.optString("target") else fallbackTarget,
        provider = json.optString("provider").ifBlank { null },
        characters = if (json.has("characters")) json.optInt("characters") else null,
        detection = json.optJSONObject("detection")?.let { DetectResult.from(it) },
      )
  }
}

sealed class TranslateStreamEvent {
  data class Start(val chunkCount: Int, val source: String, val target: String) : TranslateStreamEvent()
  data class Chunk(
    val index: Int,
    val text: String,
    val characters: Int? = null,
    val provider: String? = null,
    val tmHit: Boolean? = null,
  ) : TranslateStreamEvent()
  data class Done(val text: String, val chunkCount: Int) : TranslateStreamEvent()
  data class Error(val message: String) : TranslateStreamEvent()

  companion object {
    fun from(json: JSONObject): TranslateStreamEvent {
      return when (json.optString("event")) {
        "start" -> Start(
          chunkCount = json.optInt("chunkCount"),
          source = json.optString("source"),
          target = json.optString("target"),
        )
        "chunk" -> Chunk(
          index = json.optInt("index"),
          text = json.optString("text"),
          characters = if (json.has("characters")) json.optInt("characters") else null,
          provider = json.optString("provider").ifBlank { null },
          tmHit = if (json.has("tmHit")) json.optBoolean("tmHit") else null,
        )
        "done" -> Done(text = json.optString("text"), chunkCount = json.optInt("chunkCount"))
        "error" -> Error(message = json.optString("message", "stream error"))
        else -> Error(message = "Unknown stream event: ${json.optString("event")}")
      }
    }
  }
}

data class TranscribeResult(
  val text: String,
  val language: String? = null,
  val durationSeconds: Double? = null,
  val durationMinutes: Double? = null,
  val provider: String? = null,
  val raw: JSONObject? = null,
) {
  companion object {
    fun from(json: JSONObject) = TranscribeResult(
      text = json.optString("text"),
      language = json.optString("language").ifBlank { null },
      durationSeconds = if (json.has("durationSeconds")) json.optDouble("durationSeconds") else null,
      durationMinutes = if (json.has("durationMinutes")) json.optDouble("durationMinutes") else null,
      provider = json.optString("provider").ifBlank { null },
      raw = json,
    )
  }
}

data class SpeechRecognizeSegment(
  val id: Int,
  val start: Double,
  val end: Double,
  val text: String,
  val confidence: Double? = null,
)

data class SpeechRecognizeResult(
  val text: String,
  val language: String? = null,
  val durationSeconds: Double? = null,
  val durationMinutes: Double? = null,
  val provider: String? = null,
  val confidence: Double? = null,
  val segments: List<SpeechRecognizeSegment> = emptyList(),
  val vocabularyApplied: Boolean = false,
  val industryPacks: List<String> = emptyList(),
  val raw: JSONObject? = null,
) {
  companion object {
    fun from(json: JSONObject): SpeechRecognizeResult {
      val segs = mutableListOf<SpeechRecognizeSegment>()
      val arr = json.optJSONArray("segments")
      if (arr != null) {
        for (i in 0 until arr.length()) {
          val s = arr.optJSONObject(i) ?: continue
          segs.add(
            SpeechRecognizeSegment(
              id = s.optInt("id"),
              start = s.optDouble("start"),
              end = s.optDouble("end"),
              text = s.optString("text"),
              confidence = if (s.has("confidence")) s.optDouble("confidence") else null,
            ),
          )
        }
      }
      val packs = mutableListOf<String>()
      val p = json.optJSONArray("industryPacks")
      if (p != null) for (i in 0 until p.length()) packs.add(p.optString(i))
      return SpeechRecognizeResult(
        text = json.optString("text"),
        language = json.optString("language").ifBlank { null },
        durationSeconds = if (json.has("durationSeconds")) json.optDouble("durationSeconds") else null,
        durationMinutes = if (json.has("durationMinutes")) json.optDouble("durationMinutes") else null,
        provider = json.optString("provider").ifBlank { null },
        confidence = if (json.has("confidence") && !json.isNull("confidence")) json.optDouble("confidence") else null,
        segments = segs,
        vocabularyApplied = json.optBoolean("vocabularyApplied"),
        industryPacks = packs,
        raw = json,
      )
    }
  }
}

data class UploadAuth(
  val maxBytes: Long,
  val maxRecordingSeconds: Int? = null,
  val allowedMimeTypes: List<String> = emptyList(),
  val uploadPath: String,
  val expiresAt: String? = null,
) {
  companion object {
    fun from(json: JSONObject): UploadAuth {
      val types = mutableListOf<String>()
      val arr = json.optJSONArray("allowedMimeTypes")
      if (arr != null) for (i in 0 until arr.length()) types.add(arr.optString(i))
      return UploadAuth(
        maxBytes = json.optLong("maxBytes"),
        maxRecordingSeconds = if (json.has("maxRecordingSeconds")) json.optInt("maxRecordingSeconds") else null,
        allowedMimeTypes = types,
        uploadPath = json.optString("uploadPath"),
        expiresAt = json.optString("expiresAt").ifBlank { null },
      )
    }
  }
}

data class UploadProgress(
  val bytesSent: Long,
  val totalBytes: Long,
  val attempt: Int,
) {
  val fraction: Double get() = if (totalBytes <= 0) 0.0 else bytesSent.toDouble() / totalBytes.toDouble()
}

class LugemiException(
  message: String,
  val code: String? = null,
  val status: Int? = null,
  val requestId: String? = null,
) : RuntimeException(message) {
  val isConflict: Boolean get() = status == 409 || code == "conflict"
  val isFeatureDisabled: Boolean get() = code == "feature_disabled" || status == 403
  val isAuthError: Boolean get() = status == 401 || status == 503 || code == "auth_not_configured" || code == "actor_required"
}
