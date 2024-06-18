export abstract class BaseNormalizer<Options> {
    constructor(protected readonly defaultOptions?:Partial<Options>) {
    }

    getOptions(options?: Options): Options {
        // Merge the options into the default options (Not doing a deep merge)
        return Object.assign({}, this.defaultOptions, options);
    }
}