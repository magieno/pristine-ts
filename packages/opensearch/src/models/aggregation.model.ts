export class Aggregation {
    name: string = "";
    term: string = "";
    size: number = 10;
    sortOn: "_term" | "_count" = "_term";
    sortOrder: "asc" | "desc" = "asc";
}
