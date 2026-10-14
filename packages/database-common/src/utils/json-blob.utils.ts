/**
 * Reads the value of a column declared with `isJsonBlob`.
 *
 * What a driver returns for such a column depends on the driver and on the column type:
 * - text: a TEXT column, every SQLite column, or `mysql2` with `jsonStrings`;
 * - a value that is already parsed: `mysql2` parses a column of the MySQL type `JSON` itself;
 * - bytes: a BLOB column, or a driver set to return JSON as binary.
 *
 * Only text and bytes are parsed. `JSON.parse` on a parsed value first converts it to text:
 * `["a-1"]` becomes `a-1` and throws, and `[1]` becomes `1` and silently returns the number 1.
 */
export class JsonBlobUtils {
  /**
   * Returns the parsed value.
   * A value that is not text or bytes is returned as is, and so is a blank text.
   * @throws SyntaxError when the text is not valid JSON.
   */
  public static parse(value: any): any {
    if (value instanceof Uint8Array) {
      value = new TextDecoder().decode(value);
    }

    if (typeof value !== "string" || value.trim() === "") {
      return value;
    }

    return JSON.parse(value);
  }
}
