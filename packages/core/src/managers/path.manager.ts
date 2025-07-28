import {injectable} from "tsyringe";
import {PathAlreadyContainsFilenameError} from "../errors/path-already-contains-filename.error";

@injectable()
export class PathManager {
  getCurrentExecutionDirectory(): string {
    return process.cwd();
  }

  getPathRelativeToCurrentExecutionDirectory(path: string, filename?: string): string {
    const currentExecutionDirectory = this.getCurrentExecutionDirectory();

    // If it starts with a "/", remove this character.
    path = path.replace(/^\//, '');

    // If it ends with a "/", remove this character.
    path = path.replace(/\/$/, '');

    // If path already ends with a filename and a filename was also provided, throw an error
    if (filename) {
      if (path.match(/\.\w+$/)) {
        throw new PathAlreadyContainsFilenameError(`The path '${path}' already contains a filename. Cannot add filename: '${filename}'.`)
      }

      filename = filename.replace(/^\//, '');

      path += `/${filename}`
    }

    return currentExecutionDirectory + "/" + path;
  }
}