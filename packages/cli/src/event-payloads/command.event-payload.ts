export class CommandEventPayload {
    arguments: {[key in string]: string | number | boolean} = {};

    constructor(public name: string, public scriptPath: string) {
    }
}