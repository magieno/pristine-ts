import "reflect-metadata";
import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {moduleScoped} from "@pristine-ts/common";
import {ClassMetadata, PropertyInformationEnum, PropertyMetadata} from "@pristine-ts/metadata";
import {
  ArrayMaxSizeValidator,
  ArrayMinSizeValidator,
  ArrayNotEmptyValidator,
  ArrayUniqueValidator,
  EqualsValidator,
  IsArrayValidator,
  IsBooleanValidator,
  IsDateStringValidator,
  IsDateValidator,
  IsDivisibleByValidator,
  IsEmailValidator,
  IsEnumValidator,
  IsFQDNValidator,
  IsInValidator,
  IsIntValidator,
  IsNegativeValidator,
  IsNotEmptyObjectValidator,
  IsNotEmptyValidator,
  IsNumberValidator,
  IsObjectValidator,
  IsOptionalCondition,
  IsPositiveValidator,
  IsRFC3339Validator,
  IsStringValidator,
  IsUrlValidator,
  IsUUIDValidator,
  LengthValidator,
  MatchesValidator,
  MaxLengthValidator,
  MaxValidator,
  MetadataKeynameEnum,
  MinLengthValidator,
  MinValidator,
  ValidateIfCondition,
  ValidatorInterface,
} from "@pristine-ts/class-validator";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {JsonSchemaInterface} from "../interfaces/json-schema.interface";
import {McpToolParameterOptionsInterface} from "../interfaces/mcp-tool-parameter-options.interface";
import {McpMetadataKeynameEnum} from "../enums/mcp-metadata-keyname.enum";
import {McpToolDeclarationError} from "../errors/mcp-tool-declaration.error";

