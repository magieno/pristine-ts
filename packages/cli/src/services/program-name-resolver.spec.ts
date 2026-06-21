import "reflect-metadata";
import {ProgramNameResolver} from "./program-name-resolver";

describe("ProgramNameResolver", () => {
  it("prefers the configured bin name over argv", () => {
    expect(new ProgramNameResolver("myapp").resolve(["node", "/usr/local/bin/pristine.cjs", "cmd"])).toBe("myapp");
  });

  it("ignores a blank configured name and derives from argv[1]'s basename (extension stripped)", () => {
    expect(new ProgramNameResolver("   ").resolve(["node", "/proj/node_modules/.bin/myapp"])).toBe("myapp");
    expect(new ProgramNameResolver("").resolve(["node", "/proj/dist/bin/cli.cjs"])).toBe("cli");
  });

  it("falls back to 'pristine' when argv carries no script path", () => {
    expect(new ProgramNameResolver("").resolve(["node"])).toBe("pristine");
  });
});
