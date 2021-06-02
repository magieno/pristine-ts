import {RedisClient as Redis} from "redis";

export interface RedisClientInterface {
    getClient(): Redis

    set(table: string, key: string, value: string, ttl?: number): Promise<void>

    get(table: string, key: string): Promise<string | null>

    remove(table: string, key: string): Promise<void>

    getKey(table: string, key: string): string
}
