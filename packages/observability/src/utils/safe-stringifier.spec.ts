import {SafeStringifier} from "./safe-stringifier";

describe("SafeStringifier", () => {
  it("round-trips ordinary values unchanged", () => {
    const stringifier = new SafeStringifier();
    const value = {message: "hello", count: 3, nested: {ok: true}, list: [1, 2, 3]};

    expect(JSON.parse(stringifier.stringify(value))).toEqual(value);
  });

  it("replaces cycles with a marker", () => {
    const stringifier = new SafeStringifier();
    const parent: any = {name: "parent"};
    parent.child = {name: "child", parent};

    const result = JSON.parse(stringifier.stringify(parent));
    expect(result.child.parent).toBe("[Circular]");
  });

  it("expands the same object twice when it is a sibling, not a cycle", () => {
    const stringifier = new SafeStringifier();
    const shared = {shared: true};

    const result = JSON.parse(stringifier.stringify({a: shared, b: shared}));
    expect(result.a).toEqual({shared: true});
    expect(result.b).toEqual({shared: true});
  });

  it("cuts nesting past maxDepth", () => {
    const stringifier = new SafeStringifier(3);
    const value = {a: {b: {c: {d: {e: "too deep"}}}}};

    const result = JSON.parse(stringifier.stringify(value));
    expect(result.a.b.c).toBe("[MaxDepth]");
  });

  it("cuts arrays past maxArrayLength and says how many were dropped", () => {
    const stringifier = new SafeStringifier(12, 3);

    const result = JSON.parse(stringifier.stringify({items: [1, 2, 3, 4, 5, 6]}));
    expect(result.items).toEqual([1, 2, 3, "[…3 more]"]);
  });

  it("cuts objects past maxKeys and records the count", () => {
    const stringifier = new SafeStringifier(12, 200, 2);

    const result = JSON.parse(stringifier.stringify({a: 1, b: 2, c: 3, d: 4}));
    expect(Object.keys(result)).toEqual(["a", "b", "__truncatedKeys"]);
    expect(result.__truncatedKeys).toBe(2);
  });

  it("truncates long strings", () => {
    const stringifier = new SafeStringifier(12, 200, 200, 10);

    const result = JSON.parse(stringifier.stringify({blob: "x".repeat(100)}));
    expect(result.blob).toBe(`${"x".repeat(10)}…(90 more chars)`);
  });

  it("keeps a throwing getter from taking down the entry", () => {
    const stringifier = new SafeStringifier();
    const value = {
      safe: "kept",
      get hostile(): string {
        throw new Error("nope");
      },
    };

    const result = JSON.parse(stringifier.stringify(value));
    expect(result.safe).toBe("kept");
    expect(result.hostile).toBe("[Unreadable]");
  });

  it("renders errors, dates, bigints and functions as serializable values", () => {
    const stringifier = new SafeStringifier();
    const value = {
      error: new Error("boom"),
      date: new Date("2026-01-02T03:04:05.000Z"),
      big: BigInt(42),
      fn: (): void => undefined,
    };

    const result = JSON.parse(stringifier.stringify(value));
    expect(result.error.name).toBe("Error");
    expect(result.error.message).toBe("boom");
    expect(result.date).toBe("2026-01-02T03:04:05.000Z");
    expect(result.big).toBe("42n");
    expect(result.fn).toBe("[function]");
  });

  it("always produces parseable JSON, even for a deeply cyclic tree", () => {
    const stringifier = new SafeStringifier();
    // The shape that motivated this class: a span tree with parent ↔ children cycles.
    const root: any = {keyname: "root", children: [] as any[]};
    let current = root;
    for (let depth = 0; depth < 50; depth++) {
      const child: any = {keyname: `span-${depth}`, parentSpan: current, children: []};
      current.children.push(child);
      current = child;
    }

    expect(() => JSON.parse(stringifier.stringify(root))).not.toThrow();
  });
});
