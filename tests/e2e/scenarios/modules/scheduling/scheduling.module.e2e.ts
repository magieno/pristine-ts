import "reflect-metadata"
import {container} from "tsyringe";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {AppModuleInterface} from "@pristine-ts/common";
import {SchedulerManager, SchedulingModule} from "@pristine-ts/scheduling";

describe("Schedulinng Module instantiation in the Kernel", () => {

    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should instantiate the scheduling module", async () => {
        const kernel = new Kernel();
        await kernel.start({
            keyname: "e2e.scheduling",
            importServices: [
            ],
            importModules: [SchedulingModule],
            providerRegistrations: []
        } as AppModuleInterface, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        expect(true).toBeTruthy();
    });

    it('should instantiate all the services', async() => {
        const kernel = new Kernel();
        await kernel.start({
            keyname: "e2e.scheduling",
            importServices: [
            ],
            importModules: [SchedulingModule],
            providerRegistrations: []
        } as AppModuleInterface, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        const services = [
            SchedulerManager,
        ];

        services.forEach(service => {
            expect(() => kernel.container.resolve(service)).not.toThrow();
        })
    });
});
