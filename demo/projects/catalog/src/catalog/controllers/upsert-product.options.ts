import "reflect-metadata";
import {IsNumber, IsString} from "@pristine-ts/class-validator";

/**
 * Shape of the JSON body accepted by `PUT /products/{id}`. The decorators are
 * `class-validator` rules — the framework runs them automatically before the controller
 * method is invoked, returning a 400-style validation error if any fail.
 */
export class UpsertProductOptions {
  @IsString()
  name!: string;

  @IsNumber()
  priceCents!: number;
}
