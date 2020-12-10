import {Kernel} from "../src/kernel";
import {ResolvedClassModel} from "./models/resolved-class.model";
import {testModule} from "./test.module";


describe("Kernel.ts", () => {
    it("should test the Kernel", async () => {
        const kernel = new Kernel();
        await kernel.init(testModule);

        const resolvedClassModel = kernel.container.resolve<ResolvedClassModel>(ResolvedClassModel);
        const resolvedClassModel2 = kernel.container.resolveAll("allo");

        expect(resolvedClassModel.getRandomNumber()).toBeGreaterThan(0);
    })
})