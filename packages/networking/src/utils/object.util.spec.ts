import {ObjectUtil} from "./object.util";

/**
 * These tests lock in the `lodash.merge` semantics the router relies on when combining a
 * class-level and a method-level route context (see Router.setup). This path was previously
 * uncovered; `ObjectUtil.deepMerge` replaced `lodash.mergeWith({}, ...)` and must behave
 * identically for the shared-key, nested-object and array cases below.
 */
describe("ObjectUtil.deepMerge", () => {
  it("should deep-merge a key present on both sides instead of overwriting it (route @responseHeader)", () => {
    const classLevel = {"@responseHeader": {"X-Class": "1"}};
    const methodLevel = {"@responseHeader": {"X-Method": "2"}};

    const merged = ObjectUtil.deepMerge(classLevel, methodLevel);

    expect(merged).toEqual({"@responseHeader": {"X-Class": "1", "X-Method": "2"}});
  });

  it("should merge arrays by index like lodash.merge, not concatenate or replace (route @guard)", () => {
    const classLevel = {"@guard": [{name: "a", options: {x: 1}}]};
    const methodLevel = {"@guard": [{options: {y: 2}}, {name: "b"}]};

    const merged = ObjectUtil.deepMerge(classLevel, methodLevel);

    expect(merged).toEqual({"@guard": [{name: "a", options: {x: 1, y: 2}}, {name: "b"}]});
  });

  it("should let a later source overwrite primitive values", () => {
    const merged = ObjectUtil.deepMerge({a: 1, b: "x"}, {b: "y", c: true});

    expect(merged).toEqual({a: 1, b: "y", c: true});
  });

  it("should skip source properties that resolve to undefined", () => {
    const merged = ObjectUtil.deepMerge({a: 1}, {a: undefined, b: 2});

    expect(merged).toEqual({a: 1, b: 2});
  });

  it("should ignore non-object sources (parity with mergeWith({}, a, undefined))", () => {
    const merged = ObjectUtil.deepMerge({a: 1}, undefined, null);

    expect(merged).toEqual({a: 1});
  });

  it("should not mutate any source and should clone nested containers", () => {
    const classLevel = {nested: {a: 1}, list: [{k: 1}]};
    const methodLevel = {nested: {b: 2}};

    const merged = ObjectUtil.deepMerge(classLevel, methodLevel);

    expect(classLevel).toEqual({nested: {a: 1}, list: [{k: 1}]});
    expect(methodLevel).toEqual({nested: {b: 2}});
    expect(merged.nested).not.toBe(classLevel.nested);
    expect(merged.nested).not.toBe(methodLevel.nested);
    expect(merged.list).not.toBe(classLevel.list);
    expect(merged.list[0]).not.toBe(classLevel.list[0]);
  });

  it("should return a fresh object even when merging a single source", () => {
    const source = {a: {b: 1}};

    const merged = ObjectUtil.deepMerge(source);

    expect(merged).toEqual(source);
    expect(merged).not.toBe(source);
    expect(merged.a).not.toBe(source.a);
  });
});
