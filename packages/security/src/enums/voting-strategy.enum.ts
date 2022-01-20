/**
 * The voting strategy enum defines the different strategies that the permission manager uses to
 * merge the results of all the voter.
 */
export enum VotingStrategyEnum {
    GrantOnUnanimousAbstention = "GRANT_ON_UNANIMOUS_ABSTENTION",
    DenyOnUnanimousAbstention = "DENY_ON_UNANIMOUS_ABSTENTION"
}
