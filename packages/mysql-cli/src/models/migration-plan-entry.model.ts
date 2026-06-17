import {MigrationStateEnum} from "../enums/migration-state.enum";

/**
 * One row of a `MigrationPlan`: the union view of a single migration as it appears
 * to both the DI registry and the bookkeeping table. State combines the two views.
 */
export class MigrationPlanEntry {
  public name!: string;
  public state!: MigrationStateEnum;

  /** sha256 of the SQL returned by the registered migration's `up()` — undefined when Orphaned. */
  public diskChecksum?: string;

  /** sha256 stored at the time of apply — undefined when Pending. */
  public appliedChecksum?: string;

  /** When the migration was applied — undefined when Pending. */
  public appliedAt?: Date;
}
