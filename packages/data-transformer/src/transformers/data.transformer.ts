import {injectable} from "tsyringe";
import {tag} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";

@tag(DataTransformerModuleKeyname)
@injectable()
export class DataTransformer {

}