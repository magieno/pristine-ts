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