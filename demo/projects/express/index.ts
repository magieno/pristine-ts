import {DogsController} from "./controllers/dogs.controller";
import {ExpressModule, RequestMapper, ResponseMapper} from "@pristine-ts/express";

const express = require('express')
const app = express()
const port = 3000

const kernel = new Kernel();

app.all('*', async (req, res) => {
    const expressRequestMapper = kernel.container.resolve(RequestMapper);
    const expressResponseMapper = kernel.container.resolve(ResponseMapper);

    expressResponseMapper.reverseMap(await kernel.handleRequest(expressRequestMapper.map(req)), res);
})

app.listen(port, async () => {
    await kernel.init({
        importModules: [ExpressModule],
        importServices: [DogsController],
    })

    console.log(`Example app listening at http://localhost:${port}`)
})