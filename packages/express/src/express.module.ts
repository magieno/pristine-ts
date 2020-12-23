// import {ModuleInterface} from "@pristine-ts/core";
// import {CoreModule} from "@pristine-ts/core";

import {ModuleInterface} from "../../core/src/interfaces/module.interface";
import {CoreModule} from "../../core/src/core.module";
import {RequestMapper} from "./mappers/request.mapper";
import {HttpHeadersMapper} from "./mappers/http-headers.mapper";
import {MethodMapper} from "./mappers/method.mapper";
import {ResponseMapper} from "./mappers/response.mapper";

export const ExpressModule: ModuleInterface = {
    importServices: [
        RequestMapper,
        HttpHeadersMapper,
        MethodMapper,
        ResponseMapper,
    ],
    importModules: [
        CoreModule,
    ]
}

// Mappers
export * from "./mappers/mappers";