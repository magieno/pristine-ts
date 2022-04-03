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

Our philosophy is simple. We believe that any code written should be clear on first read, concise and very well documented. We chose the word Pristine as representation of this philosophy, and it guides how this framework is created.

Additionally, Pristine is built with the strong opinion that any business logic should be 100% agnostic from how it is hosted. Most NodeJS frameworks share this same mentality. However, Pristine does it differently than most others.

Instead of being tightly coupled with a Http Server, Pristine is entirely decoupled from how it is hosted. To do so, Pristine encapsulates its own Request object. Then, you have the choice of the Http Server you want to use. You simply need a mapper specific to the Http Server and that's it. (Don't worry, we try to create one for each available http server).

## Getting started
To get started, we invite you to begin reading our documentation: <a href="docs/getting-started/index.md">Getting Started</a>


## Features
Here are all the modules and features that we support (you can learn about these features in the getting started guide):

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

## How to begin?

We encourage you to take a look at the [Getting Started](docs/getting-started/index.md) documentation for your first steps.

## References

* [Getting Started](docs/getting-started/index.md)
* [How to build the project](docs/build.md)
* [Philosophy](docs/philosophy.md) (If you )

-----

<p align="right">
<strong>Next: </strong> <a href="docs/getting-started/index.md">Getting Started</a>
</p>
