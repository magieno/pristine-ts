import {inject, injectable} from "tsyringe";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Firestore} from "@google-cloud/firestore";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {GcpConfigurationKeys} from "../gcp.configuration-keys";
import {FirestoreClientInterface} from "../interfaces/firestore-client.interface";

/**
 * Client for Google Cloud Firestore (Native mode). Provides typed CRUD against a
 * model class plus a `findBySecondaryIndex` for indexed field-equality lookups.
 *
 * Document↔object mapping uses the class name (lowercased) as the collection key;
 * fields are persisted verbatim via property copy. A typed decorator-based mapper
 * (`@firestoreCollection` / `@firestoreField`) is a future extension.
 */
@tag("FirestoreClientInterface")
@moduleScoped(GcpModuleKeyname)
@injectable()
export class FirestoreClient implements FirestoreClientInterface {
  private client?: Firestore;

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpConfigurationKeys.ProjectId) private readonly projectId: string,
  ) {
  }

  getClient(): Firestore {
    return this.client = this.client ?? new Firestore({projectId: this.projectId});
  }

  /**
   * Resolves the Firestore collection name for a model class — the class name
   * lowercased.
   */
  private getCollectionName<T>(classType: { new(): T }): string {
    return classType.name.toLowerCase();
  }

  @traced()
  async get<T>(classType: { new(): T }, id: string): Promise<T | undefined> {
    const collection = this.getCollectionName(classType);
    this.logHandler.debug("FirestoreClient: Getting document.", {extra: {collection, id}});
    try {
      const snapshot = await this.getClient().collection(collection).doc(id).get();
      if (snapshot.exists === false) {
        return undefined;
      }
      const instance = new classType();
      Object.assign(instance as any, snapshot.data());
      return instance;
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error getting document.", {extra: {error: e, collection, id}});
      throw e;
    }
  }

  @traced()
  async list<T>(classType: { new(): T }, options?: { limit?: number; startAfter?: any }): Promise<T[]> {
    const collection = this.getCollectionName(classType);
    this.logHandler.debug("FirestoreClient: Listing documents.", {extra: {collection, options}});
    try {
      let query = this.getClient().collection(collection).limit(options?.limit ?? 100);
      if (options?.startAfter !== undefined) {
        query = query.startAfter(options.startAfter);
      }
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => {
        const instance = new classType();
        Object.assign(instance as any, doc.data());
        return instance;
      });
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error listing documents.", {extra: {error: e, collection}});
      throw e;
    }
  }

  @traced()
  async create<T>(item: T): Promise<T> {
    const collection = this.getCollectionName((item as any).constructor);
    const id = (item as any).id;
    this.logHandler.debug("FirestoreClient: Creating document.", {extra: {collection, id}});
    try {
      const docRef = id ? this.getClient().collection(collection).doc(id) : this.getClient().collection(collection).doc();
      await docRef.create({...(item as any)});
      (item as any).id = docRef.id;
      return item;
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error creating document.", {extra: {error: e, collection, id}});
      throw e;
    }
  }

  @traced()
  async update<T>(item: T): Promise<T> {
    const collection = this.getCollectionName((item as any).constructor);
    const id = (item as any).id;
    this.logHandler.debug("FirestoreClient: Updating document.", {extra: {collection, id}});
    try {
      await this.getClient().collection(collection).doc(id).update({...(item as any)});
      return item;
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error updating document.", {extra: {error: e, collection, id}});
      throw e;
    }
  }

  @traced()
  async save<T>(item: T): Promise<T> {
    const collection = this.getCollectionName((item as any).constructor);
    const id = (item as any).id;
    this.logHandler.debug("FirestoreClient: Saving (upsert) document.", {extra: {collection, id}});
    try {
      const docRef = id ? this.getClient().collection(collection).doc(id) : this.getClient().collection(collection).doc();
      await docRef.set({...(item as any)}, {merge: true});
      (item as any).id = docRef.id;
      return item;
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error saving document.", {extra: {error: e, collection, id}});
      throw e;
    }
  }

  @traced()
  async delete<T>(classType: { new(): T }, id: string): Promise<void> {
    const collection = this.getCollectionName(classType);
    this.logHandler.debug("FirestoreClient: Deleting document.", {extra: {collection, id}});
    try {
      await this.getClient().collection(collection).doc(id).delete();
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error deleting document.", {extra: {error: e, collection, id}});
      throw e;
    }
  }

  /**
   * Find documents by a field-equality predicate. Firestore requires a composite index
   * for compound queries; for the single-field case this returns immediately.
   */
  @traced()
  async findBySecondaryIndex<T>(classType: { new(): T }, field: string, value: any, options?: { limit?: number }): Promise<T[]> {
    const collection = this.getCollectionName(classType);
    this.logHandler.debug("FirestoreClient: Find by index.", {extra: {collection, field, value, options}});
    try {
      const snapshot = await this.getClient()
        .collection(collection)
        .where(field, "==", value)
        .limit(options?.limit ?? 100)
        .get();
      return snapshot.docs.map((doc) => {
        const instance = new classType();
        Object.assign(instance as any, doc.data());
        return instance;
      });
    } catch (e) {
      this.logHandler.error("FirestoreClient: Error in findBySecondaryIndex.", {extra: {error: e, collection, field}});
      throw e;
    }
  }
}
