import {LogHandlerInterface} from "@pristine-ts/logging";

export class LogHandlerMock implements LogHandlerInterface {
    debug(message: string, extra?: any) {
    }

    info(message: string, extra?: any) {
    }

    error(message: string, extra?: any) {
    }

    critical(message: string, extra?: any) {
    }

    notice(message: string, extra?: any) {
    }

    warning(message: string, extra?: any) {
    }

    terminate() {

    }
}
