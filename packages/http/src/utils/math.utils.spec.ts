import {MathUtils} from "./math.utils";

describe("Math Utils", () => {
    it("should return the proper expected exponential backoff", () => {
        const a = MathUtils.exponentialBackoffWithJitter(0);
        const b = MathUtils.exponentialBackoffWithJitter(1);
        const c = MathUtils.exponentialBackoffWithJitter(2);
        const d = MathUtils.exponentialBackoffWithJitter(3);
        const e = MathUtils.exponentialBackoffWithJitter(4);
        const f = MathUtils.exponentialBackoffWithJitter(5);
        const g = MathUtils.exponentialBackoffWithJitter(6);

        expect(a).toBeLessThan(b);
        expect(b).toBeLessThan(c);
        expect(c).toBeLessThan(d);
        expect(d).toBeLessThan(e);
        expect(e).toBeLessThan(f);
        expect(f).toBeLessThan(g);
    })
})