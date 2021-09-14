export interface OptionsMapperInterface<Options, Model> {
    map(options: Options, onObject?: Model): Promise<Model>;

    reverseMap(model?: Model, onOptions?: Options): Promise<Options>;
}
