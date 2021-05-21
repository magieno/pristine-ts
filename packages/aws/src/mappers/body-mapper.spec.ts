import "reflect-metadata"
import {BodyMapper} from "./body-mapper";

describe("Body mapper", () => {

    it("should return proper body", () => {
        const bodyMapper = new BodyMapper();

        // @ts-ignore
        expect(bodyMapper.map(undefined)).toEqual(undefined);
        expect(bodyMapper.map("hello")).toEqual("hello");
        expect(bodyMapper.map(JSON.stringify({hello: 'allo'}))).toEqual({hello: 'allo'});
    })

})
