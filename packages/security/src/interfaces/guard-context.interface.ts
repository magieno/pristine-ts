import {GuardInterface} from "./guard.interface";

/**
 * The Guard Context Interface defines what a guard should implement.
 * It extends the ContextAwareInterface.
 */
export interface GuardContextInterface {
    /**
     * The constructor name of the class of the guard.
     */
    constructorName: string;

    /**
     * The actual guard.
     */
    guard: GuardInterface | Function

    /**
     * The options for the guard to use.
     */
    options: any;
}
