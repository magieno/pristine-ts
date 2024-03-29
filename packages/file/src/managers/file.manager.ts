import "reflect-metadata"
import {injectable} from "tsyringe";
import {FileCursorInterface} from "../interfaces/file-cursor.interface";
import fs from "fs";
import * as readline from "readline";

@injectable()
export class FileManager {
    async findInFile(search: string, filePath: string): Promise<FileCursorInterface[]> {
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
                position = line.indexOf(search, position);

                // If the search string is found, simply add its position
                if(position !== -1) {
                    fileCursors.push({line: lineIndex, position, lineText: line})

                    // Move the position by the length of the search term.
                    position += search.length;
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