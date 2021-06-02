import {injectable} from "tsyringe"
import {createClient, RedisClient as } from "redis";



@injectable()
export class RedisClient {
    private client: ;

    public constructor(private readonly ) {
        const client = createClient()
    }
}
