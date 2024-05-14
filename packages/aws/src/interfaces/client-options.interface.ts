export interface ClientOptionsInterface {
    /**
     * The maximum time in milliseconds that the connection phase of a request may take before the connection attempt is abandoned. Default is whatever AWS puts in its documentation.
     */
    requestTimeout: number;
}