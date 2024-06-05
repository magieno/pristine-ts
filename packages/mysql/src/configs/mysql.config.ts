import {injectable} from "tsyringe";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";

@tag(ServiceDefinitionTagEnum.MysqlConfig)
@injectable()
export class MysqlConfig {
    constructor(
                public readonly uniqueKeyname: string,
                public readonly host: string,
                public readonly port: number,
                public readonly user: string,
                public readonly password: string,
                public readonly connectionLimit: number,
                public readonly debug: boolean,
                public readonly database: string,
                ) {
    }
}