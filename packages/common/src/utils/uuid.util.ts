/**
 * Minimal structural type for the slice of the Web Crypto API this utility needs. Declared
 * locally so the code type-checks regardless of which `lib`/`@types/node` version is in play.
 */
interface WebCryptoLike {
  randomUUID?(): string;
  getRandomValues?<T extends ArrayBufferView>(array: T): T;
}

/**
 * Cross-runtime UUID generation. Replaces Node's `crypto.randomUUID()` with the Web Crypto
 * API exposed on `globalThis.crypto`, which is available in browsers, Node.js (19+), Deno,
 * Bun and Cloudflare Workers — keeping `@pristine-ts/common` importable outside Node without
 * pulling in the Node-only `crypto` module.
 */
export class UuidGenerator {
  /**
   * Returns an RFC 4122 version 4 UUID. Prefers the native `crypto.randomUUID()`, then
   * derives one from `crypto.getRandomValues()`, and only as a last resort (no Web Crypto at
   * all) falls back to `Math.random()` — which is NOT cryptographically secure but keeps
   * exotic runtimes working rather than throwing.
   */
  public static generate(): string {
    const webCrypto: WebCryptoLike | undefined = (globalThis as { crypto?: WebCryptoLike }).crypto;

    if (typeof webCrypto?.randomUUID === "function") {
      return webCrypto.randomUUID();
    }

    if (typeof webCrypto?.getRandomValues === "function") {
      const bytes = webCrypto.getRandomValues(new Uint8Array(16));
      // Set the version (4) and variant (RFC 4122) bits.
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex: string[] = [];
      for (let i = 0; i < bytes.length; i++) {
        hex.push(bytes[i].toString(16).padStart(2, "0"));
      }

      return (
        hex.slice(0, 4).join("") + "-" +
        hex.slice(4, 6).join("") + "-" +
        hex.slice(6, 8).join("") + "-" +
        hex.slice(8, 10).join("") + "-" +
        hex.slice(10, 16).join("")
      );
    }

    // Last-resort, non-cryptographic fallback.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
