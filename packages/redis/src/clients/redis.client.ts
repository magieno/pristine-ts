import {injectable, inject} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {RedisError} from "../errors/redis.error";
import {tag} from "@pristine-ts/common";
import {RedisClientInterface} from "../interfaces/redis-client.interface";
import {ClientV3} from "@camaro/redis";
import {RedisModuleKeyname} from "../redis.module.keyname";

/**
 * The client to use to interact with Redis. It is a wrapper around the ClientV3 of library @camaro/redis.
 * It is tagged so it can be injected using RedisClientInterface.
 */
@tag("RedisClientInterface")
@injectable()
export class RedisClient implements RedisClientInterface {

    /**
     * The client from the library @camaro/redis.
     * @private
     */
    private client?: ClientV3;

    /**
     * The client to use to interact with Redis.
     * @param host The host on which Redis is hosted.
     * @param port The port at which Redis is hosted.
     * @param namespace The namespace to use when saving a key in Redis. Our keys are creating using this pattern namespace:table:key.
     * @param logHandler The log handler to use to output logs.
     */
    public constructor(@inject("%pristine.redis.host%") private readonly host: string,
                       @inject("%pristine.redis.port%") private readonly port: number,
                       @inject("%pristine.redis.namespace%") private readonly namespace: string,
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * Returns the client from ClientV3 library
     */
    getClient(): ClientV3 {
        if (this.client === undefined) {
            this.client = new ClientV3({
                host: this.host,
                port: this.port,
            });
        }

        return this.client;
    }

    /**
     * Sets a key-value entry in Redis
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key.
     * @param key The key for the entry
     * @param value The value of the entry
     * @param ttl The time to live in seconds
     */
    async set(table: string, key: string, value: string, ttl?: number): Promise<void> {
        const client = this.getClient();
        const redisKey = this.getKey(table, key);

        try {
            let response;
            if (ttl) {
                // EX means ttl is in second https://redis.io/commands/set
                response = await client.SET(redisKey, value, 'EX', ttl + "");
            } else {
                response = client.SET(redisKey, value);
            }

            this.logHandler.debug("RedisClient: 'set' command successful.", {extra: {response, table, key, value, ttl}})
        } catch (error) {
            throw new RedisError("Error setting in redis", error as Error, table, key, redisKey);
        }
    }

    /**
     * Sets a key-list entry in Redis
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key.
     * @param key The key for the entry
     * @param value The array of values of the entry
     * @param ttl The time to live in seconds
     */
    async setList(table: string, key: string, value: string[], ttl?: number): Promise<void> {
        const client = this.getClient();
        const redisKey = this.getKey(table, key);
        try {
            const response = await client.RPUSH(redisKey, ...value);

            this.logHandler.debug("RedisClient: 'setList' command successful.", {extra: {response, table, key, value, ttl}})
        } catch (error) {
            throw new RedisError("Error setting in redis", error as Error, table, key, redisKey);
        }
    }

    /**
     * Gets the value of a key in Redis.
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
     * @param key The key for the entry
     */
    async get(table: string, key: string): Promise<string | null> {
        const client = this.getClient();
        const redisKey = this.getKey(table, key);

        try {
            const response = await client.GET(redisKey);

            this.logHandler.debug("RedisClient: 'get' command successful.", {extra: {response, table, key}})

            return response;
        } catch (error) {
            throw new RedisError("Error getting in redis", error as Error, table, key, redisKey);
        }
    }

    /**
     * Gets the list of a key in Redis
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
     * @param key The key for the entry
     * @param start The index in the list to start.
     * @param stop The index in the list to start. -1 means until the end of the list.
     */
    async getList(table: string, key: string, start: number = 0, stop: number = -1): Promise<string[]> {
        const client = this.getClient();
        const redisKey = this.getKey(table, key);

        try {
            const response = await client.LRANGE(redisKey, start, stop);

            this.logHandler.debug("RedisClient: 'getList' command successful.", {extra: {response, table, key, start, stop}})

            return response;
        } catch (error) {
            throw new RedisError("Error getting in redis", error as Error, table, key, redisKey);
        }
    }

    /**
     * Removes an entry in Redis
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
     * @param key The key for the entry
     */
    async remove(table: string, key: string): Promise<void> {
        const client = this.getClient();
        const redisKey = this.getKey(table, key);

        try {
            const response = await client.DEL(redisKey);

            this.logHandler.debug("RedisClient: 'remove' command successful.", {extra: {response, table, key}})

        } catch (error) {
            throw new RedisError("Error removing in redis", error as Error, table, key, redisKey);
        }
    }

    /**
     * Clears everything in Redis.
     */
    async clearAll(): Promise<void> {
        const client = this.getClient();

        try {
            const response = await client.FLUSHALL();

            this.logHandler.debug("RedisClient: 'clearAll' command successful.", {extra: {response}})

        } catch (error) {
            throw new RedisError("Error clearing redis", error as Error);
        }
    }

    /**
     * Gets the final Redis key such as: namespace:table:key
     * @param table The table name in which to save that entry. We use that to create a key such as namespace:table:key
     * @param key The key for the entry
     */
    getKey(table: string, key: string): string {
        return this.namespace + ":" + table + ":" + key;
    }
}
