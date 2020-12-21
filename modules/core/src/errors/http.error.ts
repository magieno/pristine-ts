export class HttpError extends Error {
    public constructor(public readonly httpStatus: number, readonly message: string) {
        super(message);
    }
}