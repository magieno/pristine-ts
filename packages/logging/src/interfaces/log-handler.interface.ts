import {SeverityEnum} from "../enums/severity.enum";

export interface LogHandlerInterface {
    error(message: string, extra?: any): void;

    critical(message: string, extra?: any): void;

    debug(message: string, extra?: any): void;

    info(message: string, extra?: any): void;

    warning(message: string, extra?: any): void;

    log(message: string, severity: SeverityEnum, extra?: any): void;
}