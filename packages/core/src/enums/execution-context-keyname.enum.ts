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
}
