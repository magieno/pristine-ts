import "reflect-metadata"
import {StringNormalizer} from "./string.normalizer";
import {StringNormalizerOptions} from "../normalizer-options/string-normalizer.options";

describe('StringNormalizer', () => {

  it('should return undefined for invalid source types if ignoreUndefined is true', () => {
    const normalizer = new StringNormalizer();
    expect(normalizer.normalize(null)).toBeUndefined();
  });

  it('should return an empty string for invalid source types if ignoreUndefined is false', () => {
    const normalizer = new StringNormalizer();
    expect(normalizer.normalize(null, {ignoreUndefined: false})).toBe('');
  });

  it('should normalize strings', () => {
    const normalizer = new StringNormalizer();
    expect(normalizer.normalize('hello world')).toBe('hello world');
  });

  it('should convert numbers to strings', () => {
    const normalizer = new StringNormalizer();
    expect(normalizer.normalize(123)).toBe('123');
    expect(normalizer.normalize(45.67)).toBe('45.67');
  });

  it('should convert booleans to strings', () => {
    const normalizer = new StringNormalizer();
    expect(normalizer.normalize(true)).toBe('true');
    expect(normalizer.normalize(false)).toBe('false');
  });

  it('should format dates using the dateFormat option', () => {
    const normalizer = new StringNormalizer();
    const date = new Date(2024, 0, 31);
    expect(normalizer.normalize(date, new StringNormalizerOptions({dateFormat: 'yyyy-MM-dd'}))).toBe('2024-01-31');
  });

  it('should format dates using toJSON() if no dateFormat is provided', () => {
    const normalizer = new StringNormalizer();
    const date = new Date(2024, 0, 31);
    expect(normalizer.normalize(date)!.startsWith("2024-01-31T")).toBeTruthy();
  });

  it('should normalize arrays by normalizing each item', () => {
    const normalizer = new StringNormalizer();
    const array = [123, true, 'hello'];
    expect(normalizer.normalize(array)).toEqual(['123', 'true', 'hello']);
  });

  it('should normalize objects with a toString() method', () => {
    const normalizer = new StringNormalizer();
    const object = {toString: () => 'custom string'};
    expect(normalizer.normalize(object)).toBe('custom string');
  });

  it('should normalize objects using JSON.stringify()', () => {
    const normalizer = new StringNormalizer();
    const object = {name: 'John Doe', age: 30};
    expect(normalizer.normalize(object)).toBe('{"name":"John Doe","age":30}');
  });

  it('should convert other types to strings using "" + source', () => {
    const normalizer = new StringNormalizer();
    const symbol = Symbol('test');
    expect(normalizer.normalize(symbol)).toBe('Symbol(test)');
  });
});