import {controller, route} from "@pristine-ts/networking";
import {injectable} from "tsyringe";
import {HttpMethod, Response} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {ExpressModule} from "@pristine-ts/express";
import {HttpWrapper} from "@pristine-ts/http";

@injectable()
@controller("/api/health")
class HealthController {

    @route(HttpMethod.Get, "")
    public get() {
        return {
            healthy: true,
        }
    }
}

const express = require('express')
const app = express()

describe("Express - Request Execution", () => {
    it('should execute and return the expected response when hosted under express', (done) => {
        const kernel = new Kernel();

        app.all('*', async (req: any, res: any) => {
            await kernel.handle(req, {keyname: ExecutionContextKeynameEnum.Express, context: {req, res}}) as Response
        });

        const server = app.listen(0, async () => {
            await kernel.start({
                keyname: "PRISTINE_E2E_EXPRESS",
                importModules: [ExpressModule],
                importServices: [HealthController],
            }, {
                "pristine.logging.consoleLoggerActivated" : false,
            });

            const port = server.address().port;
            console.log(`Express app listening at http://localhost:${port}`)

            // Make an Http Call
            const httpClientWrapper = new HttpWrapper();
            const response = await httpClientWrapper.executeRequest({
                url: "http://127.0.0.1:" + port + "/api/health",
                httpMethod: HttpMethod.Get,
            })

            expect(response.status).toBe(200)
            expect(response.body).toStrictEqual(JSON.stringify({
                healthy: true,
            }))

            const errorResponse = await httpClientWrapper.executeRequest({
                url: "http://127.0.0.1:" + port + "/not_found",
                httpMethod: HttpMethod.Get,
            })

            expect(errorResponse.status).toBe(404)

            done();

        })
    })
})
