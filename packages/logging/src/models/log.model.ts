import {SeverityEnum} from "../enums/severity.enum";

export class LogModel {
  message: string;
  identity: any;
  extra: any;
  severity: SeverityEnum
}
