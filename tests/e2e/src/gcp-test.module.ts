import {AppModuleInterface} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";
import {GcpModule} from "@pristine-ts/gcp";
import {GcpFunctionsModule} from "@pristine-ts/gcp-functions";
import {GcpIdentityPlatformModule} from "@pristine-ts/gcp-identity-platform";
import {GcpSchedulingModule} from "@pristine-ts/gcp-scheduling";
import {GcpTraceModule} from "@pristine-ts/gcp-trace";

/**
 * Shared root module that pulls in all five GCP packages plus the framework core.
 * Used by the kernel-resolution smoke test in `kernel.e2e.ts` to verify the GCP
 * package set boots cleanly alongside the AWS packages.
 *
 * Per-domain `*.e2e.ts` tests do NOT use this — they exercise mappers/handlers in
 * isolation. This module is purely for the "do they all wire together" check.
 */
export const gcpTestModule: AppModuleInterface = {
  keyname: "gcp-test",
  importModules: [
    CoreModule,
    GcpModule,
    GcpFunctionsModule,
    GcpIdentityPlatformModule,
    GcpSchedulingModule,
    GcpTraceModule,
  ],
  importServices: [],
  providerRegistrations: [],
};
