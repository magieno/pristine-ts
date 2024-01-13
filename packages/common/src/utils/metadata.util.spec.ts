import "reflect-metadata"
import {MetadataUtil} from "./metadata.util";

class EmptyClass {}

class ClassWithEmptyMethod {
    emptyMethod() {}
}

describe("Metadata Util", () =>{
    it('should properly retrieve the method parameters metadata', () => {
        const methodParameters = MetadataUtil.getMethodParametersMetadata(ClassWithEmptyMethod, "emptyMethod")
        expect(Array.isArray(methodParameters)).toBeTruthy()
        expect(methodParameters.length).toBe(0)
    })

    it("should properly set the parameters metadata in order", () => {
        MetadataUtil.setMethodParameterArgumentMetadata(ClassWithEmptyMethod, "emptyMethod", 4, "fourthParameter");
        MetadataUtil.setMethodParameterArgumentMetadata(ClassWithEmptyMethod, "emptyMethod", 3, "thirdParameter");
        MetadataUtil.setMethodParameterArgumentMetadata(ClassWithEmptyMethod, "emptyMethod", 2, "secondParameter");
        MetadataUtil.setMethodParameterArgumentMetadata(ClassWithEmptyMethod, "emptyMethod", 1, "firstParameter");

        const methodParameters = MetadataUtil.getMethodParametersMetadata(ClassWithEmptyMethod, "emptyMethod")

        expect(Array.isArray(methodParameters)).toBeTruthy()
        expect(methodParameters.length).toBe(5)
        expect(methodParameters[0]).toBeUndefined()
        expect(methodParameters[1]).toBe('firstParameter')
        expect(methodParameters[2]).toBe('secondParameter')
        expect(methodParameters[3]).toBe('thirdParameter')
        expect(methodParameters[4]).toBe('fourthParameter')
    })

    it("should retrieve the RouteContext", () => {
        const routeContextAtTargetLevel = MetadataUtil.getRouteContext(ClassWithEmptyMethod);

        expect(typeof routeContextAtTargetLevel).toBe("object")
        expect(Object.keys(routeContextAtTargetLevel).length).toBe(0)

        const routeContextAtPropertyLevel = MetadataUtil.getRouteContext(ClassWithEmptyMethod, "emptyMethod");

        expect(typeof routeContextAtPropertyLevel).toBe("object")
        expect(Object.keys(routeContextAtPropertyLevel).length).toBe(0)
    })

    it("should set to the RouteContext", () => {
        MetadataUtil.setToRouteContext("keyname", "value", ClassWithEmptyMethod);

        const routeContextAtTargetLevel = MetadataUtil.getRouteContext(ClassWithEmptyMethod);

        expect(typeof routeContextAtTargetLevel).toBe("object");
        expect(Object.keys(routeContextAtTargetLevel).length).toBe(1)
        expect(routeContextAtTargetLevel["keyname"]).toBe("value")


        MetadataUtil.setToRouteContext("keyname1", "value1", ClassWithEmptyMethod, "emptyMethod");

        const routeContextAtPropertyLevel = MetadataUtil.getRouteContext(ClassWithEmptyMethod, "emptyMethod");

        expect(typeof routeContextAtPropertyLevel).toBe("object");
        expect(Object.keys(routeContextAtPropertyLevel).length).toBe(1)
        expect(routeContextAtPropertyLevel["keyname1"]).toBe("value1")
    })

    it("should append to the Target metadata", () => {
        MetadataUtil.appendToTargetMetadata(ClassWithEmptyMethod, "keyname", "firstValue")
        MetadataUtil.appendToTargetMetadata(ClassWithEmptyMethod, "keyname", "secondValue")

        const array = Reflect.getMetadata("keyname", ClassWithEmptyMethod);
        expect(Array.isArray(array)).toBeTruthy()
        expect(array.length).toBe(2)
        expect(array[0]).toBe("firstValue")
        expect(array[1]).toBe("secondValue")
    })
})