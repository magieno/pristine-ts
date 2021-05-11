import "reflect-metadata"
import {createServer} from "http";
import {createServer as createServerHttps, globalAgent} from "https";
import {HttpClient} from "@pristine-ts/http";
import {HttpMethod} from "@pristine-ts/common";
import {readFileSync} from "fs";

describe("Http Client", () => {
    it("should make an Http Request if the protocol is http", async () => {
        const host = 'localhost';
        const port = 0;

        await new Promise<void>(resolve => {
            const server = createServer();

            server.on("request", (req, res) => {
                let data = '';

                req.on('data', chunk => {
                    data += chunk;
                });

                req.on('end', () => {
                    res.writeHead(200);
                    const responseBody = {
                        headers: req.headers,
                        method: req.method,
                        body: data,
                    };

                    res.write(JSON.stringify(responseBody))
                    res.end();
                });

            })

            server.listen(port, host, async () => {
                // Make an HTTP call using the httpClient
                const httpClient = new HttpClient()
                const requestbody = JSON.stringify({
                    keyname: "Value",
                });
                const response = await httpClient.request({
                    // @ts-ignore
                    url: "http://localhost:" + server.address()!.port,
                    httpMethod: HttpMethod.Put,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Token": "AuthorizationToken",
                    },
                    body: requestbody,
                });

                expect(response.status).toBe(200)

                const parsedBody = JSON.parse(response.body);

                expect(parsedBody.method).toBe(HttpMethod.Put);
                expect(parsedBody.body).toBe(requestbody);
                expect(parsedBody.headers["content-type"]).toBe("application/json");
                expect(parsedBody.headers["x-token"]).toBe("AuthorizationToken");

                server.close();
                return resolve();
            });

        })

        expect.assertions(5)
    })

    it("should make an Https Request if the protocol is https", async () => {
        globalAgent.options.rejectUnauthorized = false

        const host = 'localhost';
        const port = 0;

        await new Promise<void>(resolve => {
            const server = createServerHttps({
                key: readFileSync(__dirname + '/../files/localhost.key'),
                cert: readFileSync(__dirname + '/../files/localhost.crt'),
                rejectUnauthorized: false,
            });

            server.on("request", (req, res) => {
                let data = '';

                req.on('data', chunk => {
                    data += chunk;
                });

                req.on('end', () => {
                    res.writeHead(200);
                    const responseBody = {
                        headers: req.headers,
                        method: req.method,
                        body: data,
                    };

                    res.write(JSON.stringify(responseBody))
                    res.end();
                });

            })

            server.listen(port, host, async () => {
                // Make an HTTP call using the httpClient
                const httpClient = new HttpClient()
                const requestbody = JSON.stringify({
                    keyname: "Value",
                });
                const response = await httpClient.request({
                    // @ts-ignore
                    url: "https://localhost:" + server.address()!.port,
                    httpMethod: HttpMethod.Put,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Token": "AuthorizationToken",
                    },
                    body: requestbody,
                });

                expect(response.status).toBe(200)

                const parsedBody = JSON.parse(response.body);

                expect(parsedBody.method).toBe(HttpMethod.Put);
                expect(parsedBody.body).toBe(requestbody);
                expect(parsedBody.headers["content-type"]).toBe("application/json");
                expect(parsedBody.headers["x-token"]).toBe("AuthorizationToken");

                server.close();
                return resolve();
            });
        })

        expect.assertions(5)
    })
})
