package com.lugemi.sdk

/**
 * Kotlin stub for the Lugemi Android SDK.
 * Implement against the same REST contracts as @lugemi/sdk.
 */
data class SpeechRequest(
  val text: String,
  val voice: String,
  val language: String? = null,
)

data class TranslateRequest(
  val text: String,
  val source: String = "auto",
  val target: String,
)

interface LugemiClient {
  suspend fun speech(request: SpeechRequest): ByteArray
  suspend fun translate(request: TranslateRequest): Map<String, Any?>
  suspend fun languages(): List<Map<String, Any?>>
  suspend fun simulateVoice(text: String): Map<String, Any?>
}

class LugemiHttpClient(
  private val apiKey: String,
  private val baseUrl: String = "https://api.lugemi.com",
) : LugemiClient {
  // Wire OkHttp / Ktor here — contracts match packages/sdk.
  override suspend fun speech(request: SpeechRequest): ByteArray =
    error("Implement POST $baseUrl/v1/audio/speech with Bearer $apiKey")

  override suspend fun translate(request: TranslateRequest): Map<String, Any?> =
    error("Implement POST $baseUrl/v1/translate")

  override suspend fun languages(): List<Map<String, Any?>> =
    error("Implement GET $baseUrl/v1/languages")

  override suspend fun simulateVoice(text: String): Map<String, Any?> =
    error("Implement POST $baseUrl/v1/voice/simulate")
}
