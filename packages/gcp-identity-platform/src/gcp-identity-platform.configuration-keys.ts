export const GcpIdentityPlatformConfigurationKeys = {
  ProjectId: "pristine.gcp-identity-platform.projectId",
} as const;

export interface GcpIdentityPlatformConfigurationValueMap {
  "pristine.gcp-identity-platform.projectId": string;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends GcpIdentityPlatformConfigurationValueMap {}
}
