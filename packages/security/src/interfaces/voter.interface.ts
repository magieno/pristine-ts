import {VoteEnum} from "../enums/vote.enum";
import {IdentityInterface} from "@pristine-ts/common";

/**
 * The voter interface defines what a voter should implement.
 * A voter is used to vote whether or not the identity should be allowed to execute an action on a resource.
 */
export interface VoterInterface {
  /**
   * Whether or not the voter supports that type of resource.
   * @param resource The resource.
   */
  supports(resource: object): boolean;

  /**
   * Votes on whether or not the identity should be allowed to execute an action on a resource.
   * @param identity The identity executing the action.
   * @param action The action that the identity is trying to execute.
   * @param resource The resource on which the action is executed.
   */
  vote(identity: IdentityInterface, action: string, resource: object): Promise<VoteEnum>;
}
