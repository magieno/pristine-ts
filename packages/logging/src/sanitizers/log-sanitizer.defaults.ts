/**
 * The defaults of the log sanitizer. They are exported so an application can build on them, for
 * example to keep the default keys and add its own in a custom configuration.
 */
export const LogSanitizerDefaults = {
  /**
   * The keys whose value is a secret. A key is compared without its case and without the
   * characters that are not letters or digits, and it matches when it is one of these or ENDS with
   * one of these: `Authorization`, `x-api-key`, `refresh_token`, `hubToken` and `clientSecret` all
   * match. `tokenCount` does not: it does not end with `token`.
   */
  sensitiveKeys: [
    "authorization",
    "cookie",
    "password",
    "passwd",
    "passphrase",
    "secret",
    "token",
    "apikey",
    "privatekey",
    "credentials",
  ] as readonly string[],

  /**
   * Regular expressions (their source, flags `g`) for a secret that sits INSIDE a string, whatever
   * the key: in a message, in a URL, in an array of raw headers.
   *
   * - A `Bearer` or `Basic` credential of an `Authorization` header.
   * - A JSON Web Token: three base64url parts, the first two start as an encoded `{"`.
   */
  sensitiveValuePatterns: [
    "\\b(?:Bearer|Basic)\\s+[A-Za-z0-9._~+/=-]{8,}",
    "\\beyJ[A-Za-z0-9_-]{8,}\\.eyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]*",
  ] as readonly string[],

  /**
   * What replaces a secret.
   */
  replacement: "[REDACTED]",

  /**
   * How deep the sanitizer goes into an object. What is deeper is replaced, not kept: a secret
   * must not get out because it was deep.
   */
  maximumDepth: 12,
} as const;
