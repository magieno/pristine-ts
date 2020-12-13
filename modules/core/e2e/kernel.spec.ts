import {Kernel} from "../src/kernel";
import {ResolvedClassModel} from "./models/resolved-class.model";
import {testModule} from "./test.module";
import {PermissionManager} from "./managers/permission.manager";
import {TestController} from "./controllers/test.controller";


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

        kernel.setupRouter()
    })
})