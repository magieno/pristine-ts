import "reflect-metadata"
import {NumberNormalizer} from "./number.normalizer";
import {NumberNormalizerOptions} from "../normalizer-options/number-normalizer.options";

describe('NumberNormalizer', () => {

  it('should return undefined for invalid source types', () => {
    const normalizer = new NumberNormalizer();
    expect(normalizer.normalize(null)).toBeUndefined();
    expect(normalizer.normalize({})).toBeUndefined();
    expect(normalizer.normalize(() => {
    })).toBeUndefined();
  });

  it('should return 0 if ignoreUndefined is false', () => {
    const normalizer = new NumberNormalizer();
    expect(normalizer.normalize(null, new NumberNormalizerOptions({ignoreUndefined: false}))).toBe(0);
    expect(normalizer.normalize({}, new NumberNormalizerOptions({ignoreUndefined: false}))).toBeUndefined();
  });

  it('should return undefined for invalid numbers', () => {
    const normalizer = new NumberNormalizer();
    expect(normalizer.normalize('invalid number')).toBeUndefined();
  });

  it('should normalize numbers', () => {
    const normalizer = new NumberNormalizer();
    expect(normalizer.normalize(123)).toBe(123);
    expect(normalizer.normalize(3.14159)).toBe(3.14159);
  });

  it('should normalize valid numeric strings', () => {
    const normalizer = new NumberNormalizer();
    expect(normalizer.normalize('123')).toBe(123);
    expect(normalizer.normalize('45.67')).toBe(45.67);
  });
});