import {inject, injectable, injectAll} from "tsyringe";
import {VoterInterface} from "../interfaces/voter.interface";

@injectable()
export class PermissionManager {
    public constructor(@injectAll("voter") private readonly voters: VoterInterface[]) {
    }
}