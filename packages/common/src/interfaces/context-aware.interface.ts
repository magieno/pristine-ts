export interface ContextAwareInterface {
  /**
   * This methods sets the context. You will receive only the context that is relevant to you.
   */
  setContext(context: any): Promise<void>;
}
