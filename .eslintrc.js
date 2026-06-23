module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended"
    ],

    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "no-throw-literal": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        '@typescript-eslint/ban-ts-comment': [
            'error',
            {'ts-ignore': 'allow-with-description'},
        ],
        "@typescript-eslint/no-empty-function": "off",
        // `ban-types` was removed in @typescript-eslint v8 and split into
        // dedicated rules. The only customization here was allowing the
        // `Function` type, so we simply disable its replacement rule.
        "@typescript-eslint/no-unsafe-function-type": "off",
        // Empty interfaces are used intentionally as declaration-merging
        // extension points (e.g. PristineConfigurationValueMap), so allow
        // them while still flagging the empty `{}` object type.
        "@typescript-eslint/no-empty-object-type": ["error", {"allowInterfaces": "always"}],
        // The codebase relies on the `cond && sideEffect()` short-circuit idiom,
        // which v8's recommended config flags via no-unused-expressions.
        "@typescript-eslint/no-unused-expressions": ["error", {"allowShortCircuit": true, "allowTernary": true}]
    }
}

