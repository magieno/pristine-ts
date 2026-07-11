import "reflect-metadata";
import {authenticator, AuthenticatorInterface} from "@pristine-ts/security";
import {Auth0Authenticator} from "@pristine-ts/auth0";
import {IdentityInterface, Request} from "@pristine-ts/common";

/**
 * Compile-time regression guard for the typed `@authenticator(Auth0Authenticator, …)`
 * options. ts-jest fails a suite on an unused `@ts-expect-error` (TS2578), so this file
 * stops compiling if the options inference ever regresses — either a valid shape starts
 * erroring, or a bad shape stops erroring.
 *
 * `authenticator(...)` builds the decorator function but is never applied here, so nothing
 * runs at runtime; the value is intentionally the compile check itself.
 */

// Valid shapes — must compile:
authenticator(Auth0Authenticator, {expectedAudience: "https://api.example.com"});
authenticator(Auth0Authenticator, {expectedAudience: ["https://a", "https://b"], expectedScopes: ["read:messages"]});
authenticator(Auth0Authenticator, {expectedScopes: "read:messages"});
authenticator(Auth0Authenticator); // options are optional

// @ts-expect-error - 'expectedScope' is a typo for 'expectedScopes'
authenticator(Auth0Authenticator, {expectedScope: ["read:messages"]});

// @ts-expect-error - expectedAudience must be string | string[]
authenticator(Auth0Authenticator, {expectedAudience: 123});

// An authenticator WITHOUT the `__options` marker keeps accepting arbitrary options
// (backward compatible — unchanged from before this feature):
class UnmarkedAuthenticator implements AuthenticatorInterface {
  setContext(context: any): Promise<void> {
    return Promise.resolve();
  }

  authenticate(request: Request): Promise<IdentityInterface | undefined> {
    return Promise.resolve(undefined);
  }
}
authenticator(UnmarkedAuthenticator, {anything: true, goes: 42});

describe("Auth0Authenticator @authenticator options are type-checked", () => {
  it("is enforced at compile time (see the @ts-expect-error assertions above)", () => {
    expect(typeof authenticator).toBe("function");
  });
});
