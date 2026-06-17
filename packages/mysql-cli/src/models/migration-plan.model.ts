import {MigrationStateEnum} from "../enums/migration-state.enum";
import {MigrationPlanEntry} from "./migration-plan-entry.model";

/**
 * Output of `MysqlMigrationManager.status` (and `verify` when no drift exists). The
 * `entries` array is sorted lexicographically by `name`, matching apply order.
 */
export class MigrationPlan {
  public configUniqueKeyname!: string;
  public tableName!: string;
  public entries: MigrationPlanEntry[] = [];

  public hasPending(): boolean {
    return this.entries.some((entry) => entry.state === MigrationStateEnum.Pending);
  }

  public hasDrift(): boolean {
    return this.entries.some(
      (entry) => entry.state === MigrationStateEnum.Modified || entry.state === MigrationStateEnum.Orphaned,
    );
  }

  public countByState(state: MigrationStateEnum): number {
    return this.entries.filter((entry) => entry.state === state).length;
  }
}
