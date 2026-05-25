import "reflect-metadata";
import {CommandEventMapper} from "./command-event.mapper";
import {EventIdManager, ExecutionContextKeynameEnum} from "@pristine-ts/core";
import {EventIdGenerationStyleEnum} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";

const fakeEventIdManager = new EventIdManager(EventIdGenerationStyleEnum.Uuid);

describe('Command Event Mapper', function () {
  it("should properly map the arguments", async () => {
    const commandEventMapper = new CommandEventMapper(fakeEventIdManager);
    const mapped = await commandEventMapper.map(["node", "/path/to/pristine", "name", "parameter", "value"], {
      keyname: ExecutionContextKeynameEnum.Cli,
      context: {}
    });

    const commandEventPayload: CommandEventPayload = mapped.events[0].payload;
    expect(commandEventPayload.arguments.parameter).toBeTruthy()
    expect(commandEventPayload.arguments.value).toBeTruthy()
  })

  it("should properly map the '--' arguments", async () => {
    const commandEventMapper = new CommandEventMapper(fakeEventIdManager);

    const consoleArguments = [
      ["--parameter", "value"],
      ["--parameter=value"],
      ["-parameter", "value"],
    ];

    for (let i = 0; i < consoleArguments.length; i++) {
      const args = consoleArguments[i];
      const mapped = await commandEventMapper.map(["node", "/path/to/pristine", "name"].concat(...args), {
        keyname: ExecutionContextKeynameEnum.Cli,
        context: {}
      });

      const commandEventPayload: CommandEventPayload = mapped.events[0].payload;

      expect(commandEventPayload instanceof CommandEventPayload).toBeTruthy()
      expect(commandEventPayload.name).toBe("name")
      expect(commandEventPayload.scriptPath).toBe("/path/to/pristine")
      expect(commandEventPayload.arguments.parameter).toBe("value")
    }
  })
  it("should properly map multiple '--' arguments with the same name into an array", async () => {
    const commandEventMapper = new CommandEventMapper(fakeEventIdManager);

    const mapped = await commandEventMapper.map(["node", "/path/to/pristine", "name", "--parameter=value1", "--parameter=value2"], {
      keyname: ExecutionContextKeynameEnum.Cli,
      context: {}
    });

    const commandEventPayload: CommandEventPayload = mapped.events[0].payload;

    expect(commandEventPayload instanceof CommandEventPayload).toBeTruthy()
    expect(commandEventPayload.name).toBe("name")
    expect(commandEventPayload.scriptPath).toBe("/path/to/pristine")
    expect(Array.isArray(commandEventPayload.arguments.parameter)).toBeTruthy()
    expect((commandEventPayload.arguments.parameter as string[]).length).toBe(2)
    expect((commandEventPayload.arguments.parameter as string[])[0]).toBe("value1")
    expect((commandEventPayload.arguments.parameter as string[])[1]).toBe("value2")
  })


  describe("supportsMapping", () => {
    const mapper = new CommandEventMapper(fakeEventIdManager);

    it("matches argv that names a command under the Cli keyname", () => {
      expect(mapper.supportsMapping(["node", "pristine", "build"], {
        keyname: ExecutionContextKeynameEnum.Cli,
        context: {},
      })).toBe(true);
    });

    it("rejects no-command argv so ReplStartEventMapper can claim it", () => {
      expect(mapper.supportsMapping(["node", "pristine"], {
        keyname: ExecutionContextKeynameEnum.Cli,
        context: {},
      })).toBe(false);
    });

    it("rejects the bare `repl` command so ReplStartEventMapper can claim it", () => {
      expect(mapper.supportsMapping(["node", "pristine", "repl"], {
        keyname: ExecutionContextKeynameEnum.Cli,
        context: {},
      })).toBe(false);
    });

    it("rejects unrelated execution-context keynames", () => {
      expect(mapper.supportsMapping(["node", "pristine", "build"], {
        keyname: ExecutionContextKeynameEnum.Http,
        context: {},
      })).toBe(false);
    });
  });

  it("should properly transform booleans, numbers and strings into their intended representation", async () => {
    const commandEventMapper = new CommandEventMapper(fakeEventIdManager);

    const consoleArguments = [
      {args: ["--parameter", "true"], expectedValue: true},
      {args: ["--parameter", "TRUE"], expectedValue: true},
      {args: ["--parameter", "false"], expectedValue: false},
      {args: ["--parameter", "FALSE"], expectedValue: false},
      {args: ["--parameter", "1.05"], expectedValue: 1.05},
      {args: ["--parameter", "54"], expectedValue: 54},
      {args: ["--parameter", "allo", "--parameter", "secondAllo"], expectedValue: ["allo", "secondAllo"]},
      {args: ["--parameter", "A sentence"], expectedValue: "A sentence"},
    ];

    for (let i = 0; i < consoleArguments.length; i++) {
      const args = consoleArguments[i].args;
      const mapped = await commandEventMapper.map(["node", "/path/to/pristine", "name"].concat(...args), {
        keyname: ExecutionContextKeynameEnum.Cli,
        context: {}
      });
      expect(mapped.events[0].payload.arguments.parameter).toStrictEqual(consoleArguments[i].expectedValue)
    }
  })
});