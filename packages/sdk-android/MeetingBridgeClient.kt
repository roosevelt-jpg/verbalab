package com.lugemi.sdk

import org.json.JSONArray
import org.json.JSONObject

/**
 * MeetingBridge REST client — multilingual meetings with revision-linked transcripts
 * and explicit confirmations. Paths under `/v1/meetingbridge/*`.
 */
class MeetingBridgeClient(
  private val http: LugemiHttp,
  var actorId: String? = null,
) {
  private fun headers(): Map<String, String> =
    actorId?.let { mapOf("X-MeetingBridge-Actor-Id" to it) } ?: emptyMap()

  fun catalog(): JSONObject =
    http.requestJson("GET", "/v1/meetingbridge/catalog", null, extraHeaders = headers())

  fun peekInvite(token: String): JSONObject =
    http.requestJson("GET", "/v1/meetingbridge/invites/${enc(token)}", null, extraHeaders = headers())

  fun listMeetings(): JSONObject =
    http.requestJson("GET", "/v1/meetingbridge/meetings", null, extraHeaders = headers())

  fun createMeeting(
    title: String,
    agenda: String? = null,
    timeZone: String = "Africa/Accra",
    corridor: String = "en-ak",
    speakingLanguage: String = "en",
    listeningLanguage: String = "ak",
    maxParticipants: Int = 6,
    isDemo: Boolean = false,
  ): JSONObject {
    val body = JSONObject()
      .put("title", title)
      .put("timeZone", timeZone)
      .put("corridor", corridor)
      .put("speakingLanguage", speakingLanguage)
      .put("listeningLanguage", listeningLanguage)
      .put("maxParticipants", maxParticipants)
      .put("isDemo", isDemo)
    if (agenda != null) body.put("agenda", agenda)
    return http.requestJson("POST", "/v1/meetingbridge/meetings", body, extraHeaders = headers())
  }

  fun getMeeting(meetingId: String): JSONObject =
    http.requestJson("GET", "/v1/meetingbridge/meetings/${enc(meetingId)}", null, extraHeaders = headers())

  fun createInvite(meetingId: String, expiresInHours: Int? = null): JSONObject {
    val body = JSONObject()
    if (expiresInHours != null) body.put("expiresInHours", expiresInHours)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/invites",
      body,
      extraHeaders = headers(),
    )
  }

  fun join(
    meetingId: String,
    token: String,
    speakingLanguage: String,
    listeningLanguage: String,
    listeningMode: String = "captions_only",
  ): JSONObject {
    val body = JSONObject()
      .put("token", token)
      .put("speakingLanguage", speakingLanguage)
      .put("listeningLanguage", listeningLanguage)
      .put("listeningMode", listeningMode)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/join",
      body,
      extraHeaders = headers(),
    )
  }

  fun openLobby(meetingId: String): JSONObject =
    http.requestJson("POST", "/v1/meetingbridge/meetings/${enc(meetingId)}/lobby", JSONObject(), extraHeaders = headers())

  fun start(meetingId: String): JSONObject =
    http.requestJson("POST", "/v1/meetingbridge/meetings/${enc(meetingId)}/start", JSONObject(), extraHeaders = headers())

  fun updatePreferences(
    meetingId: String,
    speakingLanguage: String? = null,
    listeningLanguage: String? = null,
    listeningMode: String? = null,
  ): JSONObject {
    val body = JSONObject()
    if (speakingLanguage != null) body.put("speakingLanguage", speakingLanguage)
    if (listeningLanguage != null) body.put("listeningLanguage", listeningLanguage)
    if (listeningMode != null) body.put("listeningMode", listeningMode)
    return http.requestJson(
      "PATCH",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/members/me",
      body,
      extraHeaders = headers(),
    )
  }

  fun correctUtterance(meetingId: String, utteranceId: String, text: String, reason: String? = null): JSONObject {
    val body = JSONObject().put("utteranceId", utteranceId).put("text", text)
    if (reason != null) body.put("reason", reason)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/utterance-corrections",
      body,
      extraHeaders = headers(),
    )
  }

  fun commitUtterance(meetingId: String, text: String, language: String? = null): JSONObject {
    val body = JSONObject().put("text", text)
    if (language != null) body.put("language", language)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/utterances",
      body,
      extraHeaders = headers(),
    )
  }

  fun proposeItem(
    meetingId: String,
    kind: String,
    wording: String,
    ownerParticipantIds: List<String>? = null,
    dueDate: String? = null,
  ): JSONObject {
    val body = JSONObject().put("kind", kind).put("wording", wording)
    if (ownerParticipantIds != null) {
      val arr = JSONArray()
      for (id in ownerParticipantIds) arr.put(id)
      body.put("ownerParticipantIds", arr)
    }
    if (dueDate != null) body.put("dueDate", dueDate)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/items",
      body,
      extraHeaders = headers(),
    )
  }

  fun confirmItem(
    itemId: String,
    meetingId: String,
    action: String,
    idempotencyKey: String,
    note: String? = null,
  ): JSONObject {
    val body = JSONObject()
      .put("meetingId", meetingId)
      .put("action", action)
      .put("idempotencyKey", idempotencyKey)
    if (note != null) body.put("note", note)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/items/${enc(itemId)}/confirmations",
      body,
      extraHeaders = headers(),
    )
  }

  fun reviseItem(
    itemId: String,
    meetingId: String,
    expectedRevision: Int,
    wording: String? = null,
    dueDate: String? = null,
  ): JSONObject {
    val body = JSONObject().put("meetingId", meetingId).put("expectedRevision", expectedRevision)
    if (wording != null) body.put("wording", wording)
    if (dueDate != null) body.put("dueDate", dueDate)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/items/${enc(itemId)}/revisions",
      body,
      extraHeaders = headers(),
    )
  }

  fun syncItem(
    itemId: String,
    meetingId: String,
    idempotencyKey: String,
    destination: String = "private_download",
  ): JSONObject {
    val body = JSONObject()
      .put("meetingId", meetingId)
      .put("idempotencyKey", idempotencyKey)
      .put("destination", destination)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/items/${enc(itemId)}/sync",
      body,
      extraHeaders = headers(),
    )
  }

  fun handoffDealBridge(meetingId: String): JSONObject =
    http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/handoff/dealbridge",
      JSONObject(),
      extraHeaders = headers(),
    )

  fun handoffVoiceBridge(meetingId: String): JSONObject =
    http.requestJson(
      "POST",
      "/v1/meetingbridge/meetings/${enc(meetingId)}/handoff/voicebridge",
      JSONObject(),
      extraHeaders = headers(),
    )

  fun close(meetingId: String): JSONObject =
    http.requestJson("POST", "/v1/meetingbridge/meetings/${enc(meetingId)}/close", JSONObject(), extraHeaders = headers())

  fun issueMinutes(meetingId: String): JSONObject =
    http.requestJson("POST", "/v1/meetingbridge/meetings/${enc(meetingId)}/minutes", JSONObject(), extraHeaders = headers())

  fun exportMinutes(
    minutesId: String,
    meetingId: String,
    format: String = "markdown",
    idempotencyKey: String,
  ): JSONObject {
    val body = JSONObject()
      .put("meetingId", meetingId)
      .put("format", format)
      .put("idempotencyKey", idempotencyKey)
    return http.requestJson(
      "POST",
      "/v1/meetingbridge/minutes/${enc(minutesId)}/exports",
      body,
      extraHeaders = headers(),
    )
  }

  private fun enc(value: String): String = java.net.URLEncoder.encode(value, Charsets.UTF_8.name())
}
