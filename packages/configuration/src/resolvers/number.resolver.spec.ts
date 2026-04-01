import {ResolverInterface} from "@pristine-ts/common";
import {NumberResolver} from "./number.resolver";

describe("Number Resolver", () => {
  it("should transform a string with value '100', '0', '-100' into the appropriate number", async () => {
    expect(await ((new NumberResolver("0")).resolve())).toBe(0)
    expect(await ((new NumberResolver("100")).resolve())).toBe(100)
    expect(await ((new NumberResolver("-100")).resolve())).toBe(-100)
  })

  it("should throw an error when the string doesn't have an accepted value", () => {
    // This must be returned in order for jest to check if it has properly thrown or not
    return expect((new NumberResolver("allo")).resolve()).rejects.toThrow();
  })

  it("should return the boolean when a number is passed", async () => {
    expect(await ((new NumberResolver(100)).resolve())).toBe(100)
    expect(await ((new NumberResolver(0)).resolve())).toBe(0)
    expect(await ((new NumberResolver(-100)).resolve())).toBe(-100)
  })

  it("should return the boolean when a boolean is passed", async () => {
    expect(await ((new NumberResolver(false)).resolve())).toBe(0)
    expect(await ((new NumberResolver(true)).resolve())).toBe(1)
  })

  it("should call the resolver if it's a resolver", async () => {
    class TestResolver implements ResolverInterface<string> {
      async resolve(): Promise<string> {
        return "1";
      }
    }

    const testResolver = new TestResolver();
    const spy = jest.spyOn(testResolver, 'resolve');

    expect(await ((new NumberResolver(testResolver)).resolve())).toBe(1)
    expect(spy).toHaveBeenCalled();
  })

  it("should throw if an object is passed and the object is not a resolver", async () => {
    // This must be returned in order for jest to check if it has properly thrown or not
    // @ts-ignore
    return expect((new NumberResolver({})).resolve()).rejects.toThrow();
  })

  it("should throw if an array is passed", async () => {
    // This must be returned in order for jest to check if it has properly thrown or not
    // @ts-ignore
    return expect((new NumberResolver([])).resolve()).rejects.toThrow();
  })
})
