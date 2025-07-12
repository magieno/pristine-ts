This file provides instructions for agents working with this codebase.

## Getting Started

To get started with this project, you should run the following commands from the root of the repository:

1. `npm ci`
2. `npm run build`
3. `npm run test`
4. `npm run e2e`

## Overview

This is a monorepo for a TypeScript framework called Pristine. The framework is divided into several packages, each with a specific purpose.

### Core Packages

*   `@pristine-ts/core`: The core of the framework, containing the kernel, event dispatcher, and other essential components.
*   `@pristine-ts/common`: Common interfaces, enums, and utilities used across the framework.
*   `@pristine-ts/networking`: Provides networking capabilities, including a router, request/response objects, and decorators for controllers and routes.
*   `@pristine-ts/security`: Handles authentication and authorization, with support for JWT, Auth0, and AWS Cognito.
*   `@pristine-ts/logging`: A logging module with support for different log levels and handlers.
*   `@pristine-ts/configuration`: A module for managing configuration from various sources.
*   `@pristine-ts/validation`: A module for validating request bodies.
*   `@pristine-ts/data-mapping`: A module for mapping data from one format to another.

### Integrations

The framework also includes integrations with various services and libraries:

*   `@pristine-ts/aws`: A module for integrating with AWS services like S3, SQS, DynamoDB, and more.
*   `@pristine-ts/aws-api-gateway`: A module for handling API Gateway events.
*   `@pristine-ts/aws-cognito`: A module for authenticating with AWS Cognito.
*   `@pristine-ts/aws-scheduling`: A module for scheduling tasks with AWS.
*   `@pristine-ts/aws-xray`: A module for tracing with AWS X-Ray.
*   `@pristine-ts/auth0`: A module for authenticating with Auth0.
*   `@pristine-ts/cloudflare`: A module for integrating with Cloudflare Workers.
*   `@pristine-ts/express`: A module for using the Express framework with Pristine.
*   `@pristine-ts/file`: A module for working with files.
*   `@pristine-ts/http`: A module for making HTTP requests.
*   `@pristine-ts/jwt`: A module for working with JSON Web Tokens.
*   `@pristine-ts/mysql`: A module for connecting to MySQL databases.
*   `@pristine-ts/opensearch`: A module for working with OpenSearch.
*   `@pristine-ts/redis`: A module for working with Redis.
*   `@pristine-ts/scheduling`: A module for scheduling tasks.
*   `@pristine-ts/sentry`: A module for integrating with Sentry.
*   `@pristine-ts/stripe`: A module for integrating with Stripe.
*   `@pristine-ts/telemetry`: A module for collecting telemetry data.

### CLI

*   `@pristine-ts/cli`: A command-line interface for managing Pristine projects.

## Testing

The project has a comprehensive test suite, including unit tests, integration tests, and end-to-end tests.

*   `npm run test`: Runs the unit and integration tests for all packages.
*   `npm run e2e`: Runs the end-to-end tests.
*   `npm run perf`: Runs the performance tests.
