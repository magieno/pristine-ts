export class CommandEventPayload {
  arguments: { [key in string]: string | number | boolean | (string)[] } = {};

  constructor(public name: string, public scriptPath: string) {
  }
}