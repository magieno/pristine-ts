import "reflect-metadata"
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {HttpModuleKeyname} from "../http.module.keyname";
import {inject, injectable} from "tsyringe";
import {CommandInterface} from "@pristine-ts/cli";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {FileHttpServer} from "../servers/file.http-server";
import {FileServerCommandOptions} from "./file-server.command-options";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class FileServerCommand implements CommandInterface<FileServerCommandOptions> {
  optionsType = FileServerCommandOptions;
  name = "file-server:start";

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly fileHttpServer: FileHttpServer) {
  }

  async run(args: FileServerCommandOptions): Promise<ExitCode | number> {
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
        this.logHandler.success("Pristine HTTP File server listening", {highlights: {address, port}});
      }, (req) => {
        this.logHandler.info("Request received", {highlights: {url: req.url}});
      },
      defaultHeaders);

    return ExitCode.Success;
  }
}