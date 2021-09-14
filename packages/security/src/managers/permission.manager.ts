import {injectable, injectAll, inject} from "tsyringe";
import {VoterInterface} from "../interfaces/voter.interface";
import {VotingStrategyEnum} from "../enums/voting-strategy.enum";
import {LogHandler, LogHandlerInterface} from "@pristine-ts/logging";
import {VoteEnum} from "../enums/vote.enum";
import {IdentityInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "../security.module.keyname";

@injectable()
export class PermissionManager {
    public constructor(@injectAll(ServiceDefinitionTagEnum.Voter) private readonly voters: VoterInterface[],
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    async hasAccessToResource(identity: IdentityInterface, action: string, resource: object, votingStrategy: VotingStrategyEnum = VotingStrategyEnum.DenyOnUnanimousAbstention): Promise<boolean>{

        if(this.voters.length === 0){
            this.logHandler.warning("PERMISSION MANAGER - No voters were found.", {
                identity,
                action,
                resource,
            }, SecurityModuleKeyname);
        }

        const votes: VoteEnum[] = [];

        for(const voter of this.voters) {
            if(voter.supports(resource) === false) {
                this.logHandler.debug("PERMISSION MANAGER - [" + voter.constructor.name + "] - Doesn't support this resource.", {identity, action, resource, voter: voter.constructor.name}, SecurityModuleKeyname );
                continue;
            }

            try {
                const vote = await voter.vote(identity, action, resource);
                this.logHandler.debug("PERMISSION MANAGER - [" + voter.constructor.name + "] - Decision: " + vote, {identity, action, resource, voter: voter.constructor.name}, SecurityModuleKeyname );

                votes.push(vote);
            } catch (error) {
                this.logHandler.error("Error while voting", {error, resource, voter: voter.constructor.name}, SecurityModuleKeyname);
                throw error;
            }

        }

        let shouldGrantAccess: boolean = !votes.includes(VoteEnum.Deny);

        if (votingStrategy === VotingStrategyEnum.DenyOnUnanimousAbstention ){
            if(votes.length === 0 || votes.every((vote) => vote === VoteEnum.Abstain)){
                shouldGrantAccess = false;
            }
        }

        this.logHandler.info("PERMISSION MANAGER - " + (shouldGrantAccess ? "GRANTED" : "DENIED") + " - Resource: " + resource.constructor.name, {identity, action, resource}, SecurityModuleKeyname);

        return shouldGrantAccess;
    }
}
