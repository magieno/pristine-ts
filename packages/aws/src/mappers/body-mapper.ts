import {injectable} from "tsyringe";

@injectable()
export class BodyMapper  {
    constructor() {
    }

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
