import {VoteEnum} from "../enums/vote.enum";
import {IdentityInterface} from "./identity.interface";

export interface VoterInterface {
    supports(resource: object): boolean;

    vote(identity: IdentityInterface, action: string, resource: object): Promise<VoteEnum>;
}
