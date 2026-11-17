import "reflect-metadata";
import {injectable} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {LoggingConfigurationKeys} from "../logging.configuration-keys";
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {LogModel} from "../models/log.model";
import {LogSanitizerDefaults} from "./log-sanitizer.defaults";

/**
 * Removes the secrets from a log before any logger gets it.
 *
 * Why it exists: the framework itself logs the headers and the body of every request (the
 * `[INBOUND REQUEST]` and `[INBOUND RESPONSE COMPLETED]` lines of `@pristine-ts/networking`), and an
 * application logs objects it did not write. So an `Authorization` header, a session cookie or a
 * password in a body reached the console, the observability files and every external logger. The
 * `LogHandler` calls this class at the one point every log passes, so all of them get the clean log.
 *
 * Two rules, both from the configuration:
 *
 * 1. **By key.** The value under a sensitive key is replaced whole, whatever its type.
 * 2. **By value.** In every string (the message too), what matches a sensitive pattern is replaced.
 *
 * It never changes the objects it is given: a log often holds the live request, and the
 * application still uses it. The log gets a copy.
 *
 * **Cost.** A debug log of the framework can hold a whole dependency container. Copying it for a
 * log that no logger prints would be waste, so `protect` is lazy: the copy is made the first time
 * a logger READS the data of the log, and never for a log that is dropped by its severity. One log
 * is also limited to `MaximumValues` values; what is beyond is replaced, not kept.
 */
@moduleScoped(LoggingModuleKeyname)
@injectable()
export class LogSanitizer {
  /**
   * The value that replaces what is deeper than the maximum depth.
   */
  public static readonly TooDeep = "[REDACTED: too deep]";

  /**
   * The value that replaces what is beyond the limit of one log.
   */
  public static readonly TooLarge = "[REDACTED: too large]";

  /**
   * How many values (properties, entries) the sanitizer copies for one log. A log is for a person
   * to read; one that is larger than this is a dump, and its end is replaced.
   */
  public static readonly MaximumValues = 20000;

  private readonly sensitiveKeys: string[];
  private readonly sensitiveValuePatterns: RegExp[];

  /**
   * @param isActive Whether the logs are sanitized.
   * @param sensitiveKeys The keys whose value is replaced. See `LogSanitizerDefaults.sensitiveKeys` for how a key matches.
   * @param additionalSensitiveKeys Keys added to `sensitiveKeys`, so an application adds its own without repeating the defaults.
   * @param sensitiveValuePatterns The sources of the regular expressions whose matches are replaced inside strings.
   * @param additionalSensitiveValuePatterns Patterns added to `sensitiveValuePatterns`.
   * @param replacement What replaces a secret.
   * @param maximumDepth How deep the sanitizer goes into an object.
   */
  public constructor(@injectConfig(LoggingConfigurationKeys.SanitizerIsActive) private readonly isActive: boolean = true,
                     @injectConfig(LoggingConfigurationKeys.SanitizerSensitiveKeys) sensitiveKeys: string | readonly string[] = LogSanitizerDefaults.sensitiveKeys,
                     @injectConfig(LoggingConfigurationKeys.SanitizerAdditionalSensitiveKeys) additionalSensitiveKeys: string | readonly string[] = [],
                     @injectConfig(LoggingConfigurationKeys.SanitizerSensitiveValuePatterns) sensitiveValuePatterns: string | readonly string[] = LogSanitizerDefaults.sensitiveValuePatterns,
                     @injectConfig(LoggingConfigurationKeys.SanitizerAdditionalSensitiveValuePatterns) additionalSensitiveValuePatterns: string | readonly string[] = [],
                     @injectConfig(LoggingConfigurationKeys.SanitizerReplacement) private readonly replacement: string = LogSanitizerDefaults.replacement,
                     @injectConfig(LoggingConfigurationKeys.SanitizerMaximumDepth) private readonly maximumDepth: number = LogSanitizerDefaults.maximumDepth) {
    this.sensitiveKeys = [...LogSanitizer.parseList(sensitiveKeys), ...LogSanitizer.parseList(additionalSensitiveKeys)]
      .map(key => LogSanitizer.normalizeKey(key))
      .filter(key => key !== "");

    this.sensitiveValuePatterns = [];
    for (const source of [...LogSanitizer.parseList(sensitiveValuePatterns), ...LogSanitizer.parseList(additionalSensitiveValuePatterns)]) {
      try {
        this.sensitiveValuePatterns.push(new RegExp(source, "g"));
      } catch (error) {
        // A pattern that does not compile must not stop the application, and must not go unseen:
        // the person who wrote it believes that it protects something.
        process.stderr.write(`[pristine][log-sanitizer] the sensitive value pattern '${source}' is not a valid regular expression and is ignored.\n`);
      }
    }
  }

