import {bodyMapping, bodyMappingDecoratorMetadataKeyname} from "./body-mapping.decorator";
import {MetadataUtil} from "@pristine-ts/common";
import {
    ClassTransformerBodyMappingContextInterface, DataMappingBuilderBodyMappingContextInterface,
    FunctionBodyMappingContextInterface
} from "../interfaces/body-mapping-context.interface";
import {DataMapper, DataMappingBuilder, LowercaseNormalizer} from "@pristine-ts/data-mapping";

class Class {}

describe("Body Mapping Decorator", () =>{
    it("should properly set the context for a ClassType", () => {
        class Test {
            @bodyMapping(Class)
            route() {}
        }

        const context: { [bodyMappingDecoratorMetadataKeyname]: ClassTransformerBodyMappingContextInterface } = MetadataUtil.getRouteContext(Test.prototype, "route");

        expect(context[bodyMappingDecoratorMetadataKeyname].type).toBe("classType");
        expect(context[bodyMappingDecoratorMetadataKeyname].classType).toBe(Class);
    })

    it("should properly set the context for a function", () => {
        const method:((body: any, dataMapper: DataMapper) => any) = (body) => {return {...body, "a": true}};

        class Test2 {
            @bodyMapping(method)
            route() {}
        }

        const context: { [bodyMappingDecoratorMetadataKeyname]: FunctionBodyMappingContextInterface } = MetadataUtil.getRouteContext(Test2.prototype, "route");

        expect(context[bodyMappingDecoratorMetadataKeyname].type).toBe("function");
        expect(context[bodyMappingDecoratorMetadataKeyname].function).toBe(method);
    })
    it("should properly set the context for a function", () => {
        const dataMappingBuilder = new DataMappingBuilder();

        dataMappingBuilder
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
            .add()
                .setSourceProperty("rank")
                .setDestinationProperty("position")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
            .add()
                .setSourceProperty("lastName")
                .setDestinationProperty("familyName")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
        .end()

        class Test3 {
            @bodyMapping({builder: dataMappingBuilder})
            route() {}
        }

        const context: { [bodyMappingDecoratorMetadataKeyname]: DataMappingBuilderBodyMappingContextInterface } = MetadataUtil.getRouteContext(Test3.prototype, "route");

        expect(context[bodyMappingDecoratorMetadataKeyname].type).toBe("DataMappingBuilder");
        expect(context[bodyMappingDecoratorMetadataKeyname].dataMappingBuilder).toBe(dataMappingBuilder);
    })
})