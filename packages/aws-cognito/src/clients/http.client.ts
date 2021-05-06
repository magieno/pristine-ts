import {injectable, inject} from "tsyringe";
import * as Axios from 'axios';
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {tag} from "@pristine-ts/common";


// todo: move somewhere else Networking Core Common ? And implement actual client
@tag("HttpClientInterface")
@injectable()
export class HttpClient implements HttpClientInterface{

    constructor(
    ) {
    }

    async get<T>(url: string): Promise<T> {
        return (await Axios.default.get<T>(url)).data;
    }
}
