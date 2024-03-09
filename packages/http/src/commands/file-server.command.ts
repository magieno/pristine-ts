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
export class FileServerCommand implements CommandInterface<FileServerCommandOptions>{
    constructor(
        private readonly consoleManager: ConsoleManager,
        private readonly fileHttpServer: FileHttpServer) {
    }

    optionsType: FileServerCommandOptions = new FileServerCommandOptions()
    name = "file-server:start";

    async run(args: FileServerCommandOptions): Promise<ExitCodeEnum | number> {
        await this.fileHttpServer.start(args.directory ?? "./", args.port, args.address, (port, address) => {
            this.consoleManager.writeLine(`File server started on ${address}:${port}`);
        });

        return ExitCodeEnum.Success;
    }
}