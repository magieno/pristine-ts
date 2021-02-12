import {JwtManager} from "./jwt.manager";
import {HttpMethod, RequestInterface} from "@pristine-ts/networking";
import {JWTKeys} from "../tests/jwt.keys";
import {InvalidJwtError} from "../errors/invalid-jwt.error";

describe("JWT Manager", () => {

    it("should decode a valid JWT with private key and no passphrase", async () => {
        const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

        // // JWT Payload:
        // {
        //     "sub": "1234567890",
        //     "name": "Etienne Noel",
        //     "iat": 1516239022
        // }
        const jwt = "eyJraWQiOiI0ZTY1OTJiOC1kYzhhLTQ0ZDUtYjMxOC01ZTBmMGYwMTAwYjMiLCJhbGciOiJSUzI1NiJ9.ew0KICAic3ViIjogIjEyMzQ1Njc4OTAiLA0KICAibmFtZSI6ICJFdGllbm5lIE5vZWwiLA0KICAiaWF0IjogMTUxNjIzOTAyMg0KfQ.X7-qnOsFeyoiCgVzuwc5Yt2D6oNAOAZoY36oy-khcteVlqkvy9jjERAjUXyG_0bBbTu7dtGeq37FbvAXrV7CoeoQgX1c3UHDFabOvAb-BQ1LuPz6R5jSYgBRPbDP38Ai_Hv2Xgls1_7vP6vwwsGpty8Do42w2AZ1Ge8xDTXG0SB25FTIBBu39incSNDGoqL3QDNe7E-R8EbW5Fj40iQBVvFA999tNwYfBCilO8Wmb38dRpRpzDhHw_GDJZj7SOXlsJqfHHEb0rY2kiAS81WDYfxWMQKxSoMt8l7rZ6AezW6YFh_etyQc4eDiPzu-iiQc12enF5wIcwde6GPxaEft_g";

        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                "Authorization": "Bearer " + jwt,
            }
        }

        const payload = await jwtManager.validateAndDecode(request)

        expect(payload).toStrictEqual({
                "sub": "1234567890",
                "name": "Etienne Noel",
                "iat": 1516239022
            });
    });

    it("shouldn't decode an invalid JWT", async () => {
        const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

        const jwt = "fdsafdsfdsafdsafdasfds";
        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                "Authorization": "Bearer " + jwt,
            }
        }

        return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
    });

    it("shouldn't decode an invalid Authorization Header", async () => {
        const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

        const jwt = "fdsafdsfdsafdsafdasfds";
        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
                "Authorization": "dsfdafdsafd",
            }
        }

        return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
    });

    it("shouldn't decode a missing Authorization Header", async () => {
        const jwtManager = new JwtManager(JWTKeys.RS256.withoutPassphrase.public, "RS256")

        const jwt = "fdsafdsfdsafdsafdasfds";
        const request: RequestInterface = {
            body: {},
            url: "",
            httpMethod: HttpMethod.Get,
            headers: {
            }
        }

        return expect(jwtManager.validateAndDecode(request)).rejects.toBeDefined();
    });
});