import Foundation

public struct LugemiHttp: @unchecked Sendable {
  public var apiKey: String
  public var baseURL: URL
  public var session: URLSession
  public var organizationId: String?
  public var workspaceId: String?

  public init(
    apiKey: String,
    baseURL: URL = URL(string: "https://api.lugemi.com")!,
    session: URLSession = .shared,
    organizationId: String? = nil,
    workspaceId: String? = nil
  ) {
    self.apiKey = apiKey
    self.baseURL = baseURL
    self.session = session
    self.organizationId = organizationId
    self.workspaceId = workspaceId
  }

  public func requestJSON(
    path: String,
    method: String,
    json: [String: Any]?,
    extraHeaders: [String: String] = [:]
  ) async throws -> [String: Any] {
    let (data, response) = try await send(
      path: path,
      method: method,
      json: json,
      multipart: nil,
      accept: "application/json",
      extraHeaders: extraHeaders
    )
    return try Self.decodeJSON(data: data, response: response)
  }

  public func requestBytes(
    path: String,
    method: String,
    json: [String: Any]?,
    accept: String = "*/*",
    extraHeaders: [String: String] = [:]
  ) async throws -> (Data, HTTPURLResponse) {
    let (data, response) = try await send(
      path: path,
      method: method,
      json: json,
      multipart: nil,
      accept: accept,
      extraHeaders: extraHeaders
    )
    guard let http = response as? HTTPURLResponse else { throw LugemiError.invalidResponse }
    if !(200...299).contains(http.statusCode) {
      throw try Self.decodeError(data: data, status: http.statusCode)
    }
    return (data, http)
  }

  public func multipartJSON(
    path: String,
    fields: [String: String],
    fileField: String,
    filename: String,
    mimeType: String,
    fileData: Data,
    extraHeaders: [String: String] = [:]
  ) async throws -> [String: Any] {
    let boundary = "Lugemi\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
    var body = Data()
    for (k, v) in fields {
      body.append("--\(boundary)\r\n".data(using: .utf8)!)
      body.append("Content-Disposition: form-data; name=\"\(k)\"\r\n\r\n".data(using: .utf8)!)
      body.append("\(v)\r\n".data(using: .utf8)!)
    }
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append(
      "Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(filename)\"\r\n"
        .data(using: .utf8)!
    )
    body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
    body.append(fileData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    let (data, response) = try await send(
      path: path,
      method: "POST",
      json: nil,
      multipart: (boundary, body),
      accept: "application/json",
      extraHeaders: extraHeaders
    )
    return try Self.decodeJSON(data: data, response: response)
  }

  /// SSE translate stream — yields parsed `data:` JSON objects.
  public func streamSSE(
    path: String,
    json: [String: Any],
    extraHeaders: [String: String] = [:]
  ) -> AsyncThrowingStream<[String: Any], Error> {
    AsyncThrowingStream { continuation in
      Task {
        do {
          var headers = extraHeaders
          headers["Accept"] = "text/event-stream"
          let (bytes, response) = try await send(
            path: path,
            method: "POST",
            json: json,
            multipart: nil,
            accept: "text/event-stream",
            extraHeaders: headers
          )
          guard let http = response as? HTTPURLResponse else {
            throw LugemiError.invalidResponse
          }
          if !(200...299).contains(http.statusCode) {
            throw try Self.decodeError(data: bytes, status: http.statusCode)
          }
          // URLSession buffers the full body for non-streaming APIs; parse SSE frames from it.
          let text = String(data: bytes, encoding: .utf8) ?? ""
          for block in text.components(separatedBy: "\n\n") {
            guard let dataLine = block
              .split(separator: "\n")
              .map({ String($0).trimmingCharacters(in: .whitespaces) })
              .first(where: { $0.hasPrefix("data:") })
            else { continue }
            let payload = dataLine.dropFirst(5).trimmingCharacters(in: .whitespaces)
            guard !payload.isEmpty,
                  let raw = payload.data(using: .utf8),
                  let obj = try JSONSerialization.jsonObject(with: raw) as? [String: Any]
            else { continue }
            continuation.yield(obj)
          }
          continuation.finish()
        } catch {
          continuation.finish(throwing: error)
        }
      }
    }
  }

  private func send(
    path: String,
    method: String,
    json: [String: Any]?,
    multipart: (String, Data)?,
    accept: String,
    extraHeaders: [String: String]
  ) async throws -> (Data, URLResponse) {
    let root = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard let url = URL(string: root + path) else { throw LugemiError.invalidResponse }
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
    request.setValue(accept, forHTTPHeaderField: "Accept")
    if let organizationId { request.setValue(organizationId, forHTTPHeaderField: "X-Lugemi-Organization-Id") }
    if let workspaceId { request.setValue(workspaceId, forHTTPHeaderField: "X-Lugemi-Workspace-Id") }
    for (k, v) in extraHeaders { request.setValue(v, forHTTPHeaderField: k) }
    if let multipart {
      request.setValue("multipart/form-data; boundary=\(multipart.0)", forHTTPHeaderField: "Content-Type")
      request.httpBody = multipart.1
    } else if let json {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = try JSONSerialization.data(withJSONObject: json)
    } else if method == "POST" || method == "PATCH" {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = Data("{}".utf8)
    }
    return try await session.data(for: request)
  }

  static func decodeJSON(data: Data, response: URLResponse) throws -> [String: Any] {
    guard let http = response as? HTTPURLResponse else { throw LugemiError.invalidResponse }
    if !(200...299).contains(http.statusCode) {
      throw try decodeError(data: data, status: http.statusCode)
    }
    if data.isEmpty { return [:] }
    let obj = try JSONSerialization.jsonObject(with: data)
    return obj as? [String: Any] ?? [:]
  }

  static func decodeError(data: Data, status: Int) throws -> LugemiError {
    if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       let err = obj["error"] as? [String: Any],
       let message = err["message"] as? String {
      return .api(
        message: message,
        code: err["code"] as? String,
        status: status,
        requestId: err["request_id"] as? String
      )
    }
    return .api(message: "Request failed (\(status))", code: nil, status: status, requestId: nil)
  }
}

/// Retries multipart uploads with backoff. Uses upload-auth limits when provided.
public struct ResumableUploader: Sendable {
  private let http: LugemiHttp
  private let maxAttempts: Int
  private let initialBackoffNs: UInt64

  public init(http: LugemiHttp, maxAttempts: Int = 4, initialBackoffMs: UInt64 = 500) {
    self.http = http
    self.maxAttempts = maxAttempts
    self.initialBackoffNs = initialBackoffMs * 1_000_000
  }

  public func uploadMultipart(
    path: String,
    fields: [String: String],
    fileField: String,
    filename: String,
    mimeType: String,
    fileData: Data,
    maxBytes: Int64? = nil,
    extraHeaders: [String: String] = [:],
    onProgress: (@Sendable (UploadProgress) -> Void)? = nil
  ) async throws -> [String: Any] {
    if let maxBytes, Int64(fileData.count) > maxBytes {
      throw LugemiError.api(
        message: "Upload exceeds maxBytes (\(maxBytes))",
        code: "validation_error",
        status: 400,
        requestId: nil
      )
    }
    var attempt = 0
    var last: Error?
    while attempt < maxAttempts {
      attempt += 1
      onProgress?(
        UploadProgress(bytesSent: 0, totalBytes: Int64(fileData.count), attempt: attempt)
      )
      do {
        let result = try await http.multipartJSON(
          path: path,
          fields: fields,
          fileField: fileField,
          filename: filename,
          mimeType: mimeType,
          fileData: fileData,
          extraHeaders: extraHeaders
        )
        onProgress?(
          UploadProgress(
            bytesSent: Int64(fileData.count),
            totalBytes: Int64(fileData.count),
            attempt: attempt
          )
        )
        return result
      } catch let err as LugemiError {
        last = err
        if case let .api(_, _, status, _) = err, [400, 401, 403, 404, 409, 413, 422].contains(status) {
          throw err
        }
        if attempt >= maxAttempts { throw err }
        try await Task.sleep(nanoseconds: initialBackoffNs * UInt64(attempt))
      } catch {
        last = error
        if attempt >= maxAttempts {
          throw LugemiError.api(message: error.localizedDescription, code: "upload_failed", status: 0, requestId: nil)
        }
        try await Task.sleep(nanoseconds: initialBackoffNs * UInt64(attempt))
      }
    }
    throw last ?? LugemiError.api(message: "Upload failed", code: "upload_failed", status: 0, requestId: nil)
  }
}
