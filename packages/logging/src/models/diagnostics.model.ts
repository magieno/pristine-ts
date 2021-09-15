export class DiagnosticsModel {
    nodeVersion: string;
    stackTrace: {
        className: string;
        filename: string;
        line: string;
        column: string;
    }[] = [];
}