export interface ReplaceInFileOperationInterface {
  /**
   * The search string or regex to find in the file.
   */
  search: string | RegExp;

  /**
   * The replacement string or function to replace the found string.
   */
  replace: string | ((substring: string, ...args: any[]) => string);
}