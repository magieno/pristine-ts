## Philosophy


### Why bother you might ask?
The biggest benefit of this approach is the performance gain you get when you host your code as a Function as a Service (FaaS) provider. In the Serverless world, being coupled with a Http Server is major handicap.

In a Function as a Service(FaaS) world, the Cloud providers all have builtin mechanisms to transform Http requests into binary objects, compatible with the runtime language of the function, that can be used directly in the code without any further transformation.

Unfortunately, most NodeJS frameworks are not built with a Serverless first mentality and can only handle Http requests by starting a Http Server. Yes, this means that in order to handle the Javascript object passed to your function, you have to convert it again from a Javascript object to a Http Request.

When you think about it for a second, it doesn't make sense. The Cloud Infrastructre provides you with a Request object, why not use it directly?

Starting another Http Server means that you are doing the same work twice. This results in this inefficient process:

<!-- todo put a real diagram -->
Http Client ---> Cloud --> Function Invocation (with Request object) --> Start local Http Server --> Convert request as Http Request --> Send to local Http Server --> Traditional NodeJS frameworks transform the Http Request into a Request object --> NodeJS frameworks handles the request.

Pristine doesn't work like that. Because it isn't coupled with a specific Http Server, Pristine expects its own Request format. This means that we only have to map the Cloud's request object into Pristine's.

As you can start to understand, this also means that we can easily map any Http Server's requests into a Pristine Request object. Mapping between two objects is always faster than starting a full-fledge Http Server and then converting it again twice.

Therefore, Pristine's process is much simpler and much faster:
Http Client ---> Cloud --> Function Invocation (with Request object) --> Cloud Specific Request Mapper --> Pristine

### What about cold starts?
If you are familiar with FaaS, you are definitely familiar with the concept of cold starts.

A cold start refers to the first instantiation of a function. Behind the scenes, depending on the implementation, the Cloud Provider has to quickly launch a container (or a NodeJS process in the case of CloudFlare Workers) and set it up properly (networking, attached disks, etc..) before serving the request.

After the first launch, the Cloud Providers usually keep your functions "warm", meaning they keep the containers running. This means that during the next execution, you won't incur a cold start latency.

Reducing the cold start latency is a very important topic for the adoption of FaaS.

Additionally, not increasing the cold start is important. This last sentence is precisely the goal we had when building Pristine:

> Building a lightweight full-fledge framework that has a minimal impact on cold starts when being ran in FaaS while being as efficient in traditional hosting.

### This is great, but I don't want to use Serverless

No worries. That's why we built it to be very decoupled. Therefore, hosting it in a traditional http server won't incur a performance hit.




## Hosting

The Pristine framework is built for Serverless first. We put a lot of efforts in reducing the cold start as much as we can such that the instantation process of the Kernel is very quick (look at the performance tests to see for yourself how fast Pristine can be instantiated with 200 controllers and 1000 of http routes).

That being said, Pristine plays very nicely with the following NodeJS servers:

* [Express](https://github.com/expressjs/express)
* [Fastify](https://github.com/fastify/fastify)
* [Node's Http Server](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTP-server/)
* etc..

In fact, your business logic with Pristine is 100% decoupled from how it is hosted (serverless or not). Therefore, Pristine is compatible with every NodeJS server technologies.

## Inspiration
Pristine is heavily inspired by the very popular NodeJS framework named [NestJS](https://github.com/nestjs/nest). If you are familiar with NestJS already, switching to Pristine will be a breeze.

Pristine is also heavily inspired by the Symfony framework (PHP) and Spring (Java).
