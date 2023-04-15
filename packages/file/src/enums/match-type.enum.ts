export enum MatchTypeEnum {
    Base = "BASE", // Means you're matching the base filename without the extension and without the path such as "results"
    Extension = "EXT", // Means you're matching file extensions (without leading ".")  such as "jpeg"
    Filename = "FILE_NAME", // Means you're matching the base filename and extension  such as "results.jpeg"
}