/**
 * Decides what a request body looks like to a handler, from its `Content-Type` and its bytes.
 *
 * The bytes are never altered. What changes is only what ends up on `request.body`:
 *
 * - JSON (`application/json`, any `+json` type): the parsed value. Malformed JSON falls back to
 *   the decoded text so a handler can decide how to react.
 * - Text (`text/*`, `application/x-www-form-urlencoded`, `application/xml`,
 *   `application/javascript`, or any type whose parameters name a `charset`): the string,
 *   decoded with that charset when given and UTF-8 otherwise.
 * - Everything else (`audio/*`, `image/*`, `video/*`, `application/octet-stream`, an unknown
 *   type, or no `Content-Type` at all): the `Buffer`, untouched.
 *
 * `KernelHttpServer` keeps the `Buffer` on `request.rawBody` in every case.
 */
export class RequestBodyDecoder {
  private static readonly textMediaTypes: ReadonlySet<string> = new Set([
    "application/x-www-form-urlencoded",
    "application/xml",
    "application/javascript",
  ]);

  /**
   * Returns the value to expose on `request.body` for these bytes.
   *
   * @param contentTypeHeader The raw `Content-Type` header value, or `undefined` when absent.
   * @param bytes The complete request body.
   */
  public static decode(contentTypeHeader: string | undefined, bytes: Buffer): unknown {
    const {mediaType, charset} = RequestBodyDecoder.parseContentType(contentTypeHeader);

    if (RequestBodyDecoder.isJson(mediaType)) {
      const text = RequestBodyDecoder.decodeText(bytes, charset);
      try {
        return JSON.parse(text);
      } catch {
        // Malformed JSON: keep the text so handlers can decide how to react. The networking
        // RequestBodyConverterInterceptor answers 400 for a string body under application/json.
        return text;
      }
    }

    if (RequestBodyDecoder.isText(mediaType, charset)) {
      return RequestBodyDecoder.decodeText(bytes, charset);
    }

    return bytes;
  }

  /**
   * Splits a `Content-Type` header into its lower-cased media type and its `charset` parameter.
   * `text/plain; charset=ISO-8859-1` gives `{mediaType: "text/plain", charset: "iso-8859-1"}`.
   */
  public static parseContentType(contentTypeHeader: string | undefined): { mediaType: string; charset?: string } {
    if (contentTypeHeader === undefined) {
      return {mediaType: ""};
    }

    const [type, ...parameters] = contentTypeHeader.split(";");
    const mediaType = type.trim().toLowerCase();

    let charset: string | undefined;
    for (const parameter of parameters) {
      const separator = parameter.indexOf("=");
      if (separator === -1) {
        continue;
      }

      const name = parameter.slice(0, separator).trim().toLowerCase();
      if (name !== "charset") {
        continue;
      }

      const value = parameter.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1").toLowerCase();
      if (value !== "") {
        charset = value;
      }
    }

    return {mediaType, charset};
  }

  public static isJson(mediaType: string): boolean {
    return mediaType === "application/json" || mediaType.endsWith("+json");
  }

  public static isText(mediaType: string, charset: string | undefined): boolean {
    if (charset !== undefined) {
      return true;
    }

    return mediaType.startsWith("text/") || RequestBodyDecoder.textMediaTypes.has(mediaType);
  }

  /**
   * Decodes bytes with the given charset. Unknown or unsupported charsets fall back to UTF-8
   * rather than failing the request: the bytes stay available on `rawBody` either way.
   */
  public static decodeText(bytes: Buffer, charset: string | undefined): string {
    if (charset === undefined || charset === "utf-8" || charset === "utf8") {
      return bytes.toString("utf8");
    }

    try {
      return new TextDecoder(charset).decode(bytes);
    } catch {
      return bytes.toString("utf8");
    }
  }
}
