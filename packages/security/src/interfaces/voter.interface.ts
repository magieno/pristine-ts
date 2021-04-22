import {VoteEnum} from "../enums/vote.enum";

export interface VoterInterface {
    supports(resource: object): boolean;

    vote(identity: any, action: string, resource: object): Promise<VoteEnum>;
}
