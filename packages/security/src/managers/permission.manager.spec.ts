import "reflect-metadata";
import {PermissionManager} from "./permission.manager";
import {LogHandler} from "@pristine-ts/logging";
import {IdentityInterface} from "../interfaces/identity.interface";
import {ResourceActionEnum} from "../enums/resource-action.enum";
import {VotingStrategyEnum} from "../enums/voting-strategy.enum";
import {VoteEnum} from "../enums/vote.enum";
import {VoterInterface} from "../interfaces/voter.interface";

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

describe("", ()=> {
    it("should return deny if no voter and DenyOnUnanimousAbstention", async () => {
        const permissionManager = new PermissionManager([], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(VoteEnum.Deny);
    });

    it("should return granted if no voter and GrantOnUnanimousAbstention", async () => {
        const permissionManager = new PermissionManager([], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(VoteEnum.Grant);
    });

    it("should return deny if no voter supports and DenyOnUnanimousAbstention", async () => {
        const permissionManager = new PermissionManager([voterGrant, voterGrant], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(VoteEnum.Deny);
    });

    it("should return granted if no voter supports and GrantOnUnanimousAbstention", async () => {
        const permissionManager = new PermissionManager([voterGrant, voterGrant], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, {}, VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(VoteEnum.Grant);
    });

    it("should return granted if all voter grant", async () => {
        const permissionManager = new PermissionManager([voterGrant, voterGrant], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(VoteEnum.Grant);
        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(VoteEnum.Grant);
    });

    it("should return deny if 1 voter deny", async () => {
        const permissionManager = new PermissionManager([voterGrant, voterDeny], new LogHandler([]))

        const identity: IdentityInterface = {
            id: "id",
            claims: {
                roles: ["USER"]
            }
        }

        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.GrantOnUnanimousAbstention)).toBe(VoteEnum.Grant);
        expect(permissionManager.hasAccessToResource(identity, ResourceActionEnum.Read, new Resource(), VotingStrategyEnum.DenyOnUnanimousAbstention)).toBe(VoteEnum.Grant);
    });
})
