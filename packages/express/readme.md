# Express module

When you want to use Express with Pristine, you need to use the Express module.

The Express module for pristine will simply convert the Express request to a Pristine request and convert back Pristine
response to an Express response. You can look in the demo folder for more information but in reality, that's all there
is to do to integrate with Express:

    const express = require('express')
    const app = express()
    const port = 3000
    const kernel = new Kernel();

    const bootstrap = () => {
        app.all('*', async (req, res) => {
        console.log(1);
        const expressRequestMapper = kernel.container.resolve(RequestMapper);
        const expressResponseMapper = kernel.container.resolve(ResponseMapper);
    
            expressResponseMapper.reverseMap(await kernel.handleRequest(expressRequestMapper.map(req)), res);
        })
    
        app.listen(port, async () => {

            // Either create a new module on the fly or put your own module.
            await kernel.init({
                importModules: [ExpressModule],
                importServices: [DogsController],
            });
    
            console.log(`Example app listening at http://localhost:${port}`)
        })
    }

    bootstrap();

We plan to integrate additional features and integration with Express but for now this is a good base.

## Raw request bytes (`Request.rawBody`)

`RequestMapper` puts the exact request bytes on `Request.rawBody` when they are available, and
never the parsed object. Express does not keep the bytes once a body parser has run, so capture
them with body-parser's `verify` hook through `RawBodyCapture`. Mount every parser with it, and
add a catch-all `express.raw()` after them so bodies no JSON/text parser accepts (audio, images,
octet-stream) are read at all:

    import express from "express";
    import {RawBodyCapture} from "@pristine-ts/express";

    app.use(express.json({verify: RawBodyCapture.verify}));
    app.use(express.raw({type: () => true, verify: RawBodyCapture.verify}));

With that in place:

- `request.body` is whatever the parser produced (the parsed object for JSON, a `Buffer` for
  everything the catch-all read).
- `request.rawBody` is the `Buffer` of the bytes on the wire, for JSON and binary alike. Use it,
  or `request.getRawBodyBuffer()`, for HMAC signature verification and uploads.

Without the hook, `rawBody` is the body only when a parser left it as a `Buffer` or a `string`,
and `undefined` otherwise.