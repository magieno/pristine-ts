
export interface LogHandlerInterface {
    error(message: string, extra?: any, module?: string): void;

    critical(message: string, extra?: any, module?: string): void;

    debug(message: string, extra?: any, module?: string): void;

    info(message: string, extra?: any, module?: string): void;

    warning(message: string, extra?: any, module?: string): void;
}
