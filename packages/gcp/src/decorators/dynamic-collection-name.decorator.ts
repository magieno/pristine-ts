import {DynamicCollectionNameModel} from "../models/dynamic-collection-name.model";

/**
 * Symbol used to stamp the resolved Firestore collection name onto a class prototype.
 * Mirrors `DynamoDbTable` from `@awslabs-community-fork/dynamodb-data-mapper`.
 */
export const FirestoreCollection: unique symbol = Symbol("FirestoreCollection");

/**
 * The registry where the Firestore collection names are saved.
 */
export const dynamicCollectionNameRegistry: DynamicCollectionNameModel[] = [];

/**
 * This decorator is placed on a class that will be used with Firestore.
 * It registers the class against a configuration token name; during `GcpModule.afterInit`,
 * the token is resolved from the DI container (or from an environment variable as a
 * fallback) and the resulting collection name is stamped onto the class prototype under
 * the `FirestoreCollection` symbol.
 *
 * Mirrors `@dynamicTableName` in `@pristine-ts/aws`.
 *
 * @param name The container token whose value is the Firestore collection name.
 */
export const dynamicCollectionName = (name: string) => {
  return (constructor: any) => {
    dynamicCollectionNameRegistry.push({
      tokenName: name,
      classConstructor: constructor,
    });
  };
};
