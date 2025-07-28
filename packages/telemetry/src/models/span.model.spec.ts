import {Span} from "./span.model";
import {Trace} from "./trace.model";

describe("Span Model", () => {
  it("should properly add a child to the span by setting the relationships accordingly.", () => {
    const span = new Span("keyname");

    const childSpan = new Span("child");

    const grandChildSpan = new Span("grandchild");

    span.addChild(childSpan);

    childSpan.addChild(grandChildSpan);

    // Verify the children
    expect(span.children[0]).toBe(childSpan);
    expect(span.children[0].children[0]).toBe(grandChildSpan);

    // Verify the parents
    expect(grandChildSpan.parentSpan).toBe(childSpan);
    expect(childSpan.parentSpan).toBe(span);
  })

  it("should only set the child once if two spans with the same ids are passed", () => {
    const span = new Span("keyname");

    const childSpan = new Span("child");

    span.addChild(childSpan);
    span.addChild(childSpan);

    // Verify the children
    expect(span.children.length).toBe(1);
  })

  it("should generate an id if the id isn't passed to the constructor", () => {
    expect((new Span("keyname")).id).toBeDefined();
    expect((new Span("keyname")).id).not.toBe("");
  })

  it("should set the trace to itself but also all the children", () => {
    const span = new Span("keyname");

    const childSpan = new Span("child");

    const grandChildSpan = new Span("grandchild");

    span.addChild(childSpan);

    childSpan.addChild(grandChildSpan);

    const trace = new Trace();

    span.setTrace(trace);

    expect(span.trace).toBeDefined();
    expect(childSpan.trace).toBeDefined();
    expect(grandChildSpan.trace).toBeDefined();
  })

  it("should calculate the duration properly", () => {
    const span = new Span("keyname");
    span.startDate = 0;
    span.endDate = 1000;

    expect(span.getDuration()).toBe(1000)
  })
});