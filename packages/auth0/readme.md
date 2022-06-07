Auth0 Module
------------

[Auth0](https://auth0.com) is service that makes it easy to implement Authentication into your backend services. In order to facilitate integration with Auth0, we have created an official Pristine module.

As you will see in the next chapters, you can use authenticators to ensure that before reaching your method in your controller, you are properly authenticated.

With the Auth0 module, we have simplified this process for you.

### 1- Import the Auth0Module
```
export const AppModule: AppModuleInterface = {
    importServices: [
    ],
    importModules: [
     CoreModule,
     Auth0Module,
    ],
    keyname: "my_namespace.app",
}
```

### 2- Put in the configuration the value for your Auth0 domain
By default, you can define the environment variable: `PRISTINE_AUTH0_ISSSUER_DOMAIN`

That's it, if you make an HTTP Request to a Pristine microservice and you pass a valid JWT as a HTTP Header:

```
Authorization: Bearer YOUR_JWT_HERE
```

### Example
**Pro Tip**: You can use the `@identity` decorator to decorate a parameter of your controller's method to retrieve the decoded Jwt. Here's an example:

```
@authenticator(Auth0Authenticator)
public MyController {
    public myProtectedApiCall(@identity identity: IdentityInterface) {
    }
}
```

That's it, you now have your Pristine project integrated with Auth0.
