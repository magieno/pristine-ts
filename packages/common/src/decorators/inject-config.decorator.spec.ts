import "reflect-metadata";
import {container, injectable} from "tsyringe";
import {injectConfig} from "./inject-config.decorator";
import {inject} from "tsyringe";

describe("injectConfig", () => {
  beforeEach(() => {
    container.reset();
  });

  it("resolves a value registered under the %key% token format used by ConfigurationManager", () => {
    container.registerInstance("%my.config.key%", 42);

    @injectable()
    class Consumer {
      constructor(@injectConfig("my.config.key") public readonly value: number) {}
    }

    const instance = container.resolve(Consumer);
    expect(instance.value).toBe(42);
  });

  it("is interchangeable with @inject(\"%key%\") for backwards compatibility", () => {
    container.registerInstance("%backcompat.key%", "hello");

    @injectable()
    class WithLegacyInject {
      constructor(@inject("%backcompat.key%") public readonly value: string) {}
    }

    @injectable()
    class WithInjectConfig {
      constructor(@injectConfig("backcompat.key") public readonly value: string) {}
    }

    expect(container.resolve(WithLegacyInject).value).toBe("hello");
    expect(container.resolve(WithInjectConfig).value).toBe("hello");
  });

  it("supports keys built from concatenated module keynames", () => {
    const moduleKeyname = "pristine.example";
    container.registerInstance("%pristine.example.somevalue%", true);

    @injectable()
    class Consumer {
      constructor(@injectConfig(moduleKeyname + ".somevalue") public readonly flag: boolean) {}
    }

    expect(container.resolve(Consumer).flag).toBe(true);
  });
});
