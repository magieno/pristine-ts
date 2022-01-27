import {ExecutionContextKeynameEnum} from "../enums/execution-context-keyname.enum";

export interface ExecutionContextInterface<T> {
    keyname: ExecutionContextKeynameEnum | string;
    context: T;
}
