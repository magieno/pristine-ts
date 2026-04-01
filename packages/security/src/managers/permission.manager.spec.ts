import "reflect-metadata";
import {PermissionManager} from "./permission.manager";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {ResourceActionEnum} from "../enums/resource-action.enum";
import {VotingStrategyEnum} from "../enums/voting-strategy.enum";
import {VoteEnum} from "../enums/vote.enum";
import {VoterInterface} from "../interfaces/voter.interface";
import {IdentityInterface} from "@pristine-ts/common";

class Resource {
  private property: string;
}

const voterDeny: VoterInterface = {
  supports(resource: object): boolean {
    return resource instanceof Resource;
  },
  async vote(identity: IdentityInterface, action: string, resource: object): Promise<VoteEnum> {
    return VoteEnum.Deny
  }
}

const voterGrant: VoterInterface = {
  supports(resource: object): boolean {
    return resource instanceof Resource;
  },
  async vote(identity: IdentityInterface, action: string, resource: object): Promise<VoteEnum> {
    return VoteEnum.Grant
  }
}

describe("", () => {
  const logHandlerMock: LogHandlerInterface = {
    critical(message: string, extra?: any): void {
    }, debug(message: string, extra?: any): void {
    }, error(message: string, extra?: any): void {
    }, info(message: string, extra?: any): void {
    }, notice(message: string, extra?: any): void {
    }, warning(message: string, extra?: any): void {
    }, terminate() {
    }
  }

  it("should return deny if no voter and DenyOnUnanimousAbstention", async () => {
    const permissionManager = new PermissionManager([], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(false);
  });

  it("should return granted if no voter and GrantOnUnanimousAbstention", async () => {

    const permissionManager = new PermissionManager([], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(true);
  });

  it("should return deny if no voter supports and DenyOnUnanimousAbstention", async () => {
    const permissionManager = new PermissionManager([voterGrant, voterGrant], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(false);
  });

  it("should return granted if no voter supports and GrantOnUnanimousAbstention", async () => {
    const permissionManager = new PermissionManager([voterGrant, voterGrant], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(true);
  });

  it("should return granted if all voter grant", async () => {
    const permissionManager = new PermissionManager([voterGrant, voterGrant], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(true);
    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(true);
  });

  it("should return deny if 1 voter deny", async () => {
    const permissionManager = new PermissionManager([voterGrant, voterDeny], logHandlerMock)

    const identity: IdentityInterface = {
      id: "id",
      claims: {
        roles: ["USER"]
      }
    }

    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(false);
    expect(await permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(false);
  });
})
