import "reflect-metadata";
import {
  ArrayMaxSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "@pristine-ts/class-validator";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsDateString,
  IsDivisibleBy,
  IsFQDN,
  IsNegative,
  IsNotEmptyObject,
  IsObject,
  IsRFC3339,
  IsUUID,
  Length,
  MinLength,
} from "@pristine-ts/class-validator";
import {array} from "@pristine-ts/data-mapping-common";
import {JsonSchemaGenerator} from "./json-schema.generator";
import {mcpToolParameter} from "../decorators/mcp-tool-parameter.decorator";
import {McpToolDeclarationError} from "../errors/mcp-tool-declaration.error";

enum PriorityEnum {
  Low = "low",
  High = "high",
}

enum LevelEnum {
  One = 1,
  Two = 2,
}

class LinkInput {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  label?: string;
}

class CreateTodoInput {
  @mcpToolParameter({description: "The title of the to-do.", examples: ["Buy milk"]})
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsEnum(PriorityEnum)
  priority?: PriorityEnum;

  @IsOptional()
  @IsEnum(LevelEnum)
  level?: LevelEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  estimate?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsEmail()
  assignee?: string;

  @IsOptional()
  @Matches(/^[a-z]+$/)
  slug?: string;

  @IsOptional()
  @IsIn(["a", "b"])
  bucket?: string;

  @IsOptional()
  @Equals("todo")
  kind?: string;

  @ValidateIf((input: CreateTodoInput) => input.done === true)
  @IsString()
  doneReason?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @mcpToolParameter({description: "Tags.", schema: {items: {type: "string"}}})
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @array(LinkInput)
  links?: LinkInput[];

  @IsOptional()
  @ValidateNested()
  primaryLink?: LinkInput;
}

class MoreConstraintsInput {
  @MinLength(2)
  short: string;

  @Length(1, 3)
  code: string;

  @IsNumber()
  @IsNegative()
  @IsDivisibleBy(5)
  offset: number;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayNotEmpty()
  pair: string[];

  @IsArray()
  @ArrayNotEmpty()
  some: string[];

  @IsObject()
  @IsNotEmptyObject()
  metadata: object;

  @IsUUID()
  id: string;

  @IsFQDN()
  host: string;

  @IsRFC3339()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsIn([0.5, 1.5])
  ratio: number;

  @IsIn(["a", 1])
  mixed: unknown;

  @mcpToolParameter({title: "Anything", default: null})
  anything: any;

  @array(Number)
  numbers: number[];
}

class RecursiveInput {
  @IsOptional()
  @ValidateNested()
  child?: RecursiveInput;
}

describe("JsonSchemaGenerator", () => {
  const generator = new JsonSchemaGenerator();

  it("should describe an input class as a closed object with its required properties", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(["title"]);
  });

  it("should translate string constraints and the parameter options", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.title).toEqual({
      type: "string",
      minLength: 1,
      maxLength: 200,
      description: "The title of the to-do.",
      examples: ["Buy milk"],
    });
    expect(schema.properties!.assignee).toEqual({type: "string", format: "email"});
    expect(schema.properties!.slug).toEqual({type: "string", pattern: "^[a-z]+$"});
  });

  it("should translate string, numeric and mixed enums", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.priority).toEqual({type: "string", enum: ["low", "high"]});
    expect(schema.properties!.level).toEqual({type: "integer", enum: [1, 2]});
    expect(schema.properties!.bucket).toEqual({type: "string", enum: ["a", "b"]});
    expect(schema.properties!.kind).toEqual({const: "todo"});
  });

  it("should translate numbers, booleans and dates", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.estimate).toEqual({type: "integer", minimum: 0, maximum: 10});
    expect(schema.properties!.weight).toEqual({type: "number", exclusiveMinimum: 0});
    expect(schema.properties!.done).toEqual({type: "boolean"});
    expect(schema.properties!.dueDate).toEqual({type: "string", format: "date-time"});
  });

  it("should treat a property under @ValidateIf as not required", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.doneReason).toEqual({type: "string"});
    expect(schema.required).not.toContain("doneReason");
  });

  it("should take the item schema of an array from @mcpToolParameter or from @array", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.tags).toEqual({
      type: "array",
      maxItems: 5,
      uniqueItems: true,
      description: "Tags.",
      items: {type: "string"},
    });
    expect(schema.properties!.links).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          url: {type: "string", format: "uri"},
          label: {type: "string"},
        },
        required: ["url"],
        additionalProperties: false,
      },
    });
  });

  it("should describe a nested class from its design type", () => {
    const schema = generator.generateObjectSchema(CreateTodoInput);

    expect(schema.properties!.primaryLink).toEqual(schema.properties!.links.items);
  });

  it("should translate the remaining constraints", () => {
    const properties = generator.generateObjectSchema(MoreConstraintsInput).properties!;

    expect(properties.short).toEqual({type: "string", minLength: 2});
    expect(properties.code).toEqual({type: "string", minLength: 1, maxLength: 3});
    expect(properties.offset).toEqual({type: "number", exclusiveMaximum: 0, multipleOf: 5});
    expect(properties.pair).toEqual({type: "array", minItems: 2});
    expect(properties.some).toEqual({type: "array", minItems: 1});
    expect(properties.metadata).toEqual({type: "object", minProperties: 1});
    expect(properties.id).toEqual({type: "string", format: "uuid"});
    expect(properties.host).toEqual({type: "string", format: "hostname"});
    expect(properties.createdAt).toEqual({type: "string", format: "date-time"});
    expect(properties.updatedAt).toEqual({type: "string", format: "date-time"});
    expect(properties.ratio).toEqual({type: "number", enum: [0.5, 1.5]});
    expect(properties.mixed).toEqual({enum: ["a", 1]});
    expect(properties.anything).toEqual({title: "Anything", default: null});
    expect(properties.numbers).toEqual({type: "array", items: {type: "number"}});
  });

  it("should refuse a recursive input", () => {
    expect(() => generator.generateObjectSchema(RecursiveInput)).toThrow(McpToolDeclarationError);
  });
});
