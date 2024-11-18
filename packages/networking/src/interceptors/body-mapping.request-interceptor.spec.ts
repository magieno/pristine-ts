import {BodyMappingRequestInterceptor} from "./body-mapping.request-interceptor";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpMethod, Request} from "@pristine-ts/common";
import {Type} from "class-transformer";
import {bodyMappingDecoratorMetadataKeyname} from "../decorators/body-mapping.decorator";
import {
    ClassTransformerBodyMappingContextInterface, DataMappingBuilderBodyMappingContextInterface,
    FunctionBodyMappingContextInterface
} from "../interfaces/body-mapping-context.interface";
import {classMetadata, property} from "@pristine-ts/metadata";
import {
    AutoDataMappingBuilder, DataMapper,
    DataMappingBuilder, DateNormalizer,
    LowercaseNormalizer, LowercaseNormalizerUniqueKey, NumberNormalizer,
    StringNormalizer
} from "@pristine-ts/data-mapping";
import {Route} from "../models/route";
import {MethodRouterNode} from "../nodes/method-router.node";

const mockLogHandler: LogHandlerInterface = {
    critical(message: string, extra?: any, module?: string): void {
    }, debug(message: string, extra?: any, module?: string): void {
    }, error(message: string, extra?: any, module?: string): void {
    }, info(message: string, extra?: any, module?: string): void {
    }, terminate(): void {
    }, warning(message: string, extra?: any, module?: string): void {
    }

}

describe("Body Mapping Request Interceptor", () => {
    it("should map a body when a class is passed", async () => {
        @classMetadata()
        class Nested {
            @property()
            nestedProperty: string;
        }

        @classMetadata()
        class Test {
            @property()
            nested: Nested;

            @property()
            date: Date;
        }

        const request: Request = new Request(HttpMethod.Get, "");
        request.body = {
            "nested": {
                "nestedProperty": "nested",
            },
            "date": "2023-12-01",
        }

        const bodyMappingRequestInterceptor = new BodyMappingRequestInterceptor(mockLogHandler, new DataMapper(new AutoDataMappingBuilder(), [new StringNormalizer(), new NumberNormalizer(), new DateNormalizer()], []));
        const route = new Route(null, "");
        route.context = {};
        route.context[bodyMappingDecoratorMetadataKeyname] = {
            type: "classType",
            classType: Test,
        } as ClassTransformerBodyMappingContextInterface;

        // @ts-ignore
        const methodNode = new MethodRouterNode(undefined, HttpMethod.Get, route, 0);

        const request2 = await bodyMappingRequestInterceptor.interceptRequest(request, methodNode);
        expect(request2.body instanceof Test).toBeTruthy()
        expect(request2.body.nested instanceof Nested).toBeTruthy()
        expect(request2.body.date instanceof Date).toBeTruthy()
    })
    it("should map a body when a function is passed", async () => {
        const spy = jest.fn();

        const bodyMapping = async (body: any) => {
            spy();
            return new Date();
        }

        const request: Request = new Request(HttpMethod.Get, "");
        request.body = {
            "nested": {
                "nestedProperty": "nested",
            },
            "date": "2023-12-01",
        }

        const bodyMappingRequestInterceptor = new BodyMappingRequestInterceptor(mockLogHandler, new DataMapper(new AutoDataMappingBuilder(), [], []));
        const route = new Route(null, "");
        route.context = {};
        route.context[bodyMappingDecoratorMetadataKeyname] = {
            type: "function",
            function: bodyMapping,
        } as FunctionBodyMappingContextInterface;

        // @ts-ignore
        const methodNode = new MethodRouterNode(undefined, HttpMethod.Get, route, 0);

        const request2 = await bodyMappingRequestInterceptor.interceptRequest(request, methodNode);
        expect(request2.body instanceof Date).toBeTruthy()
        expect(spy).toHaveBeenCalled()
    })

    it("should map a body when a DataMappingBuilder is passed", async () => {
        class Test {
            name: string;

            position: number;
        }

        const request: Request = new Request(HttpMethod.Get, "");
        request.body = {
            "title": "The Title",
            "rank": 2,
        }

        const dataMappingBuilder = new DataMappingBuilder();

        dataMappingBuilder
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .addNormalizer(LowercaseNormalizerUniqueKey)
            .end()
            .add()
                .setSourceProperty("rank")
                .setDestinationProperty("position")
            .end()
        .end()

        const bodyMappingRequestInterceptor = new BodyMappingRequestInterceptor(mockLogHandler, new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []));
        const route = new Route(null, "");
        route.context = {};
        route.context[bodyMappingDecoratorMetadataKeyname] = {
            type: "DataMappingBuilder",
            dataMappingBuilder,
            destination: Test,
        } as DataMappingBuilderBodyMappingContextInterface;

        // @ts-ignore
        const methodNode = new MethodRouterNode(undefined, HttpMethod.Get, route, 0);

        const request2 = await bodyMappingRequestInterceptor.interceptRequest(request, methodNode);
        expect(request2.body instanceof Test).toBeTruthy()
        expect(request2.body.name).toBe("the title")
        expect(request2.body.position).toBe(2)
    })
})