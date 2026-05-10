import {DependencyContainer} from "tsyringe";
import {InstantiationTestResultInterface} from "./instantiation-test-result.interface";

/**
 * Embedders register implementations of this interface (decorated with
 * `@tag(ServiceDefinitionTagEnum.InstantiationTest)`) to contribute checks that run as part
 * of `Kernel.verifyInstantiation`. Implementations receive the verifier's container so they
 * can resolve services and assert on them. Tests should be cheap and side-effect-free.
 */
export interface InstantiationTestInterface {
  name: string;
  description?: string;
  run(container: DependencyContainer): Promise<InstantiationTestResultInterface>;
}
