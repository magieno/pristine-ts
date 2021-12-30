import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  traceId?: string;
  date: Date = new Date();
  module: string = "application";
  extra: any;

  constructor(public severity: SeverityEnum, public message: string, public kernelInstantiationId: string) {
  }
  
}
