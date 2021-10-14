# Pristine

Description
------------

Pristine is a Typescript framework for NodeJS that is extremely lightweight (very low number of dependencies on other npm packages), 
that offers incredible performance while coming out of the box with all the features you expect from a full-fledge framework:

* Dependency Injection
* Configuration
  * Environment variables
  * AWS SSM
  * Configuration Files
  * Code
* Authentication
* Authorization
* Logging
* Scheduling
* Telemetry
* Validation

Philosophy
------------


Out of the box support from all these third party services (new services added monthly):
------------
Pristine comes out of the box with support from these third party services:
* Auth0
* AWS
  * Api Gateway
    * V1
    * V2
  * Cognito
  * DynamoDB
  * Lambda
  * S3
  * SQS
  * SNS
  * SSM
  * X-RAY
  * Out of the box support for the following Lambda triggers
    * DynamoDB Streams
    * Event Bridge
    * S3
    * SQS
    * SNS
* Express
* Redis
* Sentry
* Stripe

### Coming soon:

**Side note here, this list doesn't mean that Pristine is NOT compatible with the following third party services. Pristine is extensible so you can easily integrate any libraries. This list simply means that the out of the box support is not yet available.** 
* GraphQL
* MongoDB
* Kafka

Pristine is an extremely light framework with extremely minimal dependencies. Pristine can be used in a serverless context where having a very fast
coldstart is necessary. The instantiation process is very quick. Finally, the term pristine inspires the code in this framework to be pristine, clear and concise.


Hosting
------------

The Pristine framework is built for Serverless first. We put a lot of efforts in reducing the cold start as much as we can such that the instantation process of the Kernel is very quick (look at the performance tests to see for yourself how fast Pristine can be instantiated with 200 controllers and 1000 of http routes).

That being said, Pristine plays very nicely with the following NodeJS servers:

* Express
* Fastify
* Node's Http Server
* etc..

In fact, your business logic with Pristine is 100% decoupled from how it is hosted (serverless or not). Therefore, Pristine is compatible with every NodeJS server technologies.

Contributing
------------


How to begin?
------------

We encourage you to take a look at the [Getting Started](../docs/getting-started/index.md) documentation for your first steps.

References
------------

* [Getting Started](../docs/getting-started/index.md)
* [How to build the project](../docs/build.md)