import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {RuntimeServerInterface} from "../interfaces/runtime-server.interface";
import {CoreModuleKeyname} from "../core.module.keyname";

/**
 * No-op default registration for `ServiceDefinitionTagEnum.RuntimeServer`. Without this,
 * tsyringe's `@injectAll(RuntimeServer)` would throw "Attempted to resolve unregistered
 * dependency token" in apps that don't import any module providing a real RuntimeServer
 * (e.g. an AppModule that doesn't include `@pristine-ts/http`). Registering one default
 * lets `pristine start` cleanly handle the "no servers" case as an empty-loop scenario
 * (after filtering this out) rather than an exception.
 *
 * Same pattern as `DefaultEventMapper` and `DefaultEventListener` use for their respective
 * tags.
 */
@moduleScoped(CoreModuleKeyname)
@tag(ServiceDefinitionTagEnum.RuntimeServer)
@injectable()
export class DefaultRuntimeServer implements RuntimeServerInterface {
  /**
   * Sentinel name. Consumers that iterate the resolved server list should filter on this
   * value (or simply skip servers whose `start()` is a no-op) when they want to ignore
   * the default placeholder.
   */
  public readonly name: string = "__default__";

  async start(): Promise<void> {
    // No-op.
  }

  async stop(): Promise<void> {
    // No-op.
  }
}
