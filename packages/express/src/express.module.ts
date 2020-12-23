// import {ModuleInterface} from "@pristine-ts/core";
// import {CoreModule} from "@pristine-ts/core";

import {RequestMapper} from "./mappers/request.mapper";
import {HttpHeadersMapper} from "./mappers/http-headers.mapper";
import {MethodMapper} from "./mappers/method.mapper";
import {ResponseMapper} from "./mappers/response.mapper";
import {CoreModule, ModuleInterface} from "@pristine-ts/core";

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