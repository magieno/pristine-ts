import {AppModuleDiscoveryReasonEnum} from "./app-module-discovery-reason.enum";

/**
 * A plausible AppModule found by the convention-based scan. Lower `score` beats higher;
 * ties are ambiguous and trigger the disambiguation prompt.
 */
export class AppModuleDiscoveryCandidate {
  constructor(
    public readonly absolutePath: string,
    /** Path relative to the project root. Used purely for human-facing display. */
    public readonly displayPath: string,
    /** Lower = better. Files literally named `app.module.*` get 0; AppModule-exporting `*.module.*` files get 10. */
    public readonly score: number,
    public readonly reason: AppModuleDiscoveryReasonEnum,
  ) {
  }
}
