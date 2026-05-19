import {injectable} from "tsyringe";
import {CommandInterface} from "@pristine-ts/cli";
import {ExitCode, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class SampleCommand implements CommandInterface<any> {
    name: string = "sample";
    optionsType = null;

    run(args: { new(...args: any[]): void }): Promise<ExitCode | number> {
        console.log("should run");

        return Promise.resolve(ExitCode.Success);
    }

}