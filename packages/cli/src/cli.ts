import {AppModuleInterface} from "@pristine-ts/common";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";

console.log("Pristine CLI")

const bootstrap = async () => {

   console.log(__dirname);
   console.log(process.cwd());

    // @ts-ignore
    const localAppModule: AppModuleInterface = await import(process.cwd() + "/dist/lib/cjs/app.module.js");

    const kernel = new Kernel();
    await kernel.start(localAppModule);

    await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null})
}

bootstrap();