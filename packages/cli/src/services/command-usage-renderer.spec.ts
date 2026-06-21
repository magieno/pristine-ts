import "reflect-metadata";
import {IsBoolean, IsOptional, IsString} from "@pristine-ts/class-validator";
import {CommandUsageRenderer} from "./command-usage-renderer";
import {commandParameter} from "../decorators/command-parameter.decorator";

class AddOptions {
  @commandParameter({valueHint: "name"})
  @IsString()
  name!: string;

  @commandParameter({flag: "pubkey", valueHint: "key-or-file"})
  @IsOptional()
  @IsString()
  pubkey?: string;

  @commandParameter({valueHint: "who-connects"})
  @IsOptional()
  @IsString()
  label?: string;

  @commandParameter()
  @IsOptional()
  @IsBoolean()
  rotate?: boolean;
}

class DefaultHintOptions {
  @commandParameter()
  @IsString()
  database!: string;

  @commandParameter({flag: "out-dir"})
  @IsOptional()
  @IsString()
  outputDirectory?: string;
}

class NoParamsOptions {
}

describe("CommandUsageRenderer", () => {
  const renderer = new CommandUsageRenderer();

  it("renders required, optional, aliased, hinted and boolean tokens in declaration order", () => {
    expect(renderer.render(AddOptions, "key:add", "myapp"))
      .toBe("Usage: myapp key:add --name=<name> [--pubkey=<key-or-file>] [--label=<who-connects>] [--rotate]");
  });

  it("defaults the value placeholder to the property name and honors the flag alias", () => {
    expect(renderer.render(DefaultHintOptions, "build", "pristine"))
      .toBe("Usage: pristine build --database=<database> [--out-dir=<outputDirectory>]");
  });

  it("renders just the bin and command when there are no parameters", () => {
    expect(renderer.render(NoParamsOptions, "help", "myapp")).toBe("Usage: myapp help");
  });
});
