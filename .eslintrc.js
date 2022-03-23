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
        "@typescript-eslint/ban-types": [
            'error',
            {
                "types": {
                    "Function": false,
                }
            }
        ]
    }
}
