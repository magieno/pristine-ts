import {ResolverInterface} from "@pristine-ts/common";
import {ClassConstructor} from "class-transformer";
import {ConfigurationResolverError} from "../../../configuration/src/errors/configuration-resolver.error";
import {DataMapper} from "@pristine-ts/data-mapping-common";
import {readFile} from "fs/promises";
import {existsSync} from "node:fs";
import {Validator} from "@pristine-ts/class-validator";

/**
 * This class is a resolver that is used to resolve the configuration coming from a file.

 */
export class FileResolver<Options> implements ResolverInterface<Options> {
    constructor(
        private readonly dataMapper: DataMapper,
        private readonly validator: Validator,
        private readonly options: {
        filename: string | ResolverInterface<string>,
        classType: ClassConstructor<Options>,
    }) {
    }

    private async resolveFilename(value:  string | ResolverInterface<string>): Promise<string> {
        if(typeof value === "string") {
            return value;
        }

        if(typeof value === "object" && typeof value.resolve === "function") {
            return this.resolveFilename(await value.resolve());
        }

        throw new ConfigurationResolverError("Cannot resolve the value passed. It isn't of type string or ResolverInterface.", value);
    }

    async resolve(): Promise<Options> {
        const filename = await this.resolveFilename(this.options.filename);

        if(existsSync(filename) === false) {
            throw new ConfigurationResolverError("The file doesn't exist.", filename);
        }

        const content = await readFile(filename, {encoding: "utf-8"});

        let options;

        try {
            options = await this.dataMapper.autoMap(JSON.parse(content), this.options.classType);
        } catch (error) {
            throw new ConfigurationResolverError("The content of the file is not valid.", content);
        }

        // Validate the options
        const errors = await this.validator.validate(options);

        if(errors.length > 0) {
            throw new ConfigurationResolverError("There are errors in the configuration.", content);
        }

        return options;
    }
}