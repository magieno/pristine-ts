import {IsString} from "class-validator";
export class BodyOptions {
    @IsString()
    demo: string
}
