# AWS module

Amazon Web Services (AWS) is a Cloud service powered by Amazon. It has a lot of different services. The goal of this AWS
module is to try to make it as seamless
as possible to integrate with as many services as possible.

If you are using AWS, you are definitely familiar with the [AWS SDK](https://aws.amazon.com/sdk-for-javascript/). The
AWS SDK is very well built. However, there are a lot of
things that aren't encapsulated and the goal of this module is to make it even easier to interact with AWS Services.

### Wrapper clients

#### DynamoDB Client

DynamoDB is the NoSQL managed service by AWS. DynamoDB is not extremely straightforward or easy to use. Therefore, we
have created a DynamoDB Client that simplifies the interaction with DynamoDB.

The `DynamodbClient` implements the `DynamodbClientInterface` allowing to mock your database layer in unit tests very
easily.

In your class, you can easily request to have the `DynamodbClientInterface` be injected like this:

```
@injectable()
class MyService {
    constructor(@inject("DynamodbClientInterface") private readonly dynamodbClient: DynamodbClientInterface) {}
}
```

#### Event Bridge Client

#### SQS Client

### Event Parsers

One of the most complicated thing when interacting with AWS, is the parsing of AWS events. As you will see later on,
Pristine has its own mechanic for handling Events and we are transforming AWS Events into Pristine Events.

In a nutshell, this means that you can easily listen to any AWS Events by creating a class that implements the
`EventListenerInterface` and specifies the Event you want to listen to.

### Resolvers

#### SSM Resolver

AWS has a service called SSM that allows you to store sensitive information such as passwords. The SSM Resolver can be
used with the configuration service and will resolve values in the SSM for you. The only thing you have to worry about,
is to
inject the configuration value in your class. How it's being retrieved is handled by Pristine for you.
