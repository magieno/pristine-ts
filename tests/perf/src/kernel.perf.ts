import "reflect-metadata"
import {container, DependencyContainer, inject, injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {perfModule} from "./perf.module";

describe("Kernel.ts", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should how quick the kernel can be instantiated", async () => {
        // Run it a 1000 time to ensure that it's not a fluke
        const elapsedTimes: number[] = [];
        for (let i = 0; i < 1000; i++) {
            container.clearInstances();
            var start = process.hrtime();
            const kernel = new Kernel();
            await kernel.init(perfModule);
            await kernel["setupRouter"]();

            const timeElapsedInMiliseconds = process.hrtime(start)[1] / 1000000;
            elapsedTimes.push(timeElapsedInMiliseconds);

            console.log("Initialization time: " + timeElapsedInMiliseconds + "ms.");
            console.log("Number of services: " + perfModule.importServices.length + ".");
            expect(timeElapsedInMiliseconds).toBeLessThan(150);

            // Verify that the routes are properly parsed.
            // @ts-ignore
            expect(kernel["router"].root.children[0].children[0].children.length).toBe(perfModule.importServices.length)
        }

        const averageElapsedTime = elapsedTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / elapsedTimes.length;

        console.log("Average Elapsed time: " + averageElapsedTime + "ms.")
        expect(averageElapsedTime).toBeLessThan(75)
    })
})
