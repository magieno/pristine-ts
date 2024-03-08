import "reflect-metadata"
import {HttpClient, HttpWrapper, ResponseTypeEnum, FileHttpServer} from "@pristine-ts/http";
import {HttpMethod} from "@pristine-ts/common";
import {v4 as uuidv4} from "uuid";

describe("FileHttpServer", () => {
    it("should start the server and serve files.", async () =>{
        const fileHttpServer = new FileHttpServer("127.0.0.1", 9000);

        await fileHttpServer.start(__dirname + "/../../../files/");

        const httpClient = new HttpClient(new HttpWrapper())
        httpClient.defaultOptions.responseType = ResponseTypeEnum.Raw;
        httpClient.defaultOptions.followRedirects = true;
        httpClient.defaultOptions.isRetryable = (httpRequestInterface, httpResponseInterface) => false;
        httpClient.defaultOptions.maximumNumberOfRetries = 0;

        const response = await httpClient.request({
            // @ts-ignore
            url: "http://127.0.0.1:9000/architecture.svg",
            httpMethod: HttpMethod.Get,
            headers: {
            },
        });

        expect(response.status).toBe(200);
        expect(response.headers!["content-type"]).toBe("image/svg+xml");
    })
})