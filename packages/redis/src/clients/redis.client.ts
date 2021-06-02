import {injectable, inject} from "tsyringe";
import {createClient, RedisClient as Redis} from "redis";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {RedisError} from "../errors/redis.error";
import {tag} from "@pristine-ts/common";

@tag("RedisClientInterface")
@injectable()
export class RedisClient {
    public constructor(@inject("%pristine.redis.host%") private readonly host: string,
                       @inject("%pristine.redis.port%") private readonly port: number,
                       @inject("%pristine.redis.namespace%") private readonly namespace: string,
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    getClient(): Redis {
        return createClient({
            host: this.host,
            port: this.port,
        })
    }

    set(table: string, key: string, value: string, ttl?: number): Promise<void> {
        return new Promise<void>(((resolve, reject) => {
            const client = this.getClient();
            const redisKey = this.getKey(table, key);
            const callback = (err, reply) => {
                if(err) {
                    const redisError = new RedisError("Error setting in redis", err, table, key, redisKey);
                    return this.quit(client).then(() => reject(redisError)).catch((error) => reject(error));
                }

                return this.quit(client).then(() => resolve()).catch((error) => reject(error));
            };

            if (ttl) {
                // EX means ttl is in second https://redis.io/commands/set
                client.set(redisKey, value, 'EX', ttl, callback);
            } else {
                client.set(redisKey, value, callback);
            }
        }))
    }

    get(table: string, key: string): Promise<string | null> {
        return new Promise<string | null>(((resolve, reject) => {
            const client = this.getClient();
            const redisKey = this.getKey(table, key);
            client.get(redisKey, (err, reply) => {
                if(err) {
                    const redisError = new RedisError("Error getting in redis", err, table, key, redisKey);

                    return this.quit(client).then(() => reject(redisError)).catch((error) => reject(error));
                }

                return this.quit(client).then(() => resolve(reply)).catch((error) => reject(error));
            })
        }))
    }

    remove(table: string, key: string): Promise<void> {
        return new Promise<void>(((resolve, reject) => {
            const client = this.getClient();
            const redisKey = this.getKey(table, key);
            client.del(redisKey, (err, reply) => {
                if(err) {
                    const redisError = new RedisError("Error removing in redis", err, table, key, redisKey);
                    return this.quit(client).then(() => reject(redisError)).catch((error) => reject(error));
                }

                return this.quit(client).then(() => resolve()).catch((error) => reject(error));
            })
        }))
    }

    getKey(table: string, key: string): string {
        return this.namespace + ":" + table + ":" + key;
    }

    private quit(client: Redis): Promise<void> {
        return new Promise<void>(((resolve, reject) => {
            client.quit((err, reply) => {
                if(err) {
                    const redisError = new RedisError("Error quitting redis", err);
                    return reject(redisError);
                }

                return resolve();
            })
        }))
    }
}
