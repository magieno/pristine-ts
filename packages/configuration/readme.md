# Configuration Module

The Configuration Module is used to provide a way for your own module or other modules in Pristine to be dynamically configured.
This allows any service injected in the Container to retrieve a parameter. The parameter will be injected as `%module_keyname.parameter_name%` (it follows the syntax
used by Symfony). 

In your class, to have a parameter be injected, you simply do this:

    class Example {
        public constructor(@inject("%module_keyname.parameter_name%") private readonly parameterName: string) {}
    }


## How to specify a configuration for your module

Before we begin, there are two terms we use as a convention, and it's important to understand them before continuing.

### ConfigurationDefinition
The ConfigurationDefinition is the configuration "model" that the module specifies it needs. By convention, we recommend
creating a ConfigurationDefinitionInterface interface that specifies what you are expecting your users to pass. Here's 
an example:

    interface ConfigurationDefinitionInterface {
        test1Parameter: string;
        test2Parameter?: string;
        test3Parameter?: string;
    }

Then, you can create a ConfigurationDefinition class that specifies the default values for the required parameters.

        class ConfigurationDefinition implements ConfigurationDefinitionInterface {
            test1Parameter: string = "test1";
            test2Parameter?: string = "test2";
        }

Then, when you define and create your module, you pass the ConfigurationDefinition type object:

        const module: ModuleInterface = {
            keyname: "test",
            importServices: [],
            providerRegistrations: [
            ],
            configurationDefinition: ConfigurationDefinition
        };

That way, the ConfigurationModule now knows which values must be expected and will complain when you start the kernel if
the user hasn't provided these values for your module.

### Configuration
The Configuration represents the actual values that the configuration parameters will have. The configuration is passed in the init method of the kernel and
Pristine evaluates if all the required configuration parameters are present.

---
**NOTE**

Now, you might be wondering why you need to create a class (on top of an interface) and define default values because you might want to force
the user to pass those values. The problem is that interfaces in Typescript are lost during compile time, and we cannot use
them (yet) to retrieve type or optionality information during runtime.

Therefore, that's why we recommend the creation of a `ConfigurationDefinitionInterface` so that this interface can act as a guide
for your users, since this is the interface that you should expose. 

When your users will be initiating the kernel, they will need to pass a configuration for each module keyname, and you ask 
them to use the configuration interface

**This part is still pretty weak in our opinion and will need some interesting thinking to make it better, but for now, it works correctly, but is too opinionated for our liking.**

---

##Instantiation and using the Configuration

When you instantiate the kernel, you need to specify the configuration for each module as follows:

        const kernel = new Kernel();

        const testModuleConfiguration: ConfigurationDefinitionInterface = {
            test1Parameter: "NotDefault",
        };

        await kernel.init(module, [{
            moduleKeyname: module.keyname,
            configuration: testModuleConfiguration
        }]);

This is also in the configuration that you can use resolvers to convert or retrieve parameters from the environment variables,
your filesystem, AWS SSM, etc.

### Using a configuration parameter in your class

This is how you would inject a parameter in the constructor of one of your services

    @injectable()
    class TestConfigurationParameterInjectedInConstructor {
        public constructor(@inject("%test.test1Parameter%") public readonly test1Parameter: string, @inject("%test.test2Parameter%") public readonly test2Parameter: string,) {
        }
    }


---

## Configuration Resolvers

We have made it very easy to create your own `ConfigurationResolver`. A `ConfigurationResolver` allows you to retrieve configuration from the configuration parameters 
from the current environment and inject it into the controller. For example, you can easily create a 
`FileConfigurationResolver`(to have configuration parameters retrieved from a file), an 
`AwsSsmConfigurationResolver` (to have configuration parameters retrieved from AWS SSM) or anything else you can come up with.

To create a `ConfigurationResolver`, you simply inherit the `ResolverInterface`. Then, your user can easily use it when
they pass the configuration to the second argument of the init method in the Kernel.

