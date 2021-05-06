export interface HttpClientInterface {
    get<T>(url: string): Promise<T>;
}
