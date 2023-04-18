import {injectable} from "tsyringe";
import {CommandInterface, ExitCodeEnum} from "@pristine-ts/cli";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class SampleCommand implements CommandInterface<any> {
    name: string = "sample";
    optionsType: any;

    run(args: { new(...args: any[]): void }): Promise<ExitCodeEnum | number> {
        console.log("should run");

        return Promise.resolve(ExitCodeEnum.Success);
    }

}