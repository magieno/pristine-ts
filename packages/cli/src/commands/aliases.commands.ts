import {DependencyContainer, injectable} from "tsyringe";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {HelpCommand} from "./help.command";
import {ListCommand} from "./list.command";
import {VerifyCommand} from "./verify.command";
import {InfoCommand} from "./info.command";
import {BuildCommand} from "./build.command";
import {StartCommand} from "./start.command";

/**
 * Top-level convenience aliases for the framework-reserved `p:*` commands. The `p:` namespace
 * is the canonical, never-clashing form (consumer commands cannot accidentally collide). These
 * aliases give users the more ergonomic `pristine help`, `pristine start`, etc. shape that
 * matches Angular / Nest CLIs.
 *
 * **Lazy delegate resolution.** Each alias resolves its delegate command from the kernel's
 * container at `run()` time rather than receiving it via constructor injection. This breaks
 * the otherwise-circular dependency: HelpCommand uses `@injectAll(Command)` to enumerate every
 * command for its help output, which would include `HelpAliasCommand`, which would constructor-
 * depend on `HelpCommand`, which would re-trigger `@injectAll(Command)`, and so on. By
 * resolving lazily we let HelpCommand finish constructing before any alias is asked to walk
 * back to it.
 */

const resolveDelegate = <T>(kernel: Kernel, ctor: new (...args: any[]) => T): T => {
  return kernel.container.resolve<T>(ctor);
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "help";
  description = "Alias for p:help.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, HelpCommand).run(args); }
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ListAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "list";
  description = "Alias for p:list.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, ListCommand).run(args); }
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class VerifyAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "verify";
  description = "Alias for p:verify.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, VerifyCommand).run(args); }
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class InfoAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "info";
  description = "Alias for p:info.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, InfoCommand).run(args); }
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class BuildAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "build";
  description = "Alias for p:build.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, BuildCommand).run(args); }
}

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class StartAliasCommand implements CommandInterface<null> {
  optionsType = null;
  name = "start";
  description = "Alias for p:start.";
  constructor(private readonly kernel: Kernel) {}
  async run(args: any): Promise<ExitCodeEnum | number> { return resolveDelegate(this.kernel, StartCommand).run(args); }
}
