import {ClientV3} from "@camaro/redis";

/**
 * This interface represents the Redis client and can be used to inject it. It facilitates mocking and testing.
 */
export interface RedisClientInterface {
  /**
   * Returns the client from ClientV3 library
   */
  getClient(): ClientV3;

  /**
   * Sets a key-value entry in Redis
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key.
   * @param key The key for the entry
   * @param value The value of the entry
   * @param ttl The time to live in seconds
   */
  set(table: string, key: string, value: string, ttl?: number): Promise<void>

  /**
   * Sets a key-list entry in Redis
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key.
   * @param key The key for the entry
   * @param value The array of values of the entry
   * @param ttl The time to live in seconds
   */
  setList(table: string, key: string, value: string[], ttl?: number): Promise<void>

  /**
   * Gets the value of a key in Redis.
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
   * @param key The key for the entry
   */
  get(table: string, key: string): Promise<string | null>

  /**
   * Gets the list of a key in Redis
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
   * @param key The key for the entry
   * @param start The index in the list to start.
   * @param stop The index in the list to start. -1 means until the end of the list.
   */
  getList(table: string, key: string, start?: number, stop?: number): Promise<string[]>

  /**
   * Removes an entry in Redis
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
   * @param key The key for the entry
   */
  remove(table: string, key: string): Promise<void>

  /**
   * Clears everything in Redis.
   */
  clearAll(): Promise<void>

  /**
   * Gets the final Redis key such as: namespace:table:key
   * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
   * @param key The key for the entry
   */
  getKey(table: string, key: string): string
}
