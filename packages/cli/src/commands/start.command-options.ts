import "reflect-metadata";
import {IsNumber, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Runtime overrides for `pristine start`. These are applied to every `RuntimeServerInterface`
 * the kernel resolves — implementations are free to ignore them. The flags exist mainly for
 * one-off cases ("I just need to test on a different port right now"); the canonical place
 * to set defaults is the matching module's configurationDefinitions or `pristine.config.ts`.
 */
export class StartCommandOptions {
  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsString()
  address?: string;
}
