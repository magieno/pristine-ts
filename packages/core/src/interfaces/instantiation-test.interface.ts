import {DependencyContainer} from "tsyringe";

/**
 * Result returned by an instantiation test. Tests report failure by returning `passed: false` rather than
 * throwing — uncaught throws are still captured and recorded as failed by the verifier, but a structured
 * return lets the test attach a message and arbitrary diagnostic details.
 */
export interface InstantiationTestResultInterface {
  passed: boolean;
  message?: string;
  details?: any;
}

/**
 * Embedders register implementations of this interface (decorated with `@tag(ServiceDefinitionTagEnum.InstantiationTest)`)
 * to contribute checks that run as part of `Kernel.verifyInstantiation`. Implementations receive the verifier's
 * container so they can resolve services and assert on them. Tests should be cheap and side-effect-free.
 */
export interface InstantiationTestInterface {
  name: string;
  description?: string;
  run(container: DependencyContainer): Promise<InstantiationTestResultInterface>;
}
