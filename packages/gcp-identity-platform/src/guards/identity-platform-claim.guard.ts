import {injectable} from "tsyringe";
import {IdentityInterface, Request, traced} from "@pristine-ts/common";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";

/**
 * A guard that checks the authenticated identity has every named custom claim set
 * to a truthy value. Use with the `@guard` decorator:
 *
 * ```ts
 * @guard(IdentityPlatformClaimGuard, "admin-routes", { claims: ["admin", "billing"] })
 * ```
 *
 * Mirror of `AwsCognitoGroupGuard` — that one checks `cognito:groups`; this one
 * checks arbitrary top-level claim keys set via `admin.auth().setCustomUserClaims(...)`.
 */
@injectable()
export class IdentityPlatformClaimGuard implements GuardInterface {
  public keyname = "gcp.identity-platform.claim";
  public guardContext?: GuardContextInterface;

  setContext(context: any): Promise<void> {
    this.guardContext = context;
    return Promise.resolve();
  }

  @traced()
  async isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
    if (this.guardContext === undefined) {
      return false;
    }

    const neededClaims: string[] = [];
    if (this.guardContext.options && Array.isArray(this.guardContext.options.claims)) {
      neededClaims.push(...this.guardContext.options.claims);
    }
    if (neededClaims.length === 0) {
      return true;
    }
    if (identity?.claims === undefined) {
      return false;
    }
    for (const claim of neededClaims) {
      if (!identity.claims[claim]) {
        return false;
      }
    }
    return true;
  }
}
