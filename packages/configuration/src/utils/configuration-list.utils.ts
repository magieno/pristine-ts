import {ConfigurationValue} from "@pristine-ts/common";
import {ConfigurationValidationError} from "../errors/configuration-validation.error";

/**
 * What the ConfigurationParser does with a list. It is here, and not in private methods of the
 * parser, so the public shape of `ConfigurationParser` stays one method: code that passes its own
 * object with a `resolve` method in place of the parser (a test, a wrapper) keeps compiling.
 */
export class ConfigurationListUtils {
  /**
   * Verifies a list given directly as a configuration value, and returns a frozen copy of it.
   * Every entry must be a string, a number or a boolean: a list of lists or of objects is refused,
   * with the position of the entry.
   */
  static verifyAndFreeze(list: readonly unknown[]): ConfigurationValue {
    for (let index = 0; index < list.length; index++) {
      const entry = list[index];
      const type = typeof entry;
      if (type !== "boolean" && type !== "number" && type !== "string") {
        const found = Array.isArray(entry) ? "array" : entry === null ? "null" : type;
        throw new ConfigurationValidationError(["The configuration value passed is a list that contains an unsupported type at position " + index + ". A list can hold strings, numbers and booleans. Unsupported type: '" + found + "'"]);
      }
    }

    return Object.freeze([...list]) as ConfigurationValue;
  }

  /**
   * What a resolver returns is not verified (it never was: a resolver is code of the application
   * or of a module). A list is still frozen, as one given directly is, because the manager
   * registers ONE value in the container and every consumer gets that same value. Any other value
   * is returned as it is.
   */
  static freezeIfList<T>(value: T): T {
    return Array.isArray(value) ? Object.freeze([...value]) as unknown as T : value;
  }
}
