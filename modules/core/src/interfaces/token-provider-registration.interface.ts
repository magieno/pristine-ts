import {InjectionToken, RegistrationOptions, TokenProvider} from "tsyringe";

export interface TokenProviderRegistrationInterface<T> extends TokenProvider<T>{
    token: InjectionToken<T>;

    options?: RegistrationOptions;
}