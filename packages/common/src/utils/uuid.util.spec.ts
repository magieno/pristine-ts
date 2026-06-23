import {UuidGenerator} from "./uuid.util";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("UuidGenerator", () => {
  const originalCrypto = (globalThis as { crypto?: unknown }).crypto;

  const setCrypto = (value: unknown) => {
    Object.defineProperty(globalThis, "crypto", {value, configurable: true, writable: true});
  };

  afterEach(() => {
    setCrypto(originalCrypto);
  });

  it("uses the native crypto.randomUUID when available", () => {
    expect(UuidGenerator.generate()).toMatch(UUID_V4);
  });

  it("returns unique values across calls", () => {
    const values = new Set(Array.from({length: 1000}, () => UuidGenerator.generate()));
    expect(values.size).toBe(1000);
  });

  it("falls back to getRandomValues when randomUUID is missing", () => {
    setCrypto({
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        const view = array as unknown as Uint8Array;
        for (let i = 0; i < view.length; i++) {
          view[i] = i;
        }
        return array;
      },
    });

    const uuid = UuidGenerator.generate();
    expect(uuid).toMatch(UUID_V4);
    // Version nibble is forced to 4 and the variant nibble into the 8-b range.
    expect(uuid[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(uuid[19].toLowerCase());
  });

  it("falls back to Math.random when no Web Crypto is present", () => {
    setCrypto(undefined);
    expect(UuidGenerator.generate()).toMatch(UUID_V4);
  });
});
