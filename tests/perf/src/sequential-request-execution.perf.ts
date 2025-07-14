import "reflect-metadata"
import {container} from "tsyringe";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {perfModule} from "./perf.module";
import {HttpMethod, Request, Response} from "@pristine-ts/common";
import {RouterInterface} from "@pristine-ts/networking";

describe("Sequential request execution", () => {
    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should calculate how quickly a request can be handled by directly passing a Request", async () => {
        // Run it a 1000 time to ensure that it's not a fluke
        const totalTimes: number[] = [];
        const instantiationExecutionTimes: number[] = [];
        const requestExecutionTimes: number[] = [];

        for (let i = 0; i < 1000; i++) {
            container.clearInstances();
            let start = process.hrtime();
            const kernel = new Kernel();
            await kernel.start(perfModule, {
                "pristine.logging.consoleLoggerActivated": false,
                "pristine.logging.fileLoggerActivated": false,
            });

            const instantiationTimeElapsedInMiliseconds = process.hrtime(start)[1] / 1000000;
            instantiationExecutionTimes.push(instantiationTimeElapsedInMiliseconds);

            start = process.hrtime();
            const response = await kernel.handle(new Request(HttpMethod.Get, "/api/1.0/dogs", "uuid"), {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

            const requestExecutionTimeElapsedInMiliseconds = process.hrtime(start)[1] / 1000000;
            requestExecutionTimes.push(requestExecutionTimeElapsedInMiliseconds);

            const timeElapsedInMiliseconds = instantiationTimeElapsedInMiliseconds + requestExecutionTimeElapsedInMiliseconds;
            totalTimes.push(timeElapsedInMiliseconds);

            console.log("Instantiation execution time: " + instantiationTimeElapsedInMiliseconds + "ms.");
            console.log("Request execution time: " + requestExecutionTimeElapsedInMiliseconds + "ms.");
            console.log("Total time: " + timeElapsedInMiliseconds + "ms.");
            console.log("Number of services: " + perfModule.importServices.length + ".");
            expect(timeElapsedInMiliseconds).toBeLessThan(150);

            expect(response.status).toBe(200)
        }

        const averageInstantiationTime = instantiationExecutionTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / totalTimes.length;
        const averageRequestExecutionTime = requestExecutionTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / totalTimes.length;
        const averageTotalElapsedTime = totalTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / totalTimes.length;

        console.log("Average Instantiation time: " + averageInstantiationTime + "ms.")
        console.log("Average Request execution time: " + averageRequestExecutionTime + "ms.")
        console.log("Average Total time: " + averageTotalElapsedTime + "ms.")
        expect(averageTotalElapsedTime).toBeLessThan(75)
    })

    it("should calculate how quickly a request can be handled after the kernel has already been instantiated", async () => {
        // Run it a 1000 time to ensure that it's not a fluke
        const requestExecutionTimes: number[] = [];

        const kernel = new Kernel();
        await kernel.start(perfModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.logging.fileLoggerActivated": false,
        });

        for (let i = 0; i < 1000; i++) {
            let start = process.hrtime();

            const response = await kernel.handle(new Request(HttpMethod.Get, "/api/1.0/dogs", "uuid"), {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;

            const requestExecutionTimeElapsedInMiliseconds = process.hrtime(start)[1] / 1000000;
            requestExecutionTimes.push(requestExecutionTimeElapsedInMiliseconds);

            console.log("Request execution time: " + requestExecutionTimeElapsedInMiliseconds + "ms.");

            expect(response.status).toBe(200)
        }

        const averageRequestExecutionTime = requestExecutionTimes.reduce((previousValue, currentValue) => previousValue + currentValue) / requestExecutionTimes.length;

        requestExecutionTimes.sort((a, b) => a-b);

        console.log("Average Request execution time: " + averageRequestExecutionTime + "ms.")
        console.log("Minimum Request execution time: " + requestExecutionTimes[0] + "ms.")
        console.log("Maximum Request execution time: " + requestExecutionTimes[requestExecutionTimes.length - 1] + "ms.")
        expect(averageRequestExecutionTime).toBeLessThan(75)
    })

    // it("should calculate how quickly a request can be handled by using ExpressJS", async () => {
    //     //todo
    // })
})
