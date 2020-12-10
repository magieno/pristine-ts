import {FactoryProvider, InjectionToken} from "tsyringe";

export interface FactoryProviderRegistrationInterface<T> extends FactoryProvider<T> {
    token: InjectionToken<T>;
}