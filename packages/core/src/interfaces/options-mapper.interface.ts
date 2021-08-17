export interface OptionsMapperInterface<Options, Model> {
    reverseMap(options: Options, onObject?: Model): Promise<Model>;
}
