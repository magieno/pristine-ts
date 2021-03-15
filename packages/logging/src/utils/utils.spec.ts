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

    it("should consider string as a flat type", async () => {

        const object = {
            bonjour: "allo",
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:"allo"});
    });

    it("should consider a number as a flat type", async () => {

        const object = {
            bonjour: 42,
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:42});
    });


    it("should consider a boolean as a flat type", async () => {

        const object = {
            bonjour: true,
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:true});
    });

    it("should consider a date as a flat type", async () => {

        const object = {
            bonjour: new Date(1615830493000),
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:new Date(1615830493000)});
    });

});
