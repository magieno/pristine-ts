import {MatchTypeEnum} from "../enums/match-type.enum";
import {TypesEnum} from "../enums/types.enum";
import {FileInfoInterface} from "../interfaces/file-info.interface";
import {DirectoryListResultEnum} from "../enums/directory-list-result.enum";

export interface DirectoryListOptions {
  /**
   * The Match type specifies how matching is done.
   *      "BASE": Means you're matching the base filename without the extension and without the path such as "results"
   *      "EXT": Means you're matching file extensions (without leading ".")  such as "jpeg"
   *      "FILE_NAME": Means you're matching the base filename and extension  such as "results.jpeg"
   */
  matchType?: MatchTypeEnum;

  /**
   * (defaults to empty which matches everything)
   *      string means you're looking for an exact match with matchWhat setting
   *      regex is a regex that will be applied to the matchWhat setting
   *      function is a custom callback function - callback({filename, basename, ext, fullPath, type})
   *             return true to include in results
   *             return false to exclude from results
   *             can return a promise that will be awaited to resolve to true|false
   *             promise rejecting aborts the whole process
   */
  match?: string | RegExp | ((file: FileInfoInterface) => boolean | Promise<boolean>);

  /**
   * matchCaseInsensitive: true|false (defaults to true)
   * Only applies when match is a string
   */
  matchCaseInsensitive?: boolean

  /**
   *    recurse: true|false|function   (defaults to false)
   *        true is recurse into sub-directories
   *        false is no recurse
   *        function is to call this function on each sub-directory
   *            return true = recurse into this sub-directory
   *            return false = don't recurse into this sub-directory
   *            callback({filename, basename, ext, fullPath, type})
   *            can return a promise that will be awaited to resolve to true|false
   *            promise rejecting aborts the whole process
   */
  recurse?: true | false | ((file: FileInfoInterface) => boolean | Promise<boolean>);

  /**
   * Types determines what is being returned or listed.
   *    types: "files"|"dirs"|"both"   (defaults to "files")
   *        files is return only files (skip directories)
   *        dirs is return only directories (skip files)
   *        both is to return both files and directories
   */
  types?: TypesEnum;

  /**
   *    resultType: "objects"|"names"   (defaults to "names")
   *        objects is array of {filename, basename, ext, fullPath, type} objects
   *        fulLPath is array of fullPath strings
   */
  resultType?: DirectoryListResultEnum;

  /**
   *    skipTopLevelFiles: true|false    (defaults to false)
   *        only process directories on the top level, skip top level files
   */
  skipTopLevelFiles?: boolean;

  /**
   * results (optional)
   *        If you pass an array into options.results, then this function call will add items to that array
   *        If you don't pass an array, a new array will be created
   *        The populated array will be the resolved value of the promise that is returned
   */
  results?: (string | FileInfoInterface)[];
}