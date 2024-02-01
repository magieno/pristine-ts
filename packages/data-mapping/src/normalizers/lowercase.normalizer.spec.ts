import {LowercaseNormalizer} from "./lowercase.normalizer";
import {LowercaseNormalizerOptions} from "../normalizer-options/lowercase-normalizer.options";

describe('Lowercase Normalizer', () => {
    it("should properly lowercase a string", () => {
        const lowercaseNormalizer = new LowercaseNormalizer()

        expect(lowercaseNormalizer.normalize("AAA", new LowercaseNormalizerOptions())).toBe("aaa");
    })

    it('should return the original value for non-string types if shouldThrowIfTypeIsNotString is false', () => {
        const normalizer = new LowercaseNormalizer();
        expect(normalizer.normalize(null)).toBeNull();
        expect(normalizer.normalize({})).toBeInstanceOf(Object);
        expect(normalizer.normalize(123)).toBe(123);
    });

    it('should throw an error for non-string types if shouldThrowIfTypeIsNotString is true', () => {
        const normalizer = new LowercaseNormalizer();
        expect(() => normalizer.normalize(null, { shouldThrowIfTypeIsNotString: true })).toThrowError();
        expect(() => normalizer.normalize({}, { shouldThrowIfTypeIsNotString: true })).toThrowError();
        expect(() => normalizer.normalize(123, { shouldThrowIfTypeIsNotString: true })).toThrowError();
    });

    it('should lowercase strings', () => {
        const normalizer = new LowercaseNormalizer();
        expect(normalizer.normalize('HeLlO WoRlD')).toBe('hello world');
        expect(normalizer.normalize('MIXED CASE')).toBe('mixed case');
        expect(normalizer.normalize('already lowercase')).toBe('already lowercase');
    });
});