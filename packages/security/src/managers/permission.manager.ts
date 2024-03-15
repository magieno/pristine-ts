import {inject, injectable, injectAll} from "tsyringe";
import {VoterInterface} from "../interfaces/voter.interface";
import {VotingStrategyEnum} from "../enums/voting-strategy.enum";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {VoteEnum} from "../enums/vote.enum";
import {IdentityInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SecurityModuleKeyname} from "../security.module.keyname";

/**
 * The permission manager verifies if the correct permission are there to access and take an action on a resource.
 */
@injectable()
export class PermissionManager {

    /**
     * The permission manager verifies if the correct permission are there to access and take an action on a resource.
     * @param voters The voters that determine if access is granted.
     * All services with the tag ServiceDefinitionTagEnum.Voter will be injected here
     * @param logHandler The log handler to output logs.
     */
    public constructor(@injectAll(ServiceDefinitionTagEnum.Voter) private readonly voters: VoterInterface[],
                       @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * Returns whether or not the permission manager grants access to the resource.
     * @param identity The identity trying to have access to a resource.
     * @param action The action trying to be executed on the resource.
     * @param resource The resource being accessed.
     * @param votingStrategy The voting strategy that defines how to merge the votes. Default is DenyOnUnanimousAbstention.
     */
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

                const message = "PERMISSION MANAGER - [" + voter.constructor.name + "] - Decision: " + vote;

                if(vote === VoteEnum.Deny) { // When it's being denied, it usually mean that something is important to be noticed.
                    this.logHandler.info(message, {identity, action, resource, voter: voter.constructor.name}, SecurityModuleKeyname)
                }
                 else {
                    this.logHandler.debug("PERMISSION MANAGER - [" + voter.constructor.name + "] - Decision: " + vote, {identity, action, resource, voter: voter.constructor.name}, SecurityModuleKeyname );
                }

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
