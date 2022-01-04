import {ClassProvider,
    DependencyContainer,
    FactoryProvider,
    InjectionToken,
    RegistrationOptions,
    TokenProvider,
    ValueProvider
} from "tsyringe";
import {constructor} from "tsyringe/dist/typings/types";
import {
    PreResolutionInterceptorCallback,
    PostResolutionInterceptorCallback
} from "tsyringe/dist/typings/types/dependency-container";
import InterceptorOptions from "tsyringe/dist/typings/types/interceptor-options";

export class DependencyContainerMock implements DependencyContainer {
    register<T>(token: InjectionToken<T>, provider: ValueProvider<T>): DependencyContainer;
    register<T>(token: InjectionToken<T>, provider: FactoryProvider<T>): DependencyContainer;
    register<T>(token: InjectionToken<T>, provider: TokenProvider<T>, options?: RegistrationOptions): DependencyContainer;
    register<T>(token: InjectionToken<T>, provider: ClassProvider<T>, options?: RegistrationOptions): DependencyContainer;
    register<T>(token: InjectionToken<T>, provider: constructor<T>, options?: RegistrationOptions): DependencyContainer;
    register(token: any, provider: any, options?: any) {
        return this;
    }
    registerSingleton<T>(from: InjectionToken<T>, to: InjectionToken<T>): DependencyContainer;
    registerSingleton<T>(token: constructor<T>): DependencyContainer;
    registerSingleton(from: any, to?: any) {
        return this;
    }

    registerType<T>(from: InjectionToken<T>, to: InjectionToken<T>): DependencyContainer {
        return this;
    }
    registerInstance<T>(token: InjectionToken<T>, instance: T): DependencyContainer {
        return this;
    }

    resolve<T>(token: InjectionToken<T>): T {
        // @ts-ignore
        return {};
    }
    resolveAll<T>(token: InjectionToken<T>): T[] {
        return [];
    }
    isRegistered<T>(token: InjectionToken<T>, recursive?: boolean): boolean {
        return true;
    }
    reset(): void {

    }
    clearInstances(): void {

    }
    createChildContainer(): DependencyContainer {
        return this;
    }
    beforeResolution<T>(token: InjectionToken<T>, callback: PreResolutionInterceptorCallback<T>, options?: InterceptorOptions): void {

    }
    afterResolution<T>(token: InjectionToken<T>, callback: PostResolutionInterceptorCallback<T>, options?: InterceptorOptions): void {

    }

}
