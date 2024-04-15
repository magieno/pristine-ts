import "reflect-metadata"
import {injectable} from "tsyringe";
import {FileCursorInterface} from "../interfaces/file-cursor.interface";
import fs from "fs";
import * as readline from "readline";
import {DirectoryListOptions} from "../options/directory-list.options";
import {FileInfoInterface} from "../interfaces/file-info.interface";

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
                if(typeof search === "string") {
                    position = line.indexOf(search, position);
                } else {
                    const lineToSearch = line.substring(position);
                    const substrPosition = lineToSearch.search(search);

                    if(substrPosition !== -1) {
                        // Need to add the new position to the current position else we will return the wrong position
                        position += substrPosition;
                    } else {
                        position = -1;
                    }
                }

                // If the search string is found, simply add its position
                if(position !== -1) {
                    fileCursors.push({line: lineIndex, position, lineText: line})

                    // Increment the position to continue the search.
                    position++;
                }
            } while (position != -1 || position >= line.length)
        }

        return fileCursors;
    }

    readFile(filePath: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(filePath, async (err, data) => {
                if(err) {
                    return reject(err);
                }

                return resolve(data);
            })
        })
    }

    exists(filePath: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.access(filePath, err => {
                if(err) {
                    return resolve(false);
                }

                return resolve(true);
            })
        })
    }
}
