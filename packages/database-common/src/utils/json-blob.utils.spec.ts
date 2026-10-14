import "reflect-metadata";
import {JsonBlobUtils} from "./json-blob.utils";

describe('JSON Blob Utils', () => {
  it('should parse a text', () => {
    expect(JsonBlobUtils.parse('{"a": 1}')).toEqual({a: 1});
    expect(JsonBlobUtils.parse('["a-1"]')).toEqual(["a-1"]);
    expect(JsonBlobUtils.parse('null')).toBeNull();
  });

  it('should return as is a value that the driver already parsed', () => {
    const object = {a: 1};
    const ids = ["412efa25-0b6f-4c4e-9d55-6a1b3c1d2e3f"];

    expect(JsonBlobUtils.parse(object)).toBe(object);
    expect(JsonBlobUtils.parse(ids)).toBe(ids);
    expect(JsonBlobUtils.parse(12)).toBe(12);
    expect(JsonBlobUtils.parse(true)).toBe(true);
  });

  it('should not turn a parsed array into its first element', () => {
    // JSON.parse([1]) converts the array to the text "1" and returns the number 1.
    expect(JsonBlobUtils.parse([1])).toEqual([1]);
    expect(JsonBlobUtils.parse(["true"])).toEqual(["true"]);
    expect(JsonBlobUtils.parse([])).toEqual([]);
  });

  it('should return null, undefined and a blank text as is', () => {
    expect(JsonBlobUtils.parse(null)).toBeNull();
    expect(JsonBlobUtils.parse(undefined)).toBeUndefined();
    expect(JsonBlobUtils.parse("")).toBe("");
    expect(JsonBlobUtils.parse("  ")).toBe("  ");
  });

  it('should decode bytes before it parses them', () => {
    expect(JsonBlobUtils.parse(Buffer.from('{"a": "é"}', "utf8"))).toEqual({a: "é"});
    expect(JsonBlobUtils.parse(new TextEncoder().encode('[1, 2]'))).toEqual([1, 2]);
  });

  it('should throw when the text is not valid JSON', () => {
    expect(() => JsonBlobUtils.parse('{"a": ')).toThrow(SyntaxError);
  });
});
