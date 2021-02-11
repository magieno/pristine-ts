export const controllerRegistry: any[] = [];

export const controller = (basePath: string) => {
    return (constructor: Function) => {
        if(constructor.prototype.hasOwnProperty("__metadata__") === false) {
            constructor.prototype["__metadata__"] = {}
        }


        if(constructor.prototype["__metadata__"].hasOwnProperty("controller") === false) {
            constructor.prototype["__metadata__"]["controller"] = {}
        }

        constructor.prototype["__metadata__"]["controller"]["basePath"] = basePath;

        controllerRegistry.push(constructor.prototype)
    }
}