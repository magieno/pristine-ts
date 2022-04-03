<p align="center">
    <img src="assets/logo/pristine-logo.svg">
</p>

<p align="center">
    The Pristine framework is a <strong>lightweight</strong> and <strong>fast</strong> framework packed with <strong>all the features</strong> you expect from a <strong>full-fledge framework</strong>.
</p>

<p align="center">
<strong>Our mission</strong>: Build a lightweight full-fledge framework that has a minimal impact on cold starts when being ran in FaaS while being as efficient in traditional hosting.
</p>

## Philosophy
Pristine is an extremely light framework with extremely minimal dependencies. Pristine can be used in a serverless context when having a very fast
cold start is necessary. The instantiation process is very quick (under 30ms). Finally, the term pristine inspires the code in this framework to be pristine, clear and concise. You will see that reading the code is easy as we believe it should always be.

Pristine is built with the strong opinion that your business logic should be 100% agnostic from how it is hosted. Most NodeJS frameworks share this same mentality. However, Pristine does it differently.

Instead of being tightly coupled with a Http Server, Pristine is entirely decoupled from how it is hosted. To do so, Pristine encapsulates its own Request object. Then, you have the choice of the Http Server you want to use. You simply need a mapper specific to the Http Server and that's it. (Don't worry, we try to create one for each available http server).

## Getting started
To get started, we invite you to begin reading our documentation: <a href="docs/getting-started/index.md">Getting Started</a>

## Description

Pristine is a [Typescript](https://www.typescriptlang.org) framework for [NodeJS](https://nodejs.org/en/) that is extremely lightweight (very low number of dependencies on other npm packages), 
that offers incredible performance while coming out of the box with all the features you expect from a full-fledge framework:

* Authentication
* Authorization
* Configuration
  * AWS SSM
  * Code based
  * Configuration files
  * Environment variables
* Dependency Injection (powered by [TSyringe](https://github.com/microsoft/tsyringe))
* Events
* Http Client
* Logging
* Scheduling
* Tracing
* Validation


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

## Out of the box support from all these third party services (new services added monthly):

Pristine comes out of the box with support from these third party services:
* [Auth0](https://auth0.com)
* AWS
  * [Api Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
    * [V1](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
    * [V2](https://docs.aws.amazon.com/apigatewayv2/latest/api-reference/api-reference.html)
  * [Cognito](https://docs.aws.amazon.com/cognito/index.html)
  * [DynamoDB](https://docs.aws.amazon.com/dynamodb/index.html)
  * [Event Bridge](https://docs.aws.amazon.com/eventbridge/)
  * [Lambda](https://docs.aws.amazon.com/lambda/?id=docs_gateway)
  * [S3](https://docs.aws.amazon.com/s3/)
  * [SQS](https://docs.aws.amazon.com/sqs/)
  * [SNS](https://docs.aws.amazon.com/sns/)
  * [SSM](https://docs.aws.amazon.com/ssm/)
  * [X-Ray](https://docs.aws.amazon.com/ssm)
  * Out of the box support for the following Lambda triggers (Yes, you don't have to do anything, we've done it for you)
    * DynamoDB Streams ([DynamoDB Streams and AWS Lambda Triggers](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.html))
    * Event Bridge ([Schedule AWS Lambda functions using EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-run-lambda-schedule.html))
    * S3 ([Using AWS Lambda with Amazon S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html))
    * SQS ([Using AWS Lambda with Amazon SQS](https://docs.aws.amazon.com/sqs/))
    * SNS ([Using AWS Lambda with Amazon SNS](https://docs.aws.amazon.com/lambda/latest/dg/with-sns.html))
    * X-Ray ([Using AWS Lambda with AWS X-Ray](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html))
* [Express](https://github.com/expressjs/express)
* [Redis](https://redis.io)
* [Sentry](https://sentry.io/welcome/)
* [Stripe](https://stripe.com)

## Coming soon:

**Side note here, this list doesn't mean that Pristine is NOT compatible with the following third party services. Pristine is extensible so you can easily integrate any libraries. This list simply means that the out of the box support is not yet available.** 
* GraphQL
* MongoDB
* Kafka


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

## How to begin?

We encourage you to take a look at the [Getting Started](docs/getting-started/index.md) documentation for your first steps.

## References

* [Getting Started](docs/getting-started/index.md)
* [How to build the project](docs/build.md)

-----

<p align="right">
<strong>Next: </strong> <a href="docs/getting-started/index.md">Getting Started</a>
</p>
