import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  traceId?: string;
  date: Date = new Date();
  module: string = "application";
  extra: any;
  kernelInstantiationId?: string;

  constructor(public severity: SeverityEnum, public message: string) {
  }

}
