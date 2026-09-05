import {RawBodyCapture} from "./raw-body.capture";

describe("RawBodyCapture", () => {
  const expressRequest = (body: unknown, rawBody?: unknown): any => ({body, rawBody});

  it("stores the verify hook's Buffer on the request as rawBody", () => {
    const request = expressRequest({a: 1});
    const bytes = Buffer.from('{"a":1}');

    RawBodyCapture.verify(request, {} as any, bytes);

    expect(request.rawBody).toBe(bytes);
  });

  describe("resolve", () => {
    it("prefers the captured Buffer over the parsed body", () => {
      const bytes = Buffer.from('{"a":1}');

      expect(RawBodyCapture.resolve(expressRequest({a: 1}, bytes))).toBe(bytes);
    });

    it("uses a Buffer body when nothing was captured (express.raw())", () => {
      const bytes = Buffer.from([0xff, 0xf1, 0x00]);

      expect(RawBodyCapture.resolve(expressRequest(bytes))).toBe(bytes);
    });

    it("uses a string body when nothing was captured (express.text())", () => {
      expect(RawBodyCapture.resolve(expressRequest("text body"))).toBe("text body");
    });

    it("never returns the parsed object", () => {
      expect(RawBodyCapture.resolve(expressRequest({a: 1}))).toBeUndefined();
    });

    it("ignores a rawBody that is not a Buffer", () => {
      expect(RawBodyCapture.resolve(expressRequest({a: 1}, "not bytes"))).toBeUndefined();
    });

    it("returns undefined when there is no body at all", () => {
      expect(RawBodyCapture.resolve(expressRequest(undefined))).toBeUndefined();
    });
  });
});
