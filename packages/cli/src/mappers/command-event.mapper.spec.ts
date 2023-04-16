import {CommandEventMapper} from "./command-event.mapper";
import {ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";

describe('Command Event Mapper', function () {
    it("should properly map the arguments", async () => {
        const commandEventMapper = new CommandEventMapper();
        const mapped = await commandEventMapper.map(["node", "scriptFilePath", "name", "parameter", "value"], {keyname: ExecutionContextKeynameEnum.Cli, context: {}});

        const commandEventPayload: CommandEventPayload = mapped.events[0].payload;
        expect(commandEventPayload.arguments.parameter).toBeTruthy()
        expect(commandEventPayload.arguments.value).toBeTruthy()
    })

    it("should properly map the '--' arguments", async () => {
        const commandEventMapper = new CommandEventMapper();

        const consoleArguments = [
            ["--parameter", "value"],
            ["-parameter", "value"],
        ];

        for (let i = 0; i < consoleArguments.length; i++){
            const args = consoleArguments[i];
            const mapped = await commandEventMapper.map(["node", "scriptFilePath", "name"].concat(...args), {keyname: ExecutionContextKeynameEnum.Cli, context: {}});

            const commandEventPayload: CommandEventPayload = mapped.events[0].payload;

            expect(commandEventPayload instanceof CommandEventPayload).toBeTruthy()
            expect(commandEventPayload.name).toBe("name")
            expect(commandEventPayload.scriptPath).toBe("scriptFilePath")
            expect(commandEventPayload.arguments.parameter).toBe("value")
        }
    })


    it("should properly transform booleans, numbers and strings into their intended representation", async () => {
        const commandEventMapper = new CommandEventMapper();

        const consoleArguments = [
                {args:["--parameter", "true"], expectedValue: true},
                {args:["--parameter", "TRUE"], expectedValue: true},
                {args:["--parameter", "false"], expectedValue: false},
                {args:["--parameter", "FALSE"], expectedValue: false},
                {args:["--parameter", "1.05"], expectedValue: 1.05},
                {args:["--parameter", "54"], expectedValue: 54},
                {args:["--parameter", "A sentence"], expectedValue: "A sentence"},
        ];

        for (let i = 0; i < consoleArguments.length; i++){
            const args = consoleArguments[i].args;
            const mapped = await commandEventMapper.map(["node", "scriptFilePath", "name"].concat(...args), {keyname: ExecutionContextKeynameEnum.Cli, context: {}});
            expect(mapped.events[0].payload.arguments.parameter).toBe(consoleArguments[i].expectedValue)
        }
    })
});