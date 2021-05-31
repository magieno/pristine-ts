import {BooleanResolver} from "./boolean.resolver";
import {ResolverInterface} from "@pristine-ts/common/dist/lib/esm/interfaces/resolver.interface";

describe("Boolean Resolver", () => {
    it("should transform a string with value '1', '0', 'true', 'false', 'TRUE', 'FALSE' into the appropriate boolean", async () => {
        expect(await ((new BooleanResolver("0")).resolve())).toBeFalsy()
        expect(await ((new BooleanResolver("1")).resolve())).toBeTruthy()
        expect(await ((new BooleanResolver("false")).resolve())).toBeFalsy()
        expect(await ((new BooleanResolver("true")).resolve())).toBeTruthy()
        expect(await ((new BooleanResolver("FALSE")).resolve())).toBeFalsy()
        expect(await ((new BooleanResolver("TRUE")).resolve())).toBeTruthy()
    })

    it("should throw an error when the string doesn't have an accepted value", () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        return expect((new BooleanResolver("allo")).resolve()).rejects.toThrow();
    })

    it("should transform a number with value 0 or 1", async () => {
        expect(await ((new BooleanResolver(0)).resolve())).toBeFalsy()
        expect(await ((new BooleanResolver(1)).resolve())).toBeTruthy()
    })

    it("should throw an error when the number doesn't have an accepted value", () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        return expect((new BooleanResolver(100)).resolve()).rejects.toThrow();
    })

    it("should return the boolean when a boolean is passed", async () => {
        expect(await ((new BooleanResolver(false)).resolve())).toBeFalsy()
        expect(await ((new BooleanResolver(true)).resolve())).toBeTruthy()
    })

    it("should call the resolver if it's a resolver", async () => {
        class TestResolver implements ResolverInterface<string> {
            async resolve(): Promise<string> {
                return "1";
            }
        }

        const testResolver = new TestResolver();
        const spy = jest.spyOn(testResolver, 'resolve');

        expect(await ((new BooleanResolver(testResolver)).resolve())).toBeTruthy()
        expect(spy).toHaveBeenCalled();
    })

    it("should throw if an object is passed and the object is not a resolver", async () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        // @ts-ignore
        return expect((new BooleanResolver({})).resolve()).rejects.toThrow();
    })

    it("should throw if an array is passed", async () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        // @ts-ignore
        return expect((new BooleanResolver([])).resolve()).rejects.toThrow();
    })
})