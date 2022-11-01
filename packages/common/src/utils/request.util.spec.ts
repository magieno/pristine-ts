import {Request} from "../models/request";
import {RequestUtil} from "./request.util";
import {HttpMethod} from "../enums/http-method.enum";

describe("Request Util", () => {
    it("should hash the same request twice", () => {
        const rawBody = {};

        const request: Request = new Request(HttpMethod.Get, "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink");
        request.rawBody = rawBody;
        request.setHeaders({
            "header1": "value1",
            "header2": "value2",
            "header3": "value3",
        });

        const request2: Request = new Request(HttpMethod.Get, "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?sort=ASC&query=searchTerm#anchorLink");;
        request2.rawBody = rawBody;
        request2.setHeaders({
            "header3": "value3",
            "header2": "value2",
            "header1": "value1",
        });

        const request1Hash = RequestUtil.hash(request);
        const request2Hash = RequestUtil.hash(request2);

        expect(request1Hash).toBe(request2Hash);
    })

    it("should not hash different requests to the same value", () => {
        const rawBody = {};

        const request: Request = new Request(HttpMethod.Get, "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?query=searchTerm&sort=ASC#anchorLink");
        request.rawBody = rawBody;
        request.setHeaders({
            "header1": "value1",
            "header2": "value2",
            "header3": "value3",
        });

        const request2: Request = new Request(HttpMethod.Get, "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?sort=ASC&query=searchTermXXXXX#anchorLink");;
        request2.rawBody = rawBody;
        request2.setHeaders({
            "header3": "value3",
            "header2": "value2",
            "header1": "value1",
        });

        const request3: Request = new Request(HttpMethod.Get, "http://www.subdomain.ima-tech.ca/api/1.0/dogs/caniche-royal?sort=ASC&query=searchTerm");
        request2.rawBody = rawBody;
        request2.setHeaders({
            "header3": "value3",
            "header2": "value2",
            "header1": "value1",
        });

        const request1Hash = RequestUtil.hash(request);
        const request2Hash = RequestUtil.hash(request2);
        const request3Hash = RequestUtil.hash(request3);

        expect(request1Hash).not.toBe(request2Hash);
        expect(request1Hash).not.toBe(request3Hash);
        expect(request2Hash).not.toBe(request3Hash);
    })
})