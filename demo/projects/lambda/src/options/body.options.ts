import {IsString} from "@pristine-ts/class-validator";
export class BodyOptions {
    @IsString()
    demo: string
}
