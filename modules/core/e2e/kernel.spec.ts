import {Kernel} from "../src/kernel";
import {ResolvedClassModel} from "./models/resolved-class.model";
import {testModule} from "./test.module";
import {PermissionManager} from "./managers/permission.manager";
import {HttpMethod} from "../src/enums/http-method.enum";
import {Request} from "../src/network/request";


describe("Kernel.ts", () => {
    it("should test the Kernel", async () => {
        const kernel = new Kernel();
        await kernel.init(testModule);

        const resolvedClassModel = kernel.container.resolve<ResolvedClassModel>(ResolvedClassModel);
        const permissionManager = kernel.container.resolveAll(PermissionManager)

        // const response = await kernel.handleRequest(request);


        expect(resolvedClassModel.getRandomNumber()).toBeGreaterThan(0);
    })

    it("should load the controllers", async() => {
        const kernel = new Kernel();
        await kernel.init(testModule);

        // await kernel.handleRequest({
        //     url: "https://localhost:8080/api/2.0/services",
        //     httpMethod: HttpMethod.Get,
        // });

        await kernel.handleRequest({
            url: "https://localhost:8080/api/2.0/services/0a931a57-c238-4d07-ab5e-e51b10320997",
            httpMethod: HttpMethod.Put,
            body: {
                specialBody: "body"
            }
        });

        const a = 0;
    })
})