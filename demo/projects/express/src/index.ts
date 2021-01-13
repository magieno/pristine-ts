import "reflect-metadata"
import {controller, HttpMethod, Kernel, route} from "@pristine-ts/core";
import {ExpressModule, RequestMapper, ResponseMapper} from "@pristine-ts/express";
import {DogsController} from "./controllers/dogs.controller";

const express = require('express')
const app = express()
const port = 3000
const kernel = new Kernel();

function bootstrap () {
    app.all('*', async (req, res) => {
        console.log(1);
        const expressRequestMapper = kernel.container.resolve(RequestMapper);
        const expressResponseMapper = kernel.container.resolve(ResponseMapper);

        expressResponseMapper.reverseMap(await kernel.handleRequest(expressRequestMapper.map(req)), res);
    })

    app.listen(port, async () => {
        await kernel.init({
            importModules: [ExpressModule],
            importServices: [DogsController],
        });

        console.log(`Example app listening at http://localhost:${port}`)
    })
}

bootstrap();