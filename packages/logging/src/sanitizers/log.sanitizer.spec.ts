import "reflect-metadata";
import {LogSanitizer} from "./log.sanitizer";
import {LogSanitizerDefaults} from "./log-sanitizer.defaults";
import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";

const JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function log(message: string, highlights: any = {}, extra?: any): LogModel {
  const model = new LogModel(SeverityEnum.Info, message);
  model.highlights = highlights;
  model.extra = extra;
  return model;
}

describe("LogSanitizer", () => {
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  describe("the leak it was written for: the request log of the framework", () => {
    it("should remove the Authorization header and the cookie, and keep what helps a person debug", () => {
      const entry = log("[INBOUND RESPONSE COMPLETED] GET /api/things 200 3ms", {
        requestBody: {name: "Front door", password: "hunter2"},
        requestHeaders: {host: "api.example.com", Authorization: `Bearer ${JWT}`, Cookie: "session=abc123", "user-agent": "curl/8.7.1"},
        responseBody: {id: "42", accessToken: "at_9f8e7d6c5b4a", refresh_token: "rt_1a2b3c4d"},
        responseHeaders: {"content-type": "application/json", "Set-Cookie": "session=def456; HttpOnly"},
      });

      new LogSanitizer().sanitize(entry);

      expect(entry.highlights).toEqual({
        requestBody: {name: "Front door", password: "[REDACTED]"},
        requestHeaders: {host: "api.example.com", Authorization: "[REDACTED]", Cookie: "[REDACTED]", "user-agent": "curl/8.7.1"},
        responseBody: {id: "42", accessToken: "[REDACTED]", refresh_token: "[REDACTED]"},
        responseHeaders: {"content-type": "application/json", "Set-Cookie": "[REDACTED]"},
      });
      expect(JSON.stringify(entry)).not.toContain("eyJ");
      expect(JSON.stringify(entry)).not.toContain("hunter2");
      expect(JSON.stringify(entry)).not.toContain("abc123");
    });

    it("should never change the object of the application: the log gets a copy", () => {
      const headers = {authorization: "Bearer live-token-of-the-request"};
      const request = {headers, body: {password: "hunter2"}};
      const entry = log("request", {headers}, {event: {payload: request}});

      new LogSanitizer().sanitize(entry);

      expect(headers.authorization).toBe("Bearer live-token-of-the-request");
      expect(request.body.password).toBe("hunter2");
      expect(entry.highlights.headers).not.toBe(headers);
      expect(entry.extra.event.payload.headers.authorization).toBe("[REDACTED]");
      expect(entry.extra.event.payload.body.password).toBe("[REDACTED]");
    });
  });

  describe("sensitive keys", () => {
    it.each([
      "authorization", "Authorization", "AUTHORIZATION", "proxy-authorization", "cookie", "set-cookie",
      "password", "userPassword", "db_password", "passwd", "passphrase",
      "secret", "client_secret", "clientSecret", "webhook-secret",
      "token", "hubToken", "access_token", "refreshToken", "id_token", "x-auth-token", "X-Amz-Security-Token", "csrfToken",
      "apiKey", "api_key", "x-api-key", "privateKey", "private_key", "credentials", "awsCredentials",
    ])("should treat '%s' as a secret", key => {
      expect(new LogSanitizer().isSensitiveKey(key)).toBe(true);
    });

    it.each([
      "tokenCount", "tokens", "tokenize", "secretary", "passwordless", "keyboard", "key", "author", "authorId", "cookies", "id", "name", "url", "", "---",
    ])("should not treat '%s' as a secret", key => {
      expect(new LogSanitizer().isSensitiveKey(key)).toBe(false);
    });

    it("should replace the whole value under a sensitive key, whatever its type, and leave nothing where there was nothing", () => {
      const entry = log("m", {}, {
        token: {value: "abc", expiresIn: 3600},
        credentials: ["user", "pass"],
        apiKey: 12345,
        password: "",
        secret: null,
        authorization: undefined,
      });

      new LogSanitizer().sanitize(entry);

      expect(entry.extra).toEqual({token: "[REDACTED]", credentials: "[REDACTED]", apiKey: "[REDACTED]", password: "", secret: null, authorization: undefined});
    });

    it("should add the keys of the application to the defaults", () => {
      const sanitizer = new LogSanitizer(true, LogSanitizerDefaults.sensitiveKeys, "pairingCode, X-Hub-Signature");
      const entry = log("m", {pairingCode: "11564104", "x-hub-signature": "sha256=abcdef", authorization: "Bearer abcdefgh"});

      sanitizer.sanitize(entry);

      expect(entry.highlights).toEqual({pairingCode: "[REDACTED]", "x-hub-signature": "[REDACTED]", authorization: "[REDACTED]"});
    });

    it("should let the application replace the defaults", () => {
      const sanitizer = new LogSanitizer(true, ["ssn"]);
      const entry = log("m", {ssn: "078-05-1120", password: "kept because the application said so"});

      sanitizer.sanitize(entry);

      expect(entry.highlights).toEqual({ssn: "[REDACTED]", password: "kept because the application said so"});
    });
  });

  describe("allowed keys", () => {
    it("should never redact an allowed key, and the allow-list wins over the block-list", () => {
      const sanitizer = new LogSanitizer(true, undefined, "nextPageToken", undefined, undefined, undefined, undefined, undefined, "nextPageToken, token_type");
      const entry = log("m", {nextPageToken: "page-2", token_type: "bearer", TokenType: "bearer", access_token: "at_123"});

      sanitizer.sanitize(entry);

      expect(entry.highlights).toEqual({nextPageToken: "page-2", token_type: "bearer", TokenType: "bearer", access_token: "[REDACTED]"});
    });

    it("should match an allowed key exactly: the keys that end with it are still secrets", () => {
      const sanitizer = new LogSanitizer(true, undefined, undefined, undefined, undefined, undefined, undefined, ["token"]);

      expect(sanitizer.isSensitiveKey("token")).toBe(false);
      expect(sanitizer.isSensitiveKey("Token")).toBe(false);
      expect(sanitizer.isSensitiveKey("accessToken")).toBe(true);
      expect(sanitizer.isSensitiveKey("x-auth-token")).toBe(true);
    });

    it("should still replace a secret that sits in the value of an allowed key", () => {
      const sanitizer = new LogSanitizer(true, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "debugToken");
      const entry = log("m", {debugToken: `prefix ${JWT}`, other: "kept"});

      sanitizer.sanitize(entry);

      expect(entry.highlights).toEqual({debugToken: "prefix [REDACTED]", other: "kept"});
    });

    it("should allow the dependency-injection token of the router by default, and let the application replace that list", () => {
      expect(new LogSanitizer().isSensitiveKey("controllerInstantiationToken")).toBe(false);
      expect(new LogSanitizer(true, undefined, undefined, undefined, undefined, undefined, undefined, []).isSensitiveKey("controllerInstantiationToken")).toBe(true);
      // The module gives the defaults as a comma-separated string.
      expect(new LogSanitizer(true, undefined, undefined, undefined, undefined, undefined, undefined, LogSanitizerDefaults.allowedKeys.join(","), "").isSensitiveKey("controllerInstantiationToken")).toBe(false);
    });
  });

  describe("sensitive values", () => {
    it("should replace a bearer credential and a JWT inside any string, the message included", () => {
      const entry = log(`Call failed with header "Authorization: Bearer abcdef123456" and token ${JWT}`, {
        url: `https://example.com/callback?id_token=${JWT}&state=xyz`,
        rawHeaders: ["Host", "example.com", "Authorization", "Basic dXNlcjpwYXNzd29yZA=="],
      });

      new LogSanitizer().sanitize(entry);

      expect(entry.message).toBe('Call failed with header "Authorization: [REDACTED]" and token [REDACTED]');
      expect(entry.highlights.url).toBe("https://example.com/callback?id_token=[REDACTED]&state=xyz");
      expect(entry.highlights.rawHeaders).toEqual(["Host", "example.com", "Authorization", "[REDACTED]"]);
    });

    it("should leave an ordinary sentence alone", () => {
      const entry = log("The bearer of this letter is basic in his tastes; eyJ is not a token.", {note: "Bearer", short: "Bearer abc"});

      new LogSanitizer().sanitize(entry);

      expect(entry.message).toBe("The bearer of this letter is basic in his tastes; eyJ is not a token.");
      expect(entry.highlights).toEqual({note: "Bearer", short: "Bearer abc"});
    });

    it("should add the patterns of the application, as a list or as the JSON array an environment variable holds", () => {
      const fromList = new LogSanitizer(true, undefined, undefined, undefined, ["lhb_[A-Za-z0-9_-]{10,}"]);
      const fromJson = new LogSanitizer(true, undefined, undefined, undefined, '["lhb_[A-Za-z0-9_-]{10,}", "sk_live_[a-z0-9]{4,8}"]');

      for (const sanitizer of [fromList, fromJson]) {
        const entry = log("hub lhb_abcdefghij_KLMNOP-123 called", {});
        sanitizer.sanitize(entry);
        expect(entry.message).toBe("hub [REDACTED] called");
      }
      const entry = log("key sk_live_ab12cd", {});
      fromJson.sanitize(entry);
      expect(entry.message).toBe("key [REDACTED]");
    });

    it("should ignore a pattern that is not a regular expression, say so, and keep the others", () => {
      const sanitizer = new LogSanitizer(true, undefined, undefined, undefined, ["(unclosed", "sk_live_[a-z0-9]+"]);
      const entry = log("key sk_live_ab12cd and Bearer abcdefgh1234", {});

      sanitizer.sanitize(entry);

      expect(entry.message).toBe("key [REDACTED] and [REDACTED]");
      expect(stderrSpy.mock.calls.map(call => call[0]).join("")).toContain("'(unclosed' is not a valid regular expression");
    });

    it("should use the replacement of the configuration", () => {
      const entry = log("Bearer abcdefgh1234", {password: "x"});

      new LogSanitizer(true, undefined, undefined, undefined, undefined, "***").sanitize(entry);

      expect(entry.message).toBe("***");
      expect(entry.highlights).toEqual({password: "***"});
    });
  });

  describe("shapes", () => {
    it("should end on a cycle, and copy a shared object one time", () => {
      const shared = {token: "abc"};
      const node: any = {name: "a", shared, again: shared};
      node.self = node;
      const entry = log("m", {}, node);

      new LogSanitizer().sanitize(entry);

      expect(entry.extra.self).toBe(entry.extra);
      expect(entry.extra.shared).toBe(entry.extra.again);
      expect(entry.extra.shared).toEqual({token: "[REDACTED]"});
      expect(shared.token).toBe("abc");
    });

    it("should replace what is deeper than the maximum depth, not keep it", () => {
      const entry = log("m", {}, {a: {b: {c: {password: "deep"}}}});

      new LogSanitizer(true, undefined, undefined, undefined, undefined, undefined, 2).sanitize(entry);

      expect(entry.extra).toEqual({a: {b: LogSanitizer.TooDeep}});
      expect(JSON.stringify(entry.extra)).not.toContain('"deep"');
    });

    it("should go through arrays, maps and sets", () => {
      const entry = log("m", {}, {
        list: [{password: "a"}, "Bearer abcdefgh1234"],
        map: new Map<string, any>([["authorization", "Bearer abcdefgh1234"], ["plain", {secret: "s"}]]),
        set: new Set(["Bearer abcdefgh1234", "kept"]),
      });

      new LogSanitizer().sanitize(entry);

      expect(entry.extra.list).toEqual([{password: "[REDACTED]"}, "[REDACTED]"]);
      expect(entry.extra.map).toEqual(new Map<string, any>([["authorization", "[REDACTED]"], ["plain", {secret: "[REDACTED]"}]]));
      expect(entry.extra.set).toEqual(new Set(["[REDACTED]", "kept"]));
    });

    it("should keep the class of an object and the name, the message and the stack of an error", () => {
      class Request {
        constructor(public headers: any, public url: string) {
        }
      }
      const error = new TypeError(`Refused the header Bearer abcdefgh1234`);
      (error as any).token = "abc";
      const entry = log("m", {}, {request: new Request({authorization: "Bearer abcdefgh1234"}, "/x"), error});

      new LogSanitizer().sanitize(entry);

      expect(entry.extra.request).toBeInstanceOf(Request);
      expect(entry.extra.request.headers).toEqual({authorization: "[REDACTED]"});
      expect(entry.extra.error).toBeInstanceOf(TypeError);
      expect(entry.extra.error.name).toBe("TypeError");
      expect(entry.extra.error.message).toBe("Refused the header [REDACTED]");
      expect(entry.extra.error.stack).toContain("TypeError: Refused the header [REDACTED]");
      expect(entry.extra.error.token).toBe("[REDACTED]");
      expect(error.message).toBe("Refused the header Bearer abcdefgh1234");
    });

    it("should leave dates, buffers and scalars as they are, and survive a getter that throws", () => {
      const date = new Date(0);
      const buffer = Buffer.from("Bearer abcdefgh1234");
      const hostile = {
        get broken(): string {
          throw new Error("no");
        },
        fine: 1,
      };
      const entry = log("m", {count: 3, ok: true, nothing: null}, {date, buffer, hostile, big: BigInt(1)});

      new LogSanitizer().sanitize(entry);

      expect(entry.highlights).toEqual({count: 3, ok: true, nothing: null});
      expect(entry.extra.date).toBe(date);
      expect(entry.extra.buffer).toBe(buffer);
      expect(entry.extra.hostile).toEqual({broken: "[Unreadable]", fine: 1});
      expect(entry.extra.big).toBe(BigInt(1));
    });

    it("should sanitize an extra that is a string or an array, and accept no data at all", () => {
      const text = log("m", {}, "Bearer abcdefgh1234");
      const list = log("m", {}, [{password: "x"}]);
      const empty = log("m");

      const sanitizer = new LogSanitizer();
      sanitizer.sanitize(text);
      sanitizer.sanitize(list);
      sanitizer.sanitize(empty);

      expect(text.extra).toBe("[REDACTED]");
      expect(list.extra).toEqual([{password: "[REDACTED]"}]);
      expect(empty.extra).toBeUndefined();
      expect(empty.highlights).toEqual({});
    });
  });

  describe("protect: the lazy form the LogHandler uses", () => {
    it("should sanitize the message at once, and the data only when it is read, one time", () => {
      let reads = 0;
      const source = {
        get password(): string {
          reads++;
          return "hunter2";
        },
      };
      const entry = log("Bearer abcdefgh1234", {source}, {source});

      new LogSanitizer().protect(entry);

      expect(entry.message).toBe("[REDACTED]");
      expect(reads).toBe(0);

      expect(entry.highlights).toEqual({source: {password: "[REDACTED]"}});
      expect(entry.extra).toEqual({source: {password: "[REDACTED]"}});
      const readsAfterFirstLook = reads;
      expect(entry.extra).toBe(entry.extra);
      expect(reads).toBe(readsAfterFirstLook);
    });

    it("should leave an ordinary log: it serializes, copies and can be changed as before", () => {
      const entry = log("m", {authorization: "Bearer abcdefgh1234"}, {password: "hunter2", user: "jane"});

      new LogSanitizer().protect(entry);

      const json = JSON.parse(JSON.stringify(entry));
      expect(json.highlights).toEqual({authorization: "[REDACTED]"});
      expect(json.extra).toEqual({password: "[REDACTED]", user: "jane"});
      expect({...entry}.extra).toEqual({password: "[REDACTED]", user: "jane"});
      expect(Object.keys(entry)).toEqual(expect.arrayContaining(["highlights", "extra", "message", "severity"]));

      entry.extra = {replaced: true};
      expect(entry.extra).toEqual({replaced: true});
    });

    it("should give a notice, and not the raw data, when the sanitizer fails while a logger reads", () => {
      const entry = log("m", {password: "hunter2"}, {password: "hunter2"});
      const sanitizer = new LogSanitizer();
      (sanitizer as any).sanitizeValue = () => {
        throw new Error("broken");
      };

      sanitizer.protect(entry);

      expect(entry.highlights).toEqual({});
      expect(entry.extra).toEqual({sanitizerError: "The log sanitizer failed; the data of this log was dropped."});
      expect(JSON.stringify(entry)).not.toContain("hunter2");
    });

    it("should do nothing when it is not active", () => {
      const extra = {password: "hunter2"};
      const entry = log("Bearer abcdefgh1234", {}, extra);

      new LogSanitizer(false).protect(entry);

      expect(entry.message).toBe("Bearer abcdefgh1234");
      expect(entry.extra).toBe(extra);
    });
  });

  describe("limits", () => {
    it("should replace what is beyond the limit of one log, and never let it through", () => {
      const rows = Array.from({length: LogSanitizer.MaximumValues + 50}, (_, index) => ({password: `secret-${index}`}));
      const entry = log("m", {}, {rows, after: {password: "the-last-one"}});

      new LogSanitizer().sanitize(entry);

      const text = JSON.stringify(entry.extra);
      expect(text).not.toContain("secret-");
      expect(text).not.toContain("the-last-one");
      expect(text).toContain(LogSanitizer.TooLarge);
      expect(entry.extra.rows[0]).toEqual({password: "[REDACTED]"});
    });
  });

  describe("configuration", () => {
    it("should do nothing when it is not active", () => {
      const highlights = {authorization: "Bearer abcdefgh1234"};
      const entry = log("Bearer abcdefgh1234", highlights);

      new LogSanitizer(false).sanitize(entry);

      expect(entry.message).toBe("Bearer abcdefgh1234");
      expect(entry.highlights).toBe(highlights);
    });

    it("should read a list from an array, a comma-separated string or a JSON array, and say so when it cannot", () => {
      expect(LogSanitizer.parseList(["a", " b "])).toEqual(["a", "b"]);
      expect(LogSanitizer.parseList("a, b ,,c,")).toEqual(["a", "b", "c"]);
      expect(LogSanitizer.parseList('["a{1,3}", "b"]')).toEqual(["a{1,3}", "b"]);
      expect(LogSanitizer.parseList("")).toEqual([]);
      expect(LogSanitizer.parseList(undefined)).toEqual([]);
      expect(stderrSpy).not.toHaveBeenCalled();

      expect(LogSanitizer.parseList('["a", ')).toEqual([]);
      expect(LogSanitizer.parseList('["a", 1]')).toEqual([]);
      expect(stderrSpy).toHaveBeenCalledTimes(2);
    });

    it("should keep the defaults of the module in step with the defaults of the class", () => {
      // The module gives the lists as strings (the convention for list configurations); a sanitizer
      // built from those strings must behave as one built with no argument.
      const fromModule = new LogSanitizer(true, LogSanitizerDefaults.sensitiveKeys.join(","), "", JSON.stringify(LogSanitizerDefaults.sensitiveValuePatterns), "");
      const entry = log(`Bearer abcdefgh1234 ${JWT}`, {authorization: "x", apiKey: "y", name: "z"});

      fromModule.sanitize(entry);

      expect(entry.message).toBe("[REDACTED] [REDACTED]");
      expect(entry.highlights).toEqual({authorization: "[REDACTED]", apiKey: "[REDACTED]", name: "z"});
    });
  });
});
