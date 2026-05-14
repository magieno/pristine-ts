// eslint and @typescript-eslint/parser ship JS without bundled .d.ts at the monorepo
// root, so we require() them and treat them as any. The tests don't need the typed
// surface — they only call .verify() and inspect message objects.
const {Linter}: {Linter: any} = require("eslint");
const parser: any = require("@typescript-eslint/parser");
import path from "path";
import fs from "fs";
import os from "os";
import plugin from "../index";

/**
 * The rule needs the typescript-eslint type service, which requires a real tsconfig
 * pointing at real source files. We materialize a temporary project on disk for each
 * test, run the linter against it, and assert on the messages.
 */
function lintWithFixture(fileName: string, source: string, extraFiles: Record<string, string> = {}): any[] {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-eslint-test-"));
  try {
    // Bring the real common package into the fixture so the rule can find the
    // PristineConfigurationValueMap interface (with merged augmentations from all
    // imported packages).
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        moduleResolution: "node",
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strict: false,
        skipLibCheck: true,
        esModuleInterop: true,
      },
      include: ["**/*.ts"],
    };
    fs.writeFileSync(path.join(tmp, "tsconfig.json"), JSON.stringify(tsconfig));
    fs.writeFileSync(path.join(tmp, fileName), source);
    for (const [name, content] of Object.entries(extraFiles)) {
      const fullPath = path.join(tmp, name);
      fs.mkdirSync(path.dirname(fullPath), {recursive: true});
      fs.writeFileSync(fullPath, content);
    }

    const linter = new Linter();
    linter.defineParser("@typescript-eslint/parser", parser as any);
    linter.defineRule(
      "@pristine-ts/inject-config-type-match",
      plugin.rules["inject-config-type-match"] as any,
    );

    return linter.verify(source, {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: path.join(tmp, "tsconfig.json"),
        tsconfigRootDir: tmp,
        sourceType: "module",
      },
      rules: {
        "@pristine-ts/inject-config-type-match": "error",
      },
    } as any, {filename: path.join(tmp, fileName)});
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

const valueMapStub = `
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap {
    "test.string-key": string;
    "test.number-key": number;
    "test.boolean-key": boolean;
  }
}
export {};
`;

const injectConfigStub = `
export const injectConfig = <T = unknown>(_key: string): any => () => undefined;
`;

const baseFiles: Record<string, string> = {
  "value-map.ts": valueMapStub,
  "node_modules/@pristine-ts/common/index.ts": `
    ${injectConfigStub}
    export interface PristineConfigurationValueMap {}
  `,
  "node_modules/@pristine-ts/common/package.json": JSON.stringify({
    name: "@pristine-ts/common",
    main: "index.ts",
    types: "index.ts",
  }),
};

describe("inject-config-type-match", () => {
  it("accepts a parameter type that matches the value map", () => {
    const messages = lintWithFixture(
      "consumer.ts",
      `import "./value-map";
       import {injectConfig} from "@pristine-ts/common";

       class Consumer {
         constructor(@injectConfig("test.string-key") private readonly host: string) {}
       }
      `,
      baseFiles,
    );
    expect(messages).toEqual([]);
  });

  it("flags a parameter typed `number` when the map says `string`", () => {
    const messages = lintWithFixture(
      "consumer.ts",
      `import "./value-map";
       import {injectConfig} from "@pristine-ts/common";

       class Consumer {
         constructor(@injectConfig("test.string-key") private readonly host: number) {}
       }
      `,
      baseFiles,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe("typeMismatch");
    expect(messages[0].message).toContain("test.string-key");
    expect(messages[0].message).toContain("string");
    expect(messages[0].message).toContain("number");
  });

  it("flags an unknown key as missingFromMap", () => {
    const messages = lintWithFixture(
      "consumer.ts",
      `import "./value-map";
       import {injectConfig} from "@pristine-ts/common";

       class Consumer {
         constructor(@injectConfig("test.unknown-key") private readonly value: string) {}
       }
      `,
      baseFiles,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe("missingFromMap");
    expect(messages[0].message).toContain("test.unknown-key");
  });

  it("flags non-literal keys with nonLiteralKey", () => {
    const messages = lintWithFixture(
      "consumer.ts",
      `import "./value-map";
       import {injectConfig} from "@pristine-ts/common";

       const dynamicKey: string = process.env.SOME_KEY!;
       class Consumer {
         constructor(@injectConfig(dynamicKey) private readonly value: string) {}
       }
      `,
      baseFiles,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe("nonLiteralKey");
  });

  it("ignores decorators that aren't @injectConfig", () => {
    const messages = lintWithFixture(
      "consumer.ts",
      `import "./value-map";

       const inject = (_token: string): any => () => undefined;

       class Consumer {
         constructor(@inject("test.string-key") private readonly host: number) {}
       }
      `,
      baseFiles,
    );
    expect(messages).toEqual([]);
  });
});
