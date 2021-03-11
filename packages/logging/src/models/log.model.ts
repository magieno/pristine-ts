import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  message: string;
  extra: any;
  severity: SeverityEnum
}
