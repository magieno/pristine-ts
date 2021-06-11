import {ClientV3} from "@camaro/redis";

export interface RedisClientInterface {
    getClient(): ClientV3;

    set(table: string, key: string, value: string, ttl?: number): Promise<void>

    setList(table: string, key: string, value: string[], ttl?: number): Promise<void>

    get(table: string, key: string): Promise<string | null>

    getList(table: string, key: string, start?: number, stop?: number): Promise<string[]>

    remove(table: string, key: string): Promise<void>

    getKey(table: string, key: string): string
}
