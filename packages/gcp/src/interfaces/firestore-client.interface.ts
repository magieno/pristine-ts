import {Firestore} from "@google-cloud/firestore";

/**
 * Tag-injection contract for `FirestoreClient`. Inject by string token `"FirestoreClientInterface"`.
 */
export interface FirestoreClientInterface {
  getClient(): Firestore;

  get<T>(classType: { new(): T }, id: string): Promise<T | undefined>;

  list<T>(classType: { new(): T }, options?: { limit?: number; startAfter?: any }): Promise<T[]>;

  create<T>(item: T): Promise<T>;

  update<T>(item: T): Promise<T>;

  save<T>(item: T): Promise<T>;

  delete<T>(classType: { new(): T }, id: string): Promise<void>;

  findBySecondaryIndex<T>(classType: { new(): T }, field: string, value: any, options?: { limit?: number }): Promise<T[]>;
}
