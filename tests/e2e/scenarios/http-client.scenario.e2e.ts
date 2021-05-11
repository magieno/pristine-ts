import {request as httpRequest, createServer} from "http";
import {request as httpsRequest} from "https";
import {HttpClient} from "@pristine-ts/http";

describe("Http Client", () => {
    it("should make an Http Request if the protocol is http", async () => {
        const host = 'localhost';
        const port = 8000;

        await new Promise<void>(resolve => {
            const server = createServer((req, res) => {
                res.writeHead(200);
                res.end("My first server!");
            });

            server.listen(port, host, () => {
                // Make an HTTP call using the httpClient
                const httpClient = new HttpClient()
                const response = httpClient.request({

                });


                return resolve();
            });
        })

    })

    it("should make an Https Request if the protocol is https", () => {

    })
})
