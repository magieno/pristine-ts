import "reflect-metadata";
import {IsBoolean, IsIn, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Non-interactive flags for `pristine init`. In a TTY, the init command prompts the user for
 * each missing value; in CI / non-TTY, every value must be supplied via these flags or the
 * command exits with a clear "missing flag" error.
 */
export class InitCommandOptions {
  @IsOptional()
  @IsString()
  "source-path"?: string;

  @IsOptional()
  @IsString()
  "output-path"?: string;

  @IsOptional()
  @IsString()
  tsconfig?: string;

  @IsOptional()
  @IsIn(["esm", "cjs", "both"])
  format?: "esm" | "cjs" | "both";

  /**
   * When true, scaffold a starter `<sourcePath>` AppModule file if it doesn't exist.
   * Default true. Pass `--no-scaffold` to skip.
   */
  @IsOptional()
  @IsBoolean()
  scaffold?: boolean;

  /**
   * When true, add `pristine build`/`start`/`verify` scripts to package.json (only for
   * scripts that don't already exist — never overwritten). Default true.
   */
  @IsOptional()
  @IsBoolean()
  scripts?: boolean;
}
