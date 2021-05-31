export interface ResolverInterface<T> {
    resolve(): Promise<T>;
}