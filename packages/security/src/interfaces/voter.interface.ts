import {VoteEnum} from "../enums/vote.enum";
import {IdentityInterface} from "@pristine-ts/common";

export interface VoterInterface {
    supports(resource: object): boolean;

    vote(identity: IdentityInterface, action: string, resource: object): Promise<VoteEnum>;
}
