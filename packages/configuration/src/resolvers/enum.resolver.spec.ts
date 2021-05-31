import {ResolverInterface} from "@pristine-ts/common";
import {EnumResolver} from "./enum.resolver";

enum NumberEnum {
    Info = 0,
    Debug = 1,
    Error = 2,
    Bye = "byebye"
}
enum StringEnum {
    Bye = "byebye"
}
describe("Enum Resolver", () => {
    it("should transform a string matching the keys into a value of the enum", async () => {
        expect(await ((new EnumResolver("info", NumberEnum)).resolve())).toBe(NumberEnum.Info);
        expect(await ((new EnumResolver("Info", NumberEnum)).resolve())).toBe(NumberEnum.Info);
        expect(await ((new EnumResolver("INFO", NumberEnum)).resolve())).toBe(NumberEnum.Info);
        expect(await ((new EnumResolver("debug", NumberEnum)).resolve())).toBe(NumberEnum.Debug);
        expect(await ((new EnumResolver("Debug", NumberEnum)).resolve())).toBe(NumberEnum.Debug);
        expect(await ((new EnumResolver("DEBUG", NumberEnum)).resolve())).toBe(NumberEnum.Debug);
        expect(await ((new EnumResolver("error", NumberEnum)).resolve())).toBe(NumberEnum.Error);
        expect(await ((new EnumResolver("Error", NumberEnum)).resolve())).toBe(NumberEnum.Error);
        expect(await ((new EnumResolver("ERROR", NumberEnum)).resolve())).toBe(NumberEnum.Error);
    })

    it("should transform a string matching the value into a value of the enum", async () => {
        expect(await ((new EnumResolver("byebye", StringEnum)).resolve())).toBe(NumberEnum.Bye);
    })

    it("should throw an error when the string doesn't have an accepted value", () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        return expect((new EnumResolver("allo", NumberEnum)).resolve()).rejects.toThrow();
    })

    it("should transform a number with value in the enum", async () => {
        expect(await ((new EnumResolver(0, NumberEnum)).resolve())).toBe(NumberEnum.Info);
        expect(await ((new EnumResolver(1, NumberEnum)).resolve())).toBe(NumberEnum.Debug);
        expect(await ((new EnumResolver(2, NumberEnum)).resolve())).toBe(NumberEnum.Error);
    })

    it("should throw an error when the number doesn't have an accepted value", () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        return expect((new EnumResolver(100, NumberEnum)).resolve()).rejects.toThrow();
    })

    it("should call the resolver if it's a resolver", async () => {
        class TestResolver implements ResolverInterface<string> {
            async resolve(): Promise<string> {
                return "1";
            }
        }

        const testResolver = new TestResolver();
        const spy = jest.spyOn(testResolver, 'resolve');

        expect(await ((new EnumResolver(testResolver, NumberEnum)).resolve())).toBe(NumberEnum.Debug)
        expect(spy).toHaveBeenCalled();
    })

    it("should throw if an object is passed and the object is not a resolver", async () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        // @ts-ignore
        return expect((new EnumResolver({}, NumberEnum)).resolve()).rejects.toThrow();
    })

    it("should throw if an array is passed", async () => {
        // This must be returned in order for jest to check if it has properly thrown or not
        // @ts-ignore
        return expect((new EnumResolver([], NumberEnum)).resolve()).rejects.toThrow();
    })
})
