import "reflect-metadata";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {commandParameter} from "./command-parameter.decorator";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";

class Sample {
  @commandParameter({flag: "db-url", question: "Database URL?"})
  databaseUrl?: string;

  @commandParameter()
  plain?: string;
}

describe("commandParameter decorator", () => {
  it("stores the options as property metadata under the cli:command-parameter key", () => {
    const meta = PropertyMetadata.getMetadata(Sample.prototype, "databaseUrl", CliDecoratorMetadataKeynameEnum.CommandParameter);
    expect(meta).toEqual({flag: "db-url", question: "Database URL?"});
  });

  it("defaults to an empty options object when called with no arguments", () => {
    const meta = PropertyMetadata.getMetadata(Sample.prototype, "plain", CliDecoratorMetadataKeynameEnum.CommandParameter);
    expect(meta).toEqual({});
  });

  it("registers decorated properties so they are discoverable on the class", () => {
    const properties = ClassMetadata.getInformation(Sample).properties;
    expect(properties).toEqual(expect.arrayContaining(["databaseUrl", "plain"]));
  });
});
