import {InjectionToken, ValueProvider} from "tsyringe";

export interface ValueProviderRegistrationInterface<T> extends ValueProvider<T> {
    token: InjectionToken<T>;
}