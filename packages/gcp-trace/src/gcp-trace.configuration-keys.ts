export const GcpTraceConfigurationKeys = {
  Debug: "pristine.gcp-trace.debug",
  Activated: "pristine.gcp-trace.activated",
  ProjectId: "pristine.gcp-trace.projectId",
} as const;

export interface GcpTraceConfigurationValueMap {
  "pristine.gcp-trace.debug": boolean;
  "pristine.gcp-trace.activated": boolean;
  "pristine.gcp-trace.projectId": string;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends GcpTraceConfigurationValueMap {}
}
