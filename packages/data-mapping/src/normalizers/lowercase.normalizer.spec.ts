import {LowercaseNormalizer} from "./lowercase.normalizer";
import {LowercaseNormalizerOptions} from "../normalizer-options/lowercase-normalizer.options";

describe('Lowercase Normalizer', () => {
    it("should properly lowercase a string", () => {
        const lowercaseNormalizer = new LowercaseNormalizer()

        expect(lowercaseNormalizer.normalize("AAA", new LowercaseNormalizerOptions())).toBe("aaa");
    })
});