import "reflect-metadata";
import {StringListResolver} from "./string-list.resolver";
import {ResolverInterface} from "@pristine-ts/common";

describe("String List Resolver", () => {
  it("should split a comma-separated string, trim each entry and drop the empty ones", async () => {
    expect(await new StringListResolver("authorization, x-api-key ,cookie").resolve()).toEqual(["authorization", "x-api-key", "cookie"]);
    expect(await new StringListResolver("authorization,").resolve()).toEqual(["authorization"]);
    expect(await new StringListResolver(",,").resolve()).toEqual([]);
    expect(await new StringListResolver("").resolve()).toEqual([]);
    expect(await new StringListResolver("   ").resolve()).toEqual([]);
  })

  it("should split on the separator that is given", async () => {
    expect(await new StringListResolver("a{1,3}b; c", ";").resolve()).toEqual(["a{1,3}b", "c"]);
    expect(await new StringListResolver("a b  c", " ").resolve()).toEqual(["a", "b", "c"]);
  })

  it("should read a JSON array, so that an entry can contain the separator", async () => {
    expect(await new StringListResolver('["a{1,3}b", "c"]').resolve()).toEqual(["a{1,3}b", "c"]);
    expect(await new StringListResolver(' [] ').resolve()).toEqual([]);
    // In a JSON array an entry is kept as it is written: it is not trimmed and not dropped.
    expect(await new StringListResolver('[" a ", ""]').resolve()).toEqual([" a ", ""]);
  })

  it("should throw when the string looks like a JSON array and isn't a valid list of strings", () => {
    return Promise.all([
      expect(new StringListResolver('["a", ').resolve()).rejects.toThrow(),
      expect(new StringListResolver('["a", 1]').resolve()).rejects.toThrow(),
      expect(new StringListResolver('[["a"]]').resolve()).rejects.toThrow(),
    ]);
  })

  it("should return a copy of the list when a list is passed", async () => {
    const list = ["a", "b"];
    const resolved = await new StringListResolver(list).resolve();
    expect(resolved).toEqual(["a", "b"]);
    expect(resolved).not.toBe(list);
  })

  it("should throw when the list contains something that isn't a string", () => {
    return expect(new StringListResolver(["a", 1 as any]).resolve()).rejects.toThrow();
  })

  it("should call the resolver if it's a resolver, whether it gives a string or a list", async () => {
    class TextResolver implements ResolverInterface<string> {
      async resolve(): Promise<string> {
        return "a,b";
      }
    }

    class ListResolver implements ResolverInterface<string[]> {
      async resolve(): Promise<string[]> {
        return ["c", "d"];
      }
    }

    expect(await new StringListResolver(new TextResolver()).resolve()).toEqual(["a", "b"]);
    expect(await new StringListResolver(new ListResolver()).resolve()).toEqual(["c", "d"]);
  })

  it("should let the error of the inner resolver through, so the manager goes on to the default value", () => {
    class MissingResolver implements ResolverInterface<string> {
      async resolve(): Promise<string> {
        throw new Error("Cannot find the environment variable.");
      }
    }

    return expect(new StringListResolver(new MissingResolver()).resolve()).rejects.toThrow("Cannot find the environment variable.");
  })

  it("should throw when the value is neither a string, a list nor a resolver", () => {
    return expect(new StringListResolver(42 as any).resolve()).rejects.toThrow();
  })
});
