# CLI module


First thing, is map the raw nodejs command event to a Command Event.

Create a CLI Event Handler that will handle the Command Event. Internally, it will have all the commands injected in its constructor.

Each command will implement the CommandInterface.

The CliEventHandler will take the CommandEvent, determine to which Command it matches.

Then, it will validate that the arguments passed are valid.

If yes, then the `run` method of the Command with the proper arguments.


#Latest to do
Write a new regex that captures the parameters and their values in separate group

# How to use

```
    
    process.exit(await kernel.handle(process.argv, {keyname:ExecutionContextKeynameEnum.Cli}));
```
