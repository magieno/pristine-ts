import "reflect-metadata";
import {IsString} from "@pristine-ts/class-validator";

export class FileServerCommandOptions {
  @IsString()
  directory: string = "./";

  port?: number;

  address?: string;

  header?: string | string[];
}