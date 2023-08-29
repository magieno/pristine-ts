import {ExitCodeEnum} from "../enums/exit-code.enum";

export interface CommandInterface<ArgumentsOptionsType> {
    name: string;

    optionsType: ArgumentsOptionsType;

    run(args: {new(...args : any[]): ArgumentsOptionsType ;}): Promise<ExitCodeEnum | number>;
}