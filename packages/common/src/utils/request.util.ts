import { createHash } from 'crypto';
import {Request} from "../models/request";
import { URL } from 'url';

function sort(obj: any) {
    const ret: any = {};

    Object.keys(obj).sort().forEach(function (key) {
        ret[key] = obj[key];
    });

    return ret;
}

export class RequestUtil {
    static hash(request: Request): string | null {
        const hash = createHash("md5");

        const parsedUrl = new URL(request.url);

        parsedUrl.searchParams.sort();

        hash.update(parsedUrl.pathname);
        hash.update(request.httpMethod);
        hash.update(parsedUrl.searchParams.toString());
        hash.update(parsedUrl.hash);
        hash.update(JSON.stringify(sort(request.headers)));

        try {
            hash.write(JSON.stringify(request.body));
        } catch (e) {
            return null;
        }


        return hash.digest("hex");
    }
}