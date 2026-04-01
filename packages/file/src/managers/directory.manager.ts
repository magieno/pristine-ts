import "reflect-metadata"
import {injectable} from "tsyringe";
import {DirectoryListOptions} from "../options/directory-list.options";
import {FileInfoInterface} from "../interfaces/file-info.interface";
import {MatchTypeEnum} from "../enums/match-type.enum";
import {TypesEnum} from "../enums/types.enum";
import {DirectoryListResultEnum} from "../enums/directory-list-result.enum";
import fs, {promises as fsp} from "fs";
import path from "path";
import {DirectoryCopyOptions} from "../options/directory-copy.options";
import {FileManager} from "./file.manager";

@injectable()
export class DirectoryManager {

  constructor(private readonly fileManager: FileManager) {
  }

  /**
   *    If you just call list(someDir) with no options, it just gets you
   *    and array of all the full path filenames in an array
   *    You add match options to limit what it returns
   *    You add the type option to limit it to only files or directories or specify you want both
   *
   * @param directory
   * @param options
   */
  list(directory: string, options?: DirectoryListOptions): Promise<(string | FileInfoInterface)[]> {
    // initialization here that does not need to be done on recursive calls

    // make copy of options object and initialize defaults
    // we put results array in the options so it can be passed into the recursive calls and
    //    they can just add to the same array rather than having to merge arrays
    const defaults: DirectoryListOptions = {
      matchType: MatchTypeEnum.Extension,
      types: TypesEnum.File,
      resultType: DirectoryListResultEnum.FilePath,
      results: [],
    };

    if (options !== undefined) {
      if (typeof options.match === "string") {
        defaults.matchCaseInsensitive = true;
      } else {
        if (options.matchCaseInsensitive) {
          throw new TypeError("When trying to list the files, options.matchCaseInsensitive can only be specified when options.match is a string");
        }
      }
    }

    options = Object.assign(defaults, options);

    if (typeof options.match === "object" && !(options.match instanceof RegExp)) {
      throw new TypeError("If options.match is an object it must be a RegExp object");
    }

    if (options.match && typeof options.match === "string" && options.matchCaseInsensitive) {
      options.match = options.match.toLowerCase();
    }

    // force dir to be absolute path
    let src = directory;
    if (!path.isAbsolute(src)) {
      src = path.resolve(src);
    }

    return this.listRecursively(src, options);
  }

  async copy(sourceDir: string, destDir: string, options?: DirectoryCopyOptions): Promise<void> {
    const directories = await this.list(sourceDir, {
      resultType: DirectoryListResultEnum.FileInfoObject,
      ...options
    });

    // For each files and directories listed, we copy them to the destination directory
    for (const file of directories) {
      const srcPath = (file as FileInfoInterface).fullPath;
      const destPath = path.join(destDir, path.relative(sourceDir, srcPath));

      // Create the destination directory if it doesn't exist
      await fsp.mkdir(path.dirname(destPath), {recursive: true});

      // Inform the monitor that a file is being copied
      options?.monitor?.(file as FileInfoInterface);

      if ((options?.replaceOperations?.length ?? 0) > 0) {
        await this.fileManager.replaceInFile(srcPath, options?.replaceOperations ?? [], {outputFilePath: destPath});
      } else {
        // Copy the file
        await fsp.copyFile(srcPath, destPath);
      }
    }
  }

  exists(filePath: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.access(filePath, err => {
        if (err) {
          return resolve(false);
        }

        return resolve(true);
      })
    })
  }

  private async listRecursively(dir: string, options: DirectoryListOptions) {

    // collect sub-directories for possible recursion
    const dirs = [];

    const files = await fsp.readdir(dir, {withFileTypes: true});
    for (const dirEnt of files) {
      const filename = dirEnt.name;
      const fullPath = path.join(dir, filename);
      const ext = path.extname(filename).slice(1);                  // file extension without leading "."
      let basename = filename;
      if (ext.length) {
        basename = filename.slice(0, -(ext.length + 1));          // get part without the extension
      }

      // put all this in an object for later use
      const obj: FileInfoInterface = {filename, basename, extension: ext, fullPath, type: ""};

      // get type of entry
      let type = "<unknown>";
      let include = false;
      if (dirEnt.isFile()) {
        type = "file";
        include = options.types === TypesEnum.File || options.types === TypesEnum.ALL;
      } else if (dirEnt.isDirectory()) {
        type = "dir";
        include = options.types === TypesEnum.Directory || options.types === TypesEnum.ALL;
        dirs.push(obj);             // save dir for recursion option
      }
      obj.type = type;

      if (!include) {
        continue;           // skip further processing for this file/dir
      }

      // see if we should skip top level files
      if (options.skipTopLevelFiles && type === "file") {
        continue;
      }

      // if doing matching
      if (options.match) {
        let target;
        if (options.matchType === MatchTypeEnum.Extension) {
          target = ext;
        } else if (options.matchType === MatchTypeEnum.Base) {
          target = basename;
        } else if (options.matchType === MatchTypeEnum.Filename) {
          target = filename;
        } else if (options.matchType === MatchTypeEnum.Path) {
          target = fullPath;
        } else {
          throw new Error(`When trying to list the files, options.matchType contains invalid value "${options.matchType}", should be "MatchTypeEnum.Extension", "MatchTypeEnum.Base" or "MatchTypeEnum.Filename"`);
        }
        switch (typeof options.match) {
          case "string":
            // require exact match to target, skip if no match
            if (options.matchCaseInsensitive) {
              target = target.toLowerCase();
            }
            if (options.match !== target) continue;
            break;
          case "object":
            // compare with regex, skip if no match
            if (!options.match.test(target)) continue;
            break;
          case "function":
            // custom filter function, if doesn't return true, skip this item
            if (!(await options.match(obj))) continue;
            break;
          default:
            throw new TypeError(`When trying to list the files, options.match contains invalid value, should be a string, regex or function`);
        }
      }

      if (Array.isArray(options.results) === false || options.results === undefined) {
        options.results = [];
      }

      // passed all the tests, add the summary object to the results
      if (options.resultType === DirectoryListResultEnum.FileInfoObject) {
        options.results.push(obj);
      } else {
        options.results.push(fullPath);
      }

    }
    if (options.recurse) {
      options.skipTopLevelFiles = false;        // turn this off for recursion
      for (const d of dirs) {
        let include = true;
        if (typeof options.recurse === "function") {
          include = await options.recurse(d);
        }
        if (include) {
          await this.listRecursively(d.fullPath, options);
        }
      }
    }
    return options.results ?? [];
  }
}