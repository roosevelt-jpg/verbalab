package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject

/**
 * AccessLine REST client — native-language telephone logistics (simulator + admin APIs).
 * Paths under `/v1/accessline/*`. Live PSTN requires authorized Twilio provisioning.
 */
class AccessLineClient(
  private val http: LugemiHttp,
  var actorId: String? = null,
) {
  private fun headers(): Map<String, String> =
    actorId?.let { mapOf("X-AccessLine-Actor-Id" to it) } ?: emptyMap()

  fun catalog(): JSONObject =
    http.requestJson("GET", "/v1/accessline/catalog", null, extraHeaders = headers())

  fun capabilities(): JSONObject =
    http.requestJson("GET", "/v1/accessline/capabilities", null, extraHeaders = headers())

  fun metrics(): JSONObject =
    http.requestJson("GET", "/v1/accessline/metrics", null, extraHeaders = headers())

  fun listLines(): JSONObject =
    http.requestJson("GET", "/v1/accessline/lines", null, extraHeaders = headers())

  fun createLine(
    name: String,
    inboundNumber: String,
    jurisdiction: String = "KE",
    timeZone: String = "Africa/Nairobi",
    enabledLanguages: List<String> = listOf("sw-KE", "en"),
    recordingEnabled: Boolean = false,
    knowledgeSnippet: String? = null,
    integrationMode: String = "simulated",
  ): JSONObject {
    val langs = JSONArray()
    for (l in enabledLanguages) langs.put(l)
    val body = JSONObject()
      .put("name", name)
      .put("inboundNumber", inboundNumber)
      .put("jurisdiction", jurisdiction)
      .put("timeZone", timeZone)
      .put("enabledLanguages", langs)
      .put("recordingEnabled", recordingEnabled)
      .put("integrationMode", integrationMode)
    if (knowledgeSnippet != null) body.put("knowledgeSnippet", knowledgeSnippet)
    return http.requestJson("POST", "/v1/accessline/lines", body, extraHeaders = headers())
  }

  fun getLine(lineId: String): JSONObject =
    http.requestJson("GET", "/v1/accessline/lines/${enc(lineId)}", null, extraHeaders = headers())

  fun listCalls(): JSONObject =
    http.requestJson("GET", "/v1/accessline/calls", null, extraHeaders = headers())

  fun getCall(callId: String): JSONObject =
    http.requestJson("GET", "/v1/accessline/calls/${enc(callId)}", null, extraHeaders = headers())

  fun callSummary(callId: String): JSONObject =
    http.requestJson("GET", "/v1/accessline/calls/${enc(callId)}/summary", null, extraHeaders = headers())

  fun requestHandoff(
    callId: String,
    reason: String = "api_requested",
    destinationId: String? = null,
    idempotencyKey: String? = null,
  ): JSONObject {
    val body = JSONObject().put("reason", reason)
    if (destinationId != null) body.put("destinationId", destinationId)
    if (idempotencyKey != null) body.put("idempotencyKey", idempotencyKey)
    return http.requestJson("POST", "/v1/accessline/calls/${enc(callId)}/handoff", body, extraHeaders = headers())
  }

  fun simulateStart(lineId: String, callerId: String? = null): JSONObject {
    val body = JSONObject().put("lineId", lineId)
    if (callerId != null) body.put("callerId", callerId)
    return http.requestJson("POST", "/v1/accessline/simulate/start", body, extraHeaders = headers())
  }

  fun simulateDtmf(callId: String, digits: String): JSONObject =
    http.requestJson(
      "POST",
      "/v1/accessline/simulate/${enc(callId)}/dtmf",
      JSONObject().put("digits", digits),
      headers(),
    )

  fun simulateSpeech(callId: String, text: String): JSONObject =
    http.requestJson(
      "POST",
      "/v1/accessline/simulate/${enc(callId)}/speech",
      JSONObject().put("text", text),
      headers(),
    )

  fun simulateHangup(callId: String): JSONObject =
    http.requestJson("POST", "/v1/accessline/simulate/${enc(callId)}/hangup", JSONObject(), extraHeaders = headers())

  private fun enc(value: String): String =
    java.net.URLEncoder.encode(value, Charsets.UTF_8.name()).replace("+", "%20")
}
