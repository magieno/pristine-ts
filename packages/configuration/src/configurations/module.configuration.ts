export class ModuleConfiguration<T>{
    constructor(public moduleKeyname: string, public readonly configuration: T) {
    }
}