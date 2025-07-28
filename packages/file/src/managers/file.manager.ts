import "reflect-metadata"
import {injectable} from "tsyringe";
import {FileCursorInterface} from "../interfaces/file-cursor.interface";
import fs from "fs";
import * as readline from "readline";
import {ReplaceInFileInterface} from "../interfaces/replace-in-file.interface";
import {ReplaceInFileOperationInterface} from "../interfaces/replace-in-file-operation.interface";
import {writeFile} from "node:fs/promises";

@injectable()
export class FileManager {
  async findInFile(search: string | RegExp, filePath: string): Promise<FileCursorInterface[]> {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const fileCursors: FileCursorInterface[] = [];

    let lineIndex = -1;
    let position = 0;
    for await(const line of rl) {
      position = 0;
      lineIndex++;

      do {
        if (typeof search === "string") {
          position = line.indexOf(search, position);
        } else {
          const lineToSearch = line.substring(position);
          const substrPosition = lineToSearch.search(search);

          if (substrPosition !== -1) {
            // Need to add the new position to the current position else we will return the wrong position
            position += substrPosition;
          } else {
            position = -1;
          }
        }

        // If the search string is found, simply add its position
        if (position !== -1) {
          fileCursors.push({line: lineIndex, position, lineText: line})

          // Increment the position to continue the search.
          position++;
        }
      } while (position != -1 || position >= line.length)
    }

    return fileCursors;
  }

  async replaceInFile(inputFilePath: string, replaceOperations: ReplaceInFileOperationInterface[], options?: ReplaceInFileInterface): Promise<void> {
    const fileBuffer = await this.readFile(inputFilePath);

    // This isn't particularly efficient. Ideally, we would stream and track if we have found the first token in the regex so that we must append chunks while the regex isn't complete.
    // For now, we will load everything in memory.
    let fileContent = fileBuffer.toString("utf-8");

    replaceOperations.forEach(replaceOperation => {
      const search = replaceOperation.search;
      const replace = replaceOperation.replace;
      let regex: RegExp;

      if (typeof search === "string") {
        regex = new RegExp(search, "gim");
      } else {
        regex = search;
      }

      // @ts-expect-error: Replace is either a string or a function. When we check if it's a string or else
      // (by calling the same method with same parameters), it works. Therefore, this seems to be a bug in the typescript compiler.
      fileContent = fileContent.replace(regex, replace);
    });

    // Replace the content of the file
    let outputFilePath = inputFilePath;

    if (options?.outputFilePath) {
      outputFilePath = options.outputFilePath;
    }

    await writeFile(outputFilePath, fileContent);
  }

  readFile(filePath: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(filePath, async (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      })
    })
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
}
