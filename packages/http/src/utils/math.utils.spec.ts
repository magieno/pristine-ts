import {MathUtils} from "./math.utils";

describe("Math Utils", () => {
    it("should return the proper expected exponential backoff", () => {
        const a1 = MathUtils.exponentialBackoffWithJitter(0);
        const a2 = MathUtils.exponentialBackoffWithJitter(1);
        const a = MathUtils.exponentialBackoffWithJitter(2);
        const b = MathUtils.exponentialBackoffWithJitter(3);
        const c = MathUtils.exponentialBackoffWithJitter(4);
        const d = MathUtils.exponentialBackoffWithJitter(5);
        const e = MathUtils.exponentialBackoffWithJitter(6);
    })
})