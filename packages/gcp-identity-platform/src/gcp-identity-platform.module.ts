import {ModuleInterface} from "@pristine-ts/common";
import {HttpModule} from "@pristine-ts/http";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {GcpIdentityPlatformModuleKeyname} from "./gcp-identity-platform.module.keyname";

export * from "./authenticators/authenticators";
export * from "./guards/guards";
export * from "./interfaces/interfaces";

export * from "./gcp-identity-platform.module.keyname";
export * from "./gcp-identity-platform.configuration-keys";

export const GcpIdentityPlatformModule: ModuleInterface = {
  keyname: GcpIdentityPlatformModuleKeyname,
  configurationDefinitions: [
    /**
     * The Firebase / Identity Platform project id. Verified against the JWT `aud`
     * claim. The issuer is derived as `https://securetoken.google.com/{projectId}`.
     */
    {
      parameterName: GcpIdentityPlatformModuleKeyname + ".projectId",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_GCP_IDENTITY_PLATFORM_PROJECT_ID"),
        new EnvironmentVariableResolver("GOOGLE_CLOUD_PROJECT"),
      ],
    },
  ],
  importModules: [
    HttpModule,
  ],
};
