/**
 * This interface defines what a resolver needs.
 */
export interface ResolverInterface<T> {
  resolve(): Promise<T>;
}
