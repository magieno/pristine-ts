import {AppModuleInterface} from "@pristine-ts/common";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {DataMappingModule} from "@pristine-ts/data-mapping";
import {AutoDataMappingBuilder, DataMapper} from "@pristine-ts/data-mapping-common";

const moduleTest: AppModuleInterface = {
    keyname: "Module",
    importModules: [
        CoreModule,
        DataMappingModule,
    ],
    importServices: [],
}

class Dog {
    name: string;
    age: number;
}

describe("Data Mapping", () => {
    it("should be able to instantiate AutoDataMappingBuilder", async () => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const autoDataMappingBuilder = kernel.container.resolve(AutoDataMappingBuilder)

        expect(autoDataMappingBuilder).toBeInstanceOf(AutoDataMappingBuilder);
    })

    it("should be able to instantiate DataMapper", async () => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const dataMapper = kernel.container.resolve(DataMapper)

        expect(dataMapper).toBeInstanceOf(DataMapper);

        expect(dataMapper["dataNormalizers"].length).toBe(5);
        expect(dataMapper["dataTransformerInterceptors"].length).toBe(1);
    })

    it("should automap an object to a class", async () => {
        const kernel = new Kernel();
        await kernel.start(moduleTest, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const dataMapper = kernel.container.resolve(DataMapper)

        const dog = {
            name: "Spike",
            age: 3,
        }

        const mappedDog = await dataMapper.autoMap(dog, Dog);

        expect(mappedDog).toBeInstanceOf(Dog);
        expect(mappedDog.name).toBe("Spike");
        expect(mappedDog.age).toBe(3);
    })
})
