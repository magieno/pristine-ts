import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  date: Date;
  message: string;
  extra: any;
  severity: SeverityEnum
}
