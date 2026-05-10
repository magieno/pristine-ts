export class MissingRequiredConfigurationEntry {
  constructor(
    public readonly parameterName: string,
    public readonly hasDefaultResolvers: boolean,
  ) {
  }
}
