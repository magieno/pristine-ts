export class EnumUtil {
  static isValidEnumValue<T extends object>(value: any, enumObject: T): boolean {
    // Object.values() returns an array of the enum's values.
    // We then use .includes() to see if the provided value is in that array.
    // We cast enumObject to 'any' to satisfy the compiler for a generic check,
    // as the structure of enums is unique.
    return Object.values(enumObject as any).includes(value);
  }
}