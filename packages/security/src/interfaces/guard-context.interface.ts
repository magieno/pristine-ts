import {GuardInterface} from "./guard.interface";

export interface GuardContextInterface {
    constructorName: string;
    guard: GuardInterface | Function
    options: any;
}