/**
 * Builds a JSON Schema (2020-12) from a class decorated with `@pristine-ts/class-validator`.
 *
 * The validation decorators stay the single source of truth: the schema tells the model what to
 * send, and the same decorators validate what it sent. A property is listed when at least one
 * decorator marks it; it is required unless it carries `@IsOptional()` or `@ValidateIf()`.
 *
 * Only the constraints JSON Schema can express are translated. The others (`@IsPhoneNumber`,
 * `@Custom`, ...) are still enforced on every call; the schema is just more permissive than the
 * validation. `@mcpToolParameter({schema})` closes any gap by hand.
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class JsonSchemaGenerator {
  /**
   * Returns the object schema of a class.
   *
   * @param classType The class to describe.
   */
  public generateObjectSchema(classType: ClassConstructor<any>): JsonSchemaInterface {
    return this.objectSchema(classType, []);
  }

  /**
   * @param classType The class to describe.
   * @param ancestors The classes already being described above this one, to detect recursion.
   */
  private objectSchema(classType: ClassConstructor<any>, ancestors: Function[]): JsonSchemaInterface {
    if (ancestors.includes(classType)) {
      throw new McpToolDeclarationError(`The class '${classType.name}' contains itself. A tool input cannot be recursive.`, {
        classType: classType.name,
      });
    }

    const schema: JsonSchemaInterface = {
      type: "object",
      properties: {},
      additionalProperties: false,
    };
    const required: string[] = [];

    for (const propertyKey of ClassMetadata.getInformation(classType).properties ?? []) {
      schema.properties![propertyKey] = this.propertySchema(classType, propertyKey, [...ancestors, classType]);

      if (this.isRequired(classType.prototype, propertyKey)) {
        required.push(propertyKey);
      }
    }

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }

  private propertySchema(classType: ClassConstructor<any>, propertyKey: string, ancestors: Function[]): JsonSchemaInterface {
    const prototype = classType.prototype;
    const validators: ValidatorInterface[] = PropertyMetadata.getMetadata(prototype, propertyKey, MetadataKeynameEnum.Validator) ?? [];
    const designType = Reflect.getMetadata(PropertyInformationEnum.Type, prototype, propertyKey);
    const options: McpToolParameterOptionsInterface | undefined = PropertyMetadata.getMetadata(prototype, propertyKey, McpMetadataKeynameEnum.ToolParameter);

    const schema = this.typeSchema(validators, designType, ancestors);

    if (schema.type === "array" && schema.items === undefined) {
      const arrayMemberType = PropertyMetadata.getMetadata(prototype, propertyKey, PropertyInformationEnum.ArrayMemberType);

      if (arrayMemberType !== undefined) {
        schema.items = this.typeSchema([], arrayMemberType, ancestors);
      }
    }

    for (const validator of validators) {
      this.applyConstraint(schema, validator);
    }

    return this.applyOptions(schema, options);
  }

  /**
   * Resolves the base type. An explicit type validator wins over the TypeScript design type,
   * because the design type of `string | null` or of an interface is only `Object`.
   */
  private typeSchema(validators: ValidatorInterface[], designType: any, ancestors: Function[]): JsonSchemaInterface {
    for (const validator of validators) {
      if (validator instanceof IsIntValidator) {
        return {type: "integer"};
      }
      if (validator instanceof IsNumberValidator) {
        return {type: "number"};
      }
      if (validator instanceof IsStringValidator) {
        return {type: "string"};
      }
      if (validator instanceof IsBooleanValidator) {
        return {type: "boolean"};
      }
      if (validator instanceof IsArrayValidator) {
        return {type: "array"};
      }
      if (validator instanceof IsDateValidator) {
        return {type: "string", format: "date-time"};
      }
      if (validator instanceof IsEnumValidator) {
        return this.enumSchema(this.enumValues(validator.getConstraints().entity));
      }
      if (validator instanceof IsInValidator) {
        return this.enumSchema(validator.getConstraints().possibleValues);
      }
      if (validator instanceof EqualsValidator) {
        return {const: validator.getConstraints().expectedValue};
      }
    }

    switch (designType) {
      case undefined:
        return {};
      case String:
        return {type: "string"};
      case Number:
        return {type: "number"};
      case Boolean:
        return {type: "boolean"};
      case Array:
        return {type: "array"};
      case Date:
        return {type: "string", format: "date-time"};
      case Object:
        // Unions, `any` and interfaces all erase to `Object`: only an explicit validator knows more.
        return validators.some(validator => validator instanceof IsObjectValidator) ? {type: "object"} : {};
    }

    if (typeof designType === "function") {
      return this.objectSchema(designType, ancestors);
    }

    return {};
  }

  private enumValues(entity: Record<string, unknown>): unknown[] {
    // A numeric enum also maps each value back to its name (`E[0] === "A"`); skip those reverse keys.
    return Object.keys(entity)
      .filter(key => isNaN(Number(key)))
      .map(key => entity[key]);
  }

  private enumSchema(values: unknown[]): JsonSchemaInterface {
    const schema: JsonSchemaInterface = {enum: [...values]};

    if (values.length > 0 && values.every(value => typeof value === "string")) {
      schema.type = "string";
    } else if (values.length > 0 && values.every(value => Number.isInteger(value))) {
      schema.type = "integer";
    } else if (values.length > 0 && values.every(value => typeof value === "number")) {
      schema.type = "number";
    }

    return schema;
  }

  private applyConstraint(schema: JsonSchemaInterface, validator: ValidatorInterface): void {
    if (validator instanceof MinLengthValidator) {
      schema.minLength = validator.getConstraints().minLength;
    } else if (validator instanceof MaxLengthValidator) {
      schema.maxLength = validator.getConstraints().maxLength;
    } else if (validator instanceof LengthValidator) {
      schema.minLength = validator.getConstraints().minLength;
      schema.maxLength = validator.getConstraints().maxLength;
    } else if (validator instanceof IsNotEmptyValidator) {
      if (schema.type === "string") {
        schema.minLength = Math.max(schema.minLength ?? 0, 1);
      }
    } else if (validator instanceof MatchesValidator) {
      schema.pattern = validator.getConstraints().pattern.source;
    } else if (validator instanceof MinValidator) {
      schema.minimum = validator.getConstraints().minNumber;
    } else if (validator instanceof MaxValidator) {
      schema.maximum = validator.getConstraints().maxNumber;
    } else if (validator instanceof IsPositiveValidator) {
      schema.exclusiveMinimum = 0;
    } else if (validator instanceof IsNegativeValidator) {
      schema.exclusiveMaximum = 0;
    } else if (validator instanceof IsDivisibleByValidator) {
      schema.multipleOf = validator.getConstraints().numberToDivideBy;
    } else if (validator instanceof ArrayMinSizeValidator) {
      schema.minItems = validator.getConstraints().min;
    } else if (validator instanceof ArrayMaxSizeValidator) {
      schema.maxItems = validator.getConstraints().max;
    } else if (validator instanceof ArrayNotEmptyValidator) {
      schema.minItems = Math.max(schema.minItems ?? 0, 1);
    } else if (validator instanceof ArrayUniqueValidator) {
      schema.uniqueItems = true;
    } else if (validator instanceof IsNotEmptyObjectValidator) {
      schema.minProperties = 1;
    } else if (validator instanceof IsEmailValidator) {
      schema.format = "email";
    } else if (validator instanceof IsUrlValidator) {
      schema.format = "uri";
    } else if (validator instanceof IsUUIDValidator) {
      schema.format = "uuid";
    } else if (validator instanceof IsFQDNValidator) {
      schema.format = "hostname";
    } else if (validator instanceof IsRFC3339Validator || validator instanceof IsDateStringValidator) {
      schema.format = "date-time";
    }
  }

  private applyOptions(schema: JsonSchemaInterface, options: McpToolParameterOptionsInterface | undefined): JsonSchemaInterface {
    if (options === undefined) {
      return schema;
    }

    if (options.title !== undefined) {
      schema.title = options.title;
    }
    if (options.description !== undefined) {
      schema.description = options.description;
    }
    if (options.examples !== undefined) {
      schema.examples = options.examples;
    }
    if (options.default !== undefined) {
      schema.default = options.default;
    }

    return {...schema, ...options.schema};
  }

  private isRequired(prototype: any, propertyKey: string): boolean {
    const conditions: unknown[] = PropertyMetadata.getMetadata(prototype, propertyKey, MetadataKeynameEnum.Condition) ?? [];

    return conditions.some(condition => condition instanceof IsOptionalCondition || condition instanceof ValidateIfCondition) === false;
  }
}
