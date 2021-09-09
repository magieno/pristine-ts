import {injectable} from "tsyringe";

@injectable()
export class BodyMapper  {
    constructor() {
    }

    /**
     * Maps a body. Parses the body if possible.
     * @param body The body.
     */
    map(body: string | undefined): any {
        let parsedBody;
        if(!body){
            return;
        }
        try {
            return JSON.parse(body);
        } catch (e) {
            return body;
        }
    }
}
