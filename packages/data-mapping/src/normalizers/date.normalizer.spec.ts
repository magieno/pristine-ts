import "reflect-metadata"
import {DateNormalizer} from "./date.normalizer";

describe('DateNormalizer', () => {

    it('should return undefined for undefined input', () => {
        const normalizer = new DateNormalizer();
        expect(normalizer.normalize(undefined)).toBeUndefined();
    });

    it('should return the current date for undefined input when returnUndefinedOnInvalidDate is false', () => {
        const normalizer = new DateNormalizer();
        const expectedDate = new Date();
        expect(normalizer.normalize(undefined, {returnUndefinedOnInvalidDate: false})).toEqual(expectedDate);
    });

    it('should return a Date object for a valid date string', () => {
        const normalizer = new DateNormalizer();
        const dateString = '2024-01-31T18:53:00Z';
        const expectedDate = new Date(dateString);
        expect(normalizer.normalize(dateString)).toEqual(expectedDate);
    });

    it('should return undefined for an invalid date string', () => {
        const normalizer = new DateNormalizer();
        const invalidDateString = 'invalid-date';
        expect(normalizer.normalize(invalidDateString)).toBeUndefined();
    });

    it('should return the current date for an invalid date string when returnUndefinedOnInvalidDate is false', () => {
        const normalizer = new DateNormalizer();
        const invalidDateString = 'invalid-date';
        const expectedDate = new Date();
        expect(normalizer.normalize(invalidDateString, {returnUndefinedOnInvalidDate: false})).toEqual(expectedDate);
    });

    it('should return a Date object for a number representing milliseconds', () => {
        const normalizer = new DateNormalizer();
        const milliseconds = 1675275580000; // Represents 2024-01-31T18:53:00Z
        const expectedDate = new Date(milliseconds);
        expect(normalizer.normalize(milliseconds)).toEqual(expectedDate);
    });

    it('should treat a number as seconds when options.treatNumbers is "seconds"', () => {
        const normalizer = new DateNormalizer();
        const seconds = 1675275580; // Represents 2024-01-31T18:53:00Z in seconds
        const expectedDate = new Date(seconds * 1000);
        expect(normalizer.normalize(seconds, {treatNumbers: 'seconds'})).toEqual(expectedDate);
    });

    it('should return a Date object for a valid date object', () => {
        const normalizer = new DateNormalizer();
        const dateObject = {year: 2024, month: 0, day: 31, hours: 18, minutes: 53, seconds: 0};
        const expectedDate = new Date(2024, 0, 31, 18, 53, 0);

        const normalizedDate = normalizer.normalize(dateObject);
        expect(normalizedDate).toBeDefined()
        expect(normalizedDate!.getSeconds()).toEqual(expectedDate.getSeconds());
        expect(normalizedDate!.getMinutes()).toEqual(expectedDate.getMinutes());
        expect(normalizedDate!.getHours()).toEqual(expectedDate.getHours());
        expect(normalizedDate!.getDate()).toEqual(expectedDate.getDate());
        expect(normalizedDate!.getMonth()).toEqual(expectedDate.getMonth());
        expect(normalizedDate!.getFullYear()).toEqual(expectedDate.getFullYear());
    });

    it('should return undefined for an invalid date object', () => {
        const normalizer = new DateNormalizer();
        const invalidDateObject = {year: 'invalid', month: 100};
        expect(normalizer.normalize(invalidDateObject)).toBeUndefined();
    });
});