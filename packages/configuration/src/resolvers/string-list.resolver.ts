import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";

/**
 * This class takes either another resolver, a string or a list, and returns a list of strings.
 *
 * It exists for the configurations that are lists while the source (an environment variable, for
 * example) only holds a string. Two forms of string are accepted:
 *
 * - A JSON array: `["authorization", "x-api-key"]`. Use it when an entry contains the separator,
 *   as a regular expression often contains a comma.
 * - A delimited string: `authorization, x-api-key`. Each entry is trimmed and the empty entries
 *   are dropped, so a trailing separator or an empty string gives no phantom entry.
 *
 * ```ts
 * new StringListResolver(new EnvironmentVariableResolver("MY_APP_ALLOWED_ORIGINS"))
 * ```
 */
export class StringListResolver implements ResolverInterface<string[]> {
  /**
   * @param valueOrResolver A string, a list of strings, or a resolver that gives one of them.
   * @param separator What separates two entries of a delimited string. A comma by default.
   */
  public constructor(private readonly valueOrResolver: string | readonly string[] | ResolverInterface<string> | ResolverInterface<readonly string[]>,
                     private readonly separator: string = ",") {
  }

  /**
   * This method resolves the value whether it's a string, a list or a Resolver.
   */
  async resolve(): Promise<string[]> {
    return this.resolveValueOrResolver(this.valueOrResolver);
  }

  /**
   * This method takes a string and transforms it into a list of strings.
   * @param value
   * @private
   */
  private resolveString(value: string): string[] {
    const trimmed = value.trim();

    if (trimmed.startsWith("[")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch (error) {
        throw new ConfigurationResolverError("Cannot convert the string to a list. It starts with '[' but it isn't a valid JSON array.", {value});
      }

      return this.resolveList(parsed, value);
    }

    return trimmed.split(this.separator).map(entry => entry.trim()).filter(entry => entry !== "");
  }

  /**
   * This method verifies that every entry of the list is a string, and returns a copy.
   * @param value
   * @param original The value as it was received, for the error.
   * @private
   */
  private resolveList(value: unknown, original: unknown): string[] {
    if (Array.isArray(value) === false || (value as unknown[]).some(entry => typeof entry !== "string")) {
      throw new ConfigurationResolverError("Cannot convert the value to a list of strings. Every entry must be a string.", {value: original});
    }

    return [...(value as string[])];
  }

  /**
   * This method checks the type of the argument and calls the proper individual method.
   *
   * @param value
   * @private
   */
  private async resolveValueOrResolver(value: string | readonly string[] | ResolverInterface<string> | ResolverInterface<readonly string[]>): Promise<string[]> {
    if (typeof value === "string") {
      return this.resolveString(value);
    }

    if (Array.isArray(value)) {
      return this.resolveList(value, value);
    }

    if (typeof value === "object" && value !== null && typeof (value as ResolverInterface<string>).resolve === "function") {
      return this.resolveValueOrResolver(await (value as ResolverInterface<string>).resolve());
    }

    throw new ConfigurationResolverError("Cannot resolve the value passed. It isn't of type string, string[] or ResolverInterface.", {
      value,
    });
  }
}
