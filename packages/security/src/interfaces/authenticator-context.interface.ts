import {AuthenticatorInterface} from "./authenticator.interface";

export interface AuthenticatorContextInterface {
    constructorName: string;
    authenticator: AuthenticatorInterface | Function
    options: any;
}
