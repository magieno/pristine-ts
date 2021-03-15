import "reflect-metadata"
import {Utils} from "./utils";

describe("Utils", () => {

    it("should truncate if object deeper than max depth", async () => {

        const object = {
            bonjour: {
                allo: {
                    bye: "byebye",
                    date: new Date(1615830493000),
                }
            }
        };

        expect(Utils.truncate(object, 1)).toEqual({});
        expect(Utils.truncate(object, 2)).toEqual({bonjour:{}});
        expect(Utils.truncate(object, 3)).toEqual({bonjour:{allo:{bye:"byebye", date: new Date(1615830493000)}}});
        expect(Utils.truncate(object, 4)).toEqual({bonjour:{allo:{bye:"byebye", date: new Date(1615830493000)}}});
    });

});
