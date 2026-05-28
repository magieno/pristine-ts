export enum ExecutionContextKeynameEnum {
  AwsLambda = "AWS_LAMBDA",
  Cloudflare = "CLOUDFLARE",
  Express = "EXPRESS",
  /**
   * Used by `KernelHttpServer` (the built-in Node `http.Server` wrapper used by `pristine start`)
   * to identify requests coming from the kernel-routed HTTP server, distinct from Express-fronted
   * requests that go through `@pristine-ts/express`.
   */
  Http = "HTTP",
  Jest = "JEST",
  Cli = "CLI",
  /**
   * GCP Cloud Functions (Gen 1 HTTP-trigger or Gen 2 with a CloudEvent envelope). Set by the
   * entry-point shim that calls `kernel.handle(rawEvent, { keyname: GcpCloudFunction, context })`.
   * `@pristine-ts/gcp-functions` HTTP event mappers gate on this value in `supportsMapping(...)`.
   */
  GcpCloudFunction = "GCP_CLOUD_FUNCTION",
  /**
   * GCP Cloud Run. Set by the entry-point shim when running inside a Cloud Run container
   * fronted by the framework's HTTP entry. `@pristine-ts/gcp-functions`'s
   * `CloudRunHttpEventMapper` gates on this value.
   */
  GcpCloudRun = "GCP_CLOUD_RUN",
}
