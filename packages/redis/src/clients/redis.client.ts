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

    getClient(): ClientV3 {
        if (this.client === undefined) {
            this.client = new ClientV3({
                host: this.host,
                port: this.port,
            });
        }

        return this.client;
    }

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

    getKey(table: string, key: string): string {
        return this.namespace + ":" + table + ":" + key;
    }
}
