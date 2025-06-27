import {BooleanNormalizer, BooleanNormalizerUniqueKey} from './boolean.normalizer';

describe('BooleanNormalizer', () => {
  let normalizer: BooleanNormalizer;

  beforeEach(() => {
    normalizer = new BooleanNormalizer();
  });

  describe('getUniqueKey', () => {
    it('should return the unique key for the boolean normalizer', () => {
      expect(normalizer.getUniqueKey()).toBe(BooleanNormalizerUniqueKey);
    });
  });

  describe('normalize', () => {

    // Test cases for string inputs
    describe('when source is a string', () => {
      it('should return true for the string "true"', () => {
        expect(normalizer.normalize("true")).toBe(true);
      });

      it('should return true for the string "1"', () => {
        expect(normalizer.normalize("1")).toBe(true);
      });

      it('should return false for the string "false"', () => {
        expect(normalizer.normalize("false")).toBe(false);
      });

      it('should return false for any other string', () => {
        expect(normalizer.normalize("any other string")).toBe(false);
        expect(normalizer.normalize("0")).toBe(false);
        expect(normalizer.normalize("")).toBe(false);
      });
    });

    // Test cases for number inputs
    describe('when source is a number', () => {
      it('should return true for the number 1', () => {
        expect(normalizer.normalize(1)).toBe(true);
      });

      it('should return false for the number 0', () => {
        expect(normalizer.normalize(0)).toBe(false);
      });

      it('should return false for any other number', () => {
        expect(normalizer.normalize(123)).toBe(false);
        expect(normalizer.normalize(-1)).toBe(false);
      });
    });

    // Test cases for boolean inputs
    describe('when source is a boolean', () => {
      it('should return true for the boolean true', () => {
        expect(normalizer.normalize(true)).toBe(true);
      });

      it('should return false for the boolean false', () => {
        expect(normalizer.normalize(false)).toBe(false);
      });
    });

    // Test cases for other data types
    describe('when source is another type', () => {
      it('should return false for null', () => {
        expect(normalizer.normalize(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(normalizer.normalize(undefined)).toBe(false);
      });

      it('should return false for an object', () => {
        expect(normalizer.normalize({})).toBe(false);
        expect(normalizer.normalize({value: "true"})).toBe(false);
      });

      it('should return false for an array', () => {
        expect(normalizer.normalize([])).toBe(false);
        expect(normalizer.normalize([true])).toBe(false);
      });
    });
  });
});