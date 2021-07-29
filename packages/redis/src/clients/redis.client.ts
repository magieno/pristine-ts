import {injectable, inject} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {RedisError} from "../errors/redis.error";
import {tag} from "@pristine-ts/common";
import {RedisClientInterface} from "../interfaces/redis-client.interface";
import {ClientV3} from "@camaro/redis";

@tag("RedisClientInterface")
@injectable()
export class RedisClient implements RedisClientInterface {

    private client: ClientV3;

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

            this.logHandler.debug("Redis response", {response})
        } catch (error) {
            throw new RedisError("Error setting in redis", error, table, key, redisKey);
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

            this.logHandler.debug("Redis response", {response})
        } catch (error) {
            throw new RedisError("Error setting in redis", error, table, key, redisKey);
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

            this.logHandler.debug("Redis response", {response})

            return response;
        } catch (error) {
            throw new RedisError("Error getting in redis", error, table, key, redisKey);
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

            this.logHandler.debug("Redis response", {response})

            return response;
        } catch (error) {
            throw new RedisError("Error getting in redis", error, table, key, redisKey);
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

            this.logHandler.debug("Redis response", {response})

        } catch (error) {
            throw new RedisError("Error removing in redis", error, table, key, redisKey);
        }
    }

    /**
     * Clears everything in Redis.
     */
    async clearAll(): Promise<void> {
        const client = this.getClient();

        try {
            const response = await client.FLUSHALL();

            this.logHandler.debug("Redis response", {response})

        } catch (error) {
            throw new RedisError("Error clearing redis", error);
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
