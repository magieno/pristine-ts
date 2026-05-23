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
   * Identifies command dispatches originating from the interactive REPL (`ReplStartEventHandler`),
   * as opposed to one-shot `pristine <cmd>` invocations (which use `Cli`). The argv shape and
   * parser are identical to `Cli`, so `CommandEventMapper` matches both — the keyname exists so
   * observability, interceptors, and (future) REPL-only mappers can tell the two dispatch modes
   * apart.
   */
  Repl = "REPL",
}
