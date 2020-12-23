import {Kernel} from "../../../packages/core/src/kernel";
import {ExpressModule} from "../../../packages/express/src/express.module";
import {DogsController} from "./controllers/dogs.controller";
import {RequestMapper} from "../../../packages/express/src/mappers/request.mapper";
import {ResponseMapper} from "../../../packages/express/src/mappers/response.mapper";

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