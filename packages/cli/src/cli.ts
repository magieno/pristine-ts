import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {loadAppModule} from "./bootstrap/app-module-loader";

export const bootstrap = async () => {
  const {appModule, configuration} = await loadAppModule();

  const kernel = new Kernel();
  await kernel.start(appModule, configuration);

  await kernel.handle(process.argv, {keyname: ExecutionContextKeynameEnum.Cli, context: null});
}

bootstrap();
