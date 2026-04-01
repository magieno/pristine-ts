# CLI module

The CLI Module allows you to create your own Commands by simply implementing the `CommandInterface`.

Then, you tag your class using the `@tag(ServiceDefinitionTagEnum.Command)` decorator.

You specify the expected arguments using an Options Class that is validated automatically for you using the
`class-validator` library.

You will need to modify your project's `package.json` by adding this:

```

...
"pristine": {
    "appModule": {
        "cjsPath": "RELATIVE_PATH_TO_YOUR_MODULE_COMPILE_FOR_CJS"
    }
}
...

```

Then, you add your command to the `package.json` such as:

```
  "scripts": {
  ...
    "cli": "pristine YOUR_COMMAND_HERE YOUR_ARGUMENTS_HERE"
  ...
  },

```