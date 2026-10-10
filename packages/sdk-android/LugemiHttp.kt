package com.lugemi.sdk

import org.json.JSONObject
import java.io.BufferedReader
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.ProtocolException
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.UUID

/** Shared HTTP transport for Lugemi Android clients. */
class LugemiHttp(
  val apiKey: String,
  val baseUrl: String = "https://api.lugemi.com",
  var organizationId: String? = null,
  var workspaceId: String? = null,
  var connectTimeoutMs: Int = 30_000,
  var readTimeoutMs: Int = 180_000,
) {
  fun open(
    method: String,
    path: String,
    extraHeaders: Map<String, String> = emptyMap(),
  ): HttpURLConnection {
    val url = URL(baseUrl.trimEnd('/') + path)
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = connectTimeoutMs
    conn.readTimeout = readTimeoutMs
    conn.doInput = true
    conn.setRequestProperty("Authorization", "Bearer $apiKey")
    organizationId?.let { conn.setRequestProperty("X-Lugemi-Organization-Id", it) }
    workspaceId?.let { conn.setRequestProperty("X-Lugemi-Workspace-Id", it) }
    for ((k, v) in extraHeaders) conn.setRequestProperty(k, v)
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

  fun requestJson(
    method: String,
    path: String,
    body: JSONObject? = null,
    extraHeaders: Map<String, String> = emptyMap(),
  ): JSONObject {
    val conn = open(method, path, extraHeaders)
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("Accept", "application/json")
    if (body != null) {
      conn.doOutput = true
      conn.outputStream.use { it.write(body.toString().toByteArray(StandardCharsets.UTF_8)) }
    }
    return readJson(conn)
  }

  fun requestBytes(
    method: String,
    path: String,
    body: JSONObject? = null,
    accept: String = "*/*",
    extraHeaders: Map<String, String> = emptyMap(),
    onBytes: ((ByteArray) -> Unit)? = null,
  ): Pair<ByteArray, HttpURLConnection> {
    val conn = open(method, path, extraHeaders)
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("Accept", accept)
    if (body != null) {
      conn.doOutput = true
      conn.outputStream.use { it.write(body.toString().toByteArray(StandardCharsets.UTF_8)) }
    }
    val code = conn.responseCode
    if (code !in 200..299) throw httpError(conn, code)
    val stream = conn.inputStream
    if (onBytes == null) {
      return stream.readBytes() to conn
    }
    val out = ByteArrayOutputStream()
    val buf = ByteArray(16 * 1024)
    while (true) {
      val n = stream.read(buf)
      if (n < 0) break
      val chunk = buf.copyOf(n)
      out.write(chunk)
      onBytes(chunk)
    }
    return out.toByteArray() to conn
  }

  fun multipartJson(
    method: String,
    path: String,
    fields: Map<String, String>,
    fileField: String,
    filename: String,
    mimeType: String,
    fileBytes: ByteArray,
    extraHeaders: Map<String, String> = emptyMap(),
    onProgress: ((UploadProgress) -> Unit)? = null,
  ): JSONObject {
    val boundary = "----Lugemi${UUID.randomUUID().toString().replace("-", "")}"
    val conn = open(method, path, extraHeaders)
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
      val total = fileBytes.size.toLong()
      var sent = 0L
      val chunk = 64 * 1024
      var offset = 0
      while (offset < fileBytes.size) {
        val n = minOf(chunk, fileBytes.size - offset)
        out.write(fileBytes, offset, n)
        offset += n
        sent += n
        onProgress?.invoke(UploadProgress(sent, total, attempt = 1))
      }
      out.writeBytes("\r\n--$boundary--\r\n")
    }
    return readJson(conn)
  }

  /** Parse SSE `data:` frames from translate/stream. */
  fun readSseEvents(
    method: String,
    path: String,
    body: JSONObject,
    extraHeaders: Map<String, String> = emptyMap(),
  ): Sequence<JSONObject> {
    val headers = extraHeaders.toMutableMap()
    headers["Accept"] = "text/event-stream"
    val conn = open(method, path, headers)
    conn.setRequestProperty("Content-Type", "application/json")
    conn.doOutput = true
    conn.outputStream.use { it.write(body.toString().toByteArray(StandardCharsets.UTF_8)) }
    val code = conn.responseCode
    if (code !in 200..299) throw httpError(conn, code)
    val reader = BufferedReader(conn.inputStream.reader(StandardCharsets.UTF_8))
    return sequence {
      val buf = StringBuilder()
      while (true) {
        val line = reader.readLine() ?: break
        if (line.isEmpty()) {
          val block = buf.toString()
          buf.clear()
          val dataLine = block.lineSequence()
            .map { it.trim() }
            .firstOrNull { it.startsWith("data:") }
            ?: continue
          val json = dataLine.removePrefix("data:").trim()
          if (json.isNotEmpty()) {
            yield(JSONObject(json))
          }
        } else {
          buf.append(line).append('\n')
        }
      }
      reader.close()
      conn.disconnect()
    }
  }

  fun readJson(conn: HttpURLConnection): JSONObject {
    val code = conn.responseCode
    val stream: InputStream? = if (code in 200..299) conn.inputStream else conn.errorStream
    val text = stream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    if (code !in 200..299) {
      throw parseError(text, code)
    }
    return if (text.isBlank()) JSONObject() else JSONObject(text)
  }

  fun httpError(conn: HttpURLConnection, code: Int): LugemiException {
    val text = conn.errorStream?.bufferedReader(StandardCharsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    return parseError(text, code)
  }

  fun parseError(text: String, code: Int): LugemiException {
    val err = runCatching { JSONObject(text) }.getOrNull()?.optJSONObject("error")
    return LugemiException(
      message = err?.optString("message") ?: text.ifBlank { "Request failed ($code)" },
      code = err?.optString("code")?.ifBlank { null },
      status = code,
      requestId = err?.optString("request_id")?.ifBlank { null },
    )
  }
}

/**
 * Retries multipart media uploads with backoff + progress.
 * Server upload-auth is used for limits; full chunked resume lands when the API exposes upload IDs.
 */
class ResumableUploader(
  private val http: LugemiHttp,
  private val maxAttempts: Int = 4,
  private val initialBackoffMs: Long = 500,
) {
  fun uploadMultipart(
    path: String,
    fields: Map<String, String>,
    fileField: String,
    filename: String,
    mimeType: String,
    fileBytes: ByteArray,
    maxBytes: Long? = null,
    extraHeaders: Map<String, String> = emptyMap(),
    onProgress: ((UploadProgress) -> Unit)? = null,
  ): JSONObject {
    if (maxBytes != null && fileBytes.size.toLong() > maxBytes) {
      throw LugemiException(
        "Upload exceeds maxBytes ($maxBytes)",
        code = "validation_error",
        status = 400,
      )
    }
    var attempt = 0
    var last: Exception? = null
    while (attempt < maxAttempts) {
      attempt += 1
      try {
        return http.multipartJson(
          method = "POST",
          path = path,
          fields = fields,
          fileField = fileField,
          filename = filename,
          mimeType = mimeType,
          fileBytes = fileBytes,
          extraHeaders = extraHeaders,
          onProgress = { p -> onProgress?.invoke(p.copy(attempt = attempt)) },
        )
      } catch (e: LugemiException) {
        last = e
        if (e.status in listOf(400, 401, 403, 404, 409, 413, 422)) throw e
        if (attempt >= maxAttempts) throw e
        Thread.sleep(initialBackoffMs * attempt)
      } catch (e: Exception) {
        last = e
        if (attempt >= maxAttempts) {
          throw LugemiException(e.message ?: "Upload failed", code = "upload_failed", status = null)
        }
        Thread.sleep(initialBackoffMs * attempt)
      }
    }
    throw last ?: LugemiException("Upload failed", code = "upload_failed")
  }
}
