import "reflect-metadata"
import {ExpressModule, RequestMapper, ResponseMapper} from "@pristine-ts/express";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {DogsController} from "./controllers/dogs.controller";

const express = require('express')
const app = express()
const port = 3000
const kernel = new Kernel();

function bootstrap () {
    app.all('*', async (req, res) => {
        await kernel.handle(req, {keyname: ExecutionContextKeynameEnum.Express, context: {req, res}});
    })

    app.listen(port, async () => {
        await kernel.start({
            keyname: "express-demo",
            importModules: [ExpressModule],
            importServices: [DogsController],
        });

        console.log(`Example app listening at http://localhost:${port}`)
    })
}

bootstrap();
