import {InjectionToken} from "tsyringe";

export interface DynamicConfigurationResolverInterface<T> {
    injectionToken?: InjectionToken;

    dynamicResolve: (injectedInstance?: T) => Promise<string | number | boolean>;
}