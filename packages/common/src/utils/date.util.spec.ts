import {DateUtil} from "./date.util";

describe("DateUtil", () => {
    let dateUtil: DateUtil;

    beforeEach(() => {
        dateUtil = new DateUtil();
    });

    it('should format duration correctly for milliseconds', () => {
        const result = dateUtil.formatDuration(500);
        expect(result).toBe("500 ms");
    });

    it('should format duration correctly for seconds', () => {
        const result = dateUtil.formatDuration(1000);
        expect(result).toBe("1 second and 0 ms");
    });

    it('should format duration correctly for minutes', () => {
        const result = dateUtil.formatDuration(60000);
        expect(result).toBe("1 minute, 0 second and 0 ms");
    });

    it('should format duration correctly for hours', () => {
        const result = dateUtil.formatDuration(3600000);
        expect(result).toBe("1 hour, 0 minute, 0 second and 0 ms");
    });

    it('should format duration correctly for days', () => {
        const result = dateUtil.formatDuration(86400000);
        expect(result).toBe("1 day, 0 hour, 0 minute, 0 second and 0 ms");
    });

    it('should format duration correctly for years', () => {
        const result = dateUtil.formatDuration(31536000000);
        expect(result).toBe("1 year, 0 day, 0 hour, 0 minute, 0 second and 0 ms");
    });

    it('should format duration correctly for multiple time units', () => {
        const result = dateUtil.formatDuration(90061000);
        expect(result).toBe("1 day, 1 hour, 1 minute, 1 second and 0 ms");
    });

    it('should handle zero duration', () => {
        const result = dateUtil.formatDuration(0);
        expect(result).toBe("0 ms");
    });

    it('should handle negative duration', () => {
        const result = dateUtil.formatDuration(-1000);
        expect(result).toBe("0 ms");
    });
});