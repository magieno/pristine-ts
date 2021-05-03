export interface ContextAwareInterface {
    setContext(context: any): Promise<void>;
}