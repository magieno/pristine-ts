/**
 * The voting strategy enum defines the different strategies that the permission manager uses to
 * merge the results of all the voter.
 */
export enum VotingStrategyEnum {
  /**
   * When all the voters abstain from voting, the access is granted.
   */
  GrantOnUnanimousAbstention = "GRANT_ON_UNANIMOUS_ABSTENTION",

  /**
   * When all the voters abstain from voting, the access is denied.
   */
  DenyOnUnanimousAbstention = "DENY_ON_UNANIMOUS_ABSTENTION"
}
