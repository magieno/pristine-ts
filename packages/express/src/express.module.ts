// import {ModuleInterface} from "@pristine-ts/core";
// import {CoreModule} from "@pristine-ts/core";

import {RequestMapper} from "./mappers/request.mapper";
import {HttpHeadersMapper} from "./mappers/http-headers.mapper";
import {MethodMapper} from "./mappers/method.mapper";
import {ResponseMapper} from "./mappers/response.mapper";
import {CoreModule} from "@pristine-ts/core";
import {ModuleInterface} from "@pristine-ts/common";
import {ExpressModuleKeyname} from "./express.module.keyname";

export const ExpressModule: ModuleInterface = {
    keyname: ExpressModuleKeyname,
    importModules: [
        CoreModule,
    ]
}

// Mappers
export * from "./mappers/mappers";

export * from "./express.module.keyname";
