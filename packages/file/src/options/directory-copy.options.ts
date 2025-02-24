import {DirectoryListOptions} from "./directory-list.options";
import {ReplaceInFileOperationInterface} from "../interfaces/replace-in-file-operation.interface";
import {FileInfoInterface} from "../interfaces/file-info.interface";

export interface DirectoryCopyOptions extends Omit<DirectoryListOptions, "types" | "resultType" | "results">{
    replaceOperations?: ReplaceInFileOperationInterface[];

    monitor?: (file: FileInfoInterface) => void;
}