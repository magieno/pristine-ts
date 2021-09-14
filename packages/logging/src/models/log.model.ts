import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  date: Date = new Date();
  module: string = "application";
  message: string;
  extra: any;
  severity: SeverityEnum
}