  /**
   * Reads a list configuration: a `string[]`, a JSON array of strings (use it when an entry has a
   * comma, as a regular expression often has), or a comma-separated string. Entries are trimmed and
   * the empty ones are dropped. What cannot be read gives an empty list and one line on stderr: a
   * configuration mistake must not stop the application, and must not go unseen.
   */
  public static parseList(value: string | readonly string[] | undefined | null): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    let entries: unknown = value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[")) {
        try {
          entries = JSON.parse(trimmed);
        } catch (error) {
          entries = undefined;
        }
      } else {
        entries = trimmed.split(",");
      }
    }

    if (Array.isArray(entries) === false || (entries as unknown[]).some(entry => typeof entry !== "string")) {
      process.stderr.write("[pristine][log-sanitizer] a list configuration is neither a list of strings, a JSON array of strings nor a comma-separated string, and is ignored.\n");
      return [];
    }

    return (entries as string[]).map(entry => entry.trim()).filter(entry => entry !== "");
  }

  /**
   * A key without its case and without what is not a letter or a digit: `X-Api-Key` and
   * `x_api_key` are both `xapikey`.
   */
  public static normalizeKey(key: string): string {
    return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /**
   * Replaces the message, the highlights and the extra of the log with sanitized copies, now.
   * @param log The log to sanitize. Only the log itself changes, never the objects it points to.
   */
  public sanitize(log: LogModel): void {
    if (this.isActive === false) {
      return;
    }

    const pass = this.newPass();
    log.message = this.sanitizeString(log.message);
    log.highlights = this.sanitizeValue(log.highlights, 0, pass) as LogModel["highlights"];
    log.extra = this.sanitizeValue(log.extra, 0, pass);
  }

  /**
   * Makes the log safe to hand to the loggers, at the lowest cost: the message is sanitized now (it
   * is one string), and the highlights and the extra are sanitized the first time something reads
   * them. A logger that drops the log because of its severity reads nothing, and pays nothing.
   *
   * If the sanitizer fails while a logger reads, the logger gets a notice and not the raw data.
   * @param log The log to protect. Only the log itself changes, never the objects it points to.
   */
  public protect(log: LogModel): void {
    if (this.isActive === false) {
      return;
    }

    log.message = this.sanitizeString(log.message);

    const pass = this.newPass();
    this.makeLazy(log, "highlights", pass, {});
    this.makeLazy(log, "extra", pass, {sanitizerError: "The log sanitizer failed; the data of this log was dropped."});
  }

  /**
   * Replaces a property of the log with one that sanitizes its value on the first read, then keeps
   * the result. It stays enumerable and writable, so a logger that copies or changes the log
   * sees an ordinary property.
   * @private
   */
  private makeLazy(log: LogModel, property: "highlights" | "extra", pass: SanitizerPass, onFailure: unknown): void {
    const raw = (log as any)[property];
    let sanitized: unknown;
    let done = false;

    Object.defineProperty(log, property, {
      enumerable: true,
      configurable: true,
      get: () => {
        if (done === false) {
          done = true;
          try {
            sanitized = this.sanitizeValue(raw, 0, pass);
          } catch (error) {
            sanitized = onFailure;
          }
        }
        return sanitized;
      },
      set: (value: unknown) => {
        // A logger that assigns its own value takes the responsibility for it.
        done = true;
        sanitized = value;
      },
    });
  }

  private newPass(): SanitizerPass {
    return {seen: new WeakMap<object, unknown>(), remaining: LogSanitizer.MaximumValues};
  }

  /**
   * Whether the value under this key is a secret.
   */
  public isSensitiveKey(key: string): boolean {
    const normalized = LogSanitizer.normalizeKey(key);
    if (normalized === "") {
      return false;
    }

    return this.sensitiveKeys.some(sensitive => normalized === sensitive || normalized.endsWith(sensitive));
  }

  /**
   * Replaces what matches a sensitive pattern inside a string.
   */
  public sanitizeString(value: string): string {
    if (typeof value !== "string" || value === "") {
      return value;
    }

    let sanitized = value;
    for (const pattern of this.sensitiveValuePatterns) {
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, this.replacement);
    }

    return sanitized;
  }

  /**
   * Returns a sanitized copy of the value.
   * @param value
   * @param depth How deep this value is in the log.
   * @param pass What is shared by the values of one log: the objects already copied (so a cycle ends
   * and a shared object is copied one time) and how many values may still be copied.
   * @private
   */
  private sanitizeValue(value: unknown, depth: number, pass: SanitizerPass): unknown {
    const seen = pass.seen;
    if (pass.remaining <= 0) {
      return typeof value === "object" && value !== null || typeof value === "string" ? LogSanitizer.TooLarge : value;
    }
    pass.remaining--;

    if (typeof value === "string") {
      return this.sanitizeString(value);
    }

    if (value === null || typeof value !== "object") {
      // Numbers, booleans, undefined, symbols, bigints and functions hold nothing to replace.
      return value;
    }

    // Values that are data and not containers: copying them would only break how a logger prints them.
    if (value instanceof Date || value instanceof RegExp || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
      return value;
    }

    if (seen.has(value)) {
      return seen.get(value);
    }

    if (depth >= this.maximumDepth) {
      return LogSanitizer.TooDeep;
    }

    if (Array.isArray(value)) {
      const copy: unknown[] = [];
      seen.set(value, copy);
      for (const entry of value) {
        copy.push(this.sanitizeValue(entry, depth + 1, pass));
      }
      return copy;
    }

    if (value instanceof Map) {
      const copy = new Map<unknown, unknown>();
      seen.set(value, copy);
      for (const [key, entry] of value) {
        copy.set(key, typeof key === "string" && this.isSensitiveKey(key) ? this.redact(entry) : this.sanitizeValue(entry, depth + 1, pass));
      }
      return copy;
    }

    if (value instanceof Set) {
      const copy = new Set<unknown>();
      seen.set(value, copy);
      for (const entry of value) {
        copy.add(this.sanitizeValue(entry, depth + 1, pass));
      }
      return copy;
    }

    return this.sanitizeObject(value, depth, pass);
  }

  /**
   * Copies an object property by property. The copy keeps the prototype, so a logger still prints
   * a `Request` as a `Request` and an `Error` with its name.
   * @private
   */
  private sanitizeObject(value: object, depth: number, pass: SanitizerPass): unknown {
    const seen = pass.seen;
    let copy: Record<string, unknown>;
    try {
      copy = Object.create(Object.getPrototypeOf(value));
    } catch (error) {
      copy = {};
    }
    seen.set(value, copy);

    // An Error keeps its message and its stack in properties that are not enumerable.
    const keys = value instanceof Error
      ? Array.from(new Set([...Object.keys(value), "message", "stack", "cause"].filter(key => key in value)))
      : Object.keys(value);

    for (const key of keys) {
      let entry: unknown;
      try {
        entry = (value as Record<string, unknown>)[key];
      } catch (error) {
        // A getter that throws must not stop a log.
        entry = "[Unreadable]";
      }

      const sanitized = this.isSensitiveKey(key) ? this.redact(entry) : this.sanitizeValue(entry, depth + 1, pass);

      try {
        Object.defineProperty(copy, key, {
          value: sanitized,
          enumerable: Object.prototype.propertyIsEnumerable.call(value, key),
          writable: true,
          configurable: true,
        });
      } catch (error) {
        // Nothing useful to do: the property is left out of the copy, which is the safe side.
      }
    }

    return copy;
  }

  /**
   * The replacement of a value under a sensitive key. Nothing stays where there was nothing, so a
   * log still shows that a header was absent.
   * @private
   */
  private redact(value: unknown): unknown {
    if (value === undefined || value === null || value === "") {
      return value;
    }

    return this.replacement;
  }
}

/**
 * What the values of one log share while they are sanitized.
 */
interface SanitizerPass {
  seen: WeakMap<object, unknown>;
  remaining: number;
}
