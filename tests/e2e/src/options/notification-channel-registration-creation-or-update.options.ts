import {IsEnum, IsNotEmpty, IsString} from "@pristine-ts/class-validator";

export class NotificationChannelRegistrationCreationOrUpdateOptions {
  @IsString()
  @IsNotEmpty()
  value: string;
}
