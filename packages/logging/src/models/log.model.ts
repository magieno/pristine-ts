import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  date: Date = new Date();
  message: string;
  extra: any;
  severity: SeverityEnum
}
