import "reflect-metadata"
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {HttpModuleKeyname} from "../http.module.keyname";
import {injectable} from "tsyringe";
import {CommandInterface, ConsoleManager, ExitCodeEnum} from "@pristine-ts/cli";
import {FileHttpServer} from "../servers/file.http-server";
import {FileServerCommandOptions} from "./file-server.command-options";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class FileServerCommand implements CommandInterface<FileServerCommandOptions> {
  optionsType: FileServerCommandOptions = new FileServerCommandOptions()
  name = "file-server:start";

  constructor(
    private readonly consoleManager: ConsoleManager,
    private readonly fileHttpServer: FileHttpServer) {
  }

  async run(args: FileServerCommandOptions): Promise<ExitCodeEnum | number> {
    const defaultHeaders: { [key in string]: string } = {};

    if (Array.isArray(args.header)) {
      for (const header of args.header) {
        const [key, value] = header.split(":");
        defaultHeaders[key] = value;
      }
    } else if (args.header) {
      const [key, value] = args.header.split(":");
      defaultHeaders[key] = value;
    }

    await this.fileHttpServer.start(args.directory ?? "./", args.port, args.address, (port, address) => {
        this.consoleManager.writeLine(`Pristine HTTP File server listening on: '${address}:${port}'`);
      }, (req) => {
        this.consoleManager.writeLine(`Request received: ${req.url}`);
      },
      defaultHeaders);

    return ExitCodeEnum.Success;
  }
}