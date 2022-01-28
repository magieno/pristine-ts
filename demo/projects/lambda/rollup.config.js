import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';
import ignore from 'rollup-plugin-ignore';
import json from "@rollup/plugin-json";

export default {
    input: 'dist/lambda.js',
    output: {
        dir: 'dist/bundle/',
        format: 'cjs',
        exports: "auto",
        compact: true,
    },
    external: [
    ],
    plugins: [
        // Aws-crt needs to be ignored because it appeared in this file https://github.com/aws/aws-sdk-js-v3/blob/main/packages/util-user-agent-node/src/is-crt-available.ts
        // between versions 3.29.0 and 3.37.0.
        ignore(["aws-crt", "@aws-sdk/signature-v4-crt"]),
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs({
            transformMixedEsModules: true,
        }),
        json(),
        cleanup({
            "comments": "none",
        }),
    ]
};