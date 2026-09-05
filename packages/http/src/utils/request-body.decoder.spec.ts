import {RequestBodyDecoder} from "./request-body.decoder";

describe("RequestBodyDecoder", () => {
  const binary = Buffer.from([0xff, 0xf1, 0x00, 0x01, 0x80, 0xfe]);

  describe("parseContentType", () => {
    it("lower-cases the media type and extracts the charset parameter", () => {
      expect(RequestBodyDecoder.parseContentType("Text/Plain; Charset=ISO-8859-1"))
        .toEqual({mediaType: "text/plain", charset: "iso-8859-1"});
    });

    it("strips quotes around the charset value and ignores other parameters", () => {
      expect(RequestBodyDecoder.parseContentType('multipart/form-data; boundary=abc; charset="utf-8"'))
        .toEqual({mediaType: "multipart/form-data", charset: "utf-8"});
    });

    it("returns an empty media type when the header is absent", () => {
      expect(RequestBodyDecoder.parseContentType(undefined)).toEqual({mediaType: ""});
    });
  });

  describe("decode", () => {
    it("parses application/json", () => {
      expect(RequestBodyDecoder.decode("application/json", Buffer.from('{"a":1}'))).toEqual({a: 1});
    });

    it("parses +json types", () => {
      expect(RequestBodyDecoder.decode("application/vnd.api+json", Buffer.from('[1,2]'))).toEqual([1, 2]);
    });

    it("keeps malformed JSON as text", () => {
      expect(RequestBodyDecoder.decode("application/json", Buffer.from("{oops"))).toBe("{oops");
    });

    it("decodes text/* as a UTF-8 string by default", () => {
      expect(RequestBodyDecoder.decode("text/plain", Buffer.from("héllo", "utf8"))).toBe("héllo");
    });

    it("decodes with the named charset", () => {
      expect(RequestBodyDecoder.decode("text/plain; charset=iso-8859-1", Buffer.from([0x63, 0x61, 0x66, 0xe9]))).toBe("café");
    });

    it("treats form-urlencoded, xml and javascript as text", () => {
      expect(RequestBodyDecoder.decode("application/x-www-form-urlencoded", Buffer.from("a=1&b=2"))).toBe("a=1&b=2");
      expect(RequestBodyDecoder.decode("application/xml", Buffer.from("<a/>"))).toBe("<a/>");
      expect(RequestBodyDecoder.decode("application/javascript", Buffer.from("1+1"))).toBe("1+1");
    });

    it("treats any type with a charset parameter as text", () => {
      expect(RequestBodyDecoder.decode("application/x-custom; charset=utf-8", Buffer.from("custom"))).toBe("custom");
    });

    it("returns the same Buffer, untouched, for binary and unknown types", () => {
      for (const contentType of ["audio/aac", "image/png", "video/mp4", "application/octet-stream", "application/x-custom", undefined]) {
        const decoded = RequestBodyDecoder.decode(contentType, binary);
        expect(decoded).toBe(binary);
      }
    });

    it("falls back to UTF-8 for an unsupported charset instead of throwing", () => {
      expect(RequestBodyDecoder.decode("text/plain; charset=not-a-charset", Buffer.from("plain"))).toBe("plain");
    });
  });
});
