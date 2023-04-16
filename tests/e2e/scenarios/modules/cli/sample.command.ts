import {injectable} from "tsyringe";
import {CommandInterface} from "@pristine-ts/cli";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class SampleCommand implements CommandInterface {

}