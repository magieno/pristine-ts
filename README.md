<p align="center">
    <img src="assets/logo/pristine-logo.svg">
</p>

<p align="center">
    The Pristine framework is a very <strong>lightweight</strong>, incredibly <strong>fast</strong> with <strong>most of the features</strong> you expect from a <strong>full-fledge framework</strong>.
</p>



Description
------------

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

Philosophy
------------
Pristine is an extremely light framework with extremely minimal dependencies. Pristine can be used in a serverless context where having a very fast
cold start is necessary. The instantiation process is very quick. Finally, the term pristine inspires the code in this framework to be pristine, clear and concise.

Out of the box support from all these third party services (new services added monthly):
------------
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

### Coming soon:

**Side note here, this list doesn't mean that Pristine is NOT compatible with the following third party services. Pristine is extensible so you can easily integrate any libraries. This list simply means that the out of the box support is not yet available.** 
* GraphQL
* MongoDB
* Kafka


Hosting
------------

The Pristine framework is built for Serverless first. We put a lot of efforts in reducing the cold start as much as we can such that the instantation process of the Kernel is very quick (look at the performance tests to see for yourself how fast Pristine can be instantiated with 200 controllers and 1000 of http routes).

That being said, Pristine plays very nicely with the following NodeJS servers:

* [Express](https://github.com/expressjs/express)
* [Fastify](https://github.com/fastify/fastify)
* [Node's Http Server](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTP-server/)
* etc..

In fact, your business logic with Pristine is 100% decoupled from how it is hosted (serverless or not). Therefore, Pristine is compatible with every NodeJS server technologies.

How to begin?
------------
We encourage you to take a look at the [Getting Started](docs/getting-started/index.md) documentation for your first steps.

References
------------
* [Getting Started](docs/getting-started/index.md)
* [How to build the project](docs/build.md)