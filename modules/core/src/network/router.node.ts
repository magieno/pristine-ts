import {HttpMethod} from "../enums/http-method.enum";
import {Router} from "./router";

export abstract class RouterNode {
    /**
     *
     */
    parent?: RouterNode;

    /**
     *
     */
    children: RouterNode[] = [];

    /**
     *
     * @param splitPaths
     * @param method
     */
    abstract find(splitPaths: string[], method: HttpMethod): RouterNode | null;

    /**
     *
     * @param splitPaths
     * @param method
     */
    abstract add(splitPaths: string[], method: HttpMethod);
}