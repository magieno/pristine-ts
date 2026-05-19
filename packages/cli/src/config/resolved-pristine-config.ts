import {ConfigProvenanceEnum} from "./config-provenance.enum";
import {PristineConfig} from "./pristine-config.interface";

/**
 * A loaded `PristineConfig` augmented with discovery metadata. `ConfigLoader` returns this
 * shape; the raw `PristineConfig` is what users author.
 */
export class ResolvedPristineConfig {
  constructor(
    public readonly config: PristineConfig,
    /** Absolute path to the config file that was loaded, if any. */
    public readonly configFilePath: string | undefined,
    /**
     * Per-top-level-field provenance markers, mainly for `pristine p:config:print`. Keys are
     * top-level fields of `PristineConfig` (`cli`, `config`); values are the
     * `ConfigProvenanceEnum` describing where each came from.
     */
    public readonly provenance: Record<string, ConfigProvenanceEnum>,
  ) {
  }
}
