/**
 * The resource action enum specifies the most common actions that can be taken on a resource.
 * It's used in the voters to validate if a user is authorized to execute that action.
 * More actions can be defined in more specified enum based on the resource type.
 */
export enum ResourceActionEnum {
    List = "LIST",
    Read = "READ",
    Create = "CREATE",
    Update = "UPDATE",
    Delete = "DELETE"
}
