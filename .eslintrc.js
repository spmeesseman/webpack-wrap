
module.exports = {
    root: true,
    env: {
        node: true,
        es2020: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        createDefaultProgram: true
    },
    ignorePatterns: [
        "**/test-fixture/**/*.js", "types/**", "*.json", "node_modules", "node_modules/**",
        "**/node_modules/**", "**/.eslint*", "dist/**", ".vscode-test/**", "**/webpack/**"
    ],
    overrides: [
    {
        files: [
            "**/*.js"
        ],
        excludedFiles: [
            "test-fixture/**", "types/**", "*.json","node_modules/**", "**/node_modules/**"
        ]
    }],
    plugins: [
        "eslint-plugin-jsdoc",
        "eslint-plugin-no-null",
        "eslint-plugin-import",
        "eslint-plugin-prefer-arrow",
        "anti-trojan-source",
        "@spmeesseman/eslint-plugin"
    ],
    globals: {
        __WPBUILD__: "readonly"
    },
    rules: {
        "@spmeesseman/extjs-array-bracket-newline": 1,
        "semi": [
            "warn",
            "always"
        ],
		"anti-trojan-source/no-bidi": "error",
        "array-bracket-spacing": [ 
            1, "always",
            {
                objectsInArrays: false,
                arraysInArrays: false,
                singleValue: true
            }
        ],
        "array-bracket-newline": [
            0, { multiline: true, minItems: 8 }
        ],
        "arrow-body-style": "off",
        "arrow-parens": [
            "off",
            "always"
        ],
        "brace-style": [
            "off",
            "1tbs"
        ],
        "comma-dangle": "warn",
        complexity: "off",
        "constructor-super": "warn",
        curly: [
            "warn",
            "multi-line"
        ],
        "eol-last": "off",
        eqeqeq: [
            "warn",
            "always"
        ],
        "guard-for-in": "error",
        "no-prototype-builtins": "warn",
        "id-blacklist": [
            "warn",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "warn",
        "import/no-extraneous-dependencies": [
            "warn", {
                devDependencies: ["**/*.test.ts", "**/*.spec.ts"]
            }
        ],
        "import/no-internal-modules": "off",
        "import/order": "off",
        indent: [
            "off", 4,
            {
                ArrayExpression: "off",
                ObjectExpression: "off",
                CallExpression: {arguments: "off"},
                MemberExpression: 0,
                FunctionExpression: {parameters: "first"},
                ignoredNodes: ["ConditionalExpression"],
                flatTernaryExpressions: false,
                VariableDeclarator: { var: 1, let: 1, const: 1 }
            }
        ],
        "jsdoc/check-access": 1, // Recommended
        "jsdoc/check-alignment": 1, // Recommended
        "jsdoc/check-examples": 0,
        "jsdoc/check-indentation": 0,
        "jsdoc/check-line-alignment": 1,
        "jsdoc/check-param-names": 1, // Recommended
        "jsdoc/check-property-names": 1, // Recommended
        "jsdoc/check-syntax": 1,
        "jsdoc/check-tag-names": 1, // Recommended
        "jsdoc/check-types": 1, // Recommended
        "jsdoc/check-values": 0, // Recommended
        "jsdoc/empty-tags": 1, // Recommended
        "jsdoc/implements-on-classes": 1, // Recommended
        "jsdoc/informative-docs": 1,
        "jsdoc/match-description": [
            "error",
            { matchDescription: '^\n?([A-Z`\\d_][\\s\\S]*\\s*)?$'
        }],
        "jsdoc/multiline-blocks": 1, // Recommended
        "jsdoc/no-bad-blocks": 1,
        "jsdoc/no-blank-block-descriptions": 1,
        "jsdoc/no-defaults": 1,
        "jsdoc/no-missing-syntax": 0,
        "jsdoc/no-multi-asterisks": 1, // Recommended
        "jsdoc/no-restricted-syntax": 0,
        "jsdoc/no-types": 0,
        "jsdoc/no-undefined-types": 1, // Recommended
        "jsdoc/require-asterisk-prefix": 1,
        "jsdoc/require-description": 0,
        "jsdoc/require-description-complete-sentence": 0,
        "jsdoc/require-example": 0,
        "jsdoc/require-file-overview": 0,
        "jsdoc/require-hyphen-before-param-description": 0,
        "jsdoc/require-jsdoc": 1, // Recommended
        "jsdoc/require-param": 0, // Recommended
        "jsdoc/require-param-description": 0, // Recommended
        "jsdoc/require-param-name": 1, // Recommended
        "jsdoc/require-param-type": 0, // Recommended
        "jsdoc/require-property": 1, // Recommended
        "jsdoc/require-property-description": 1, // Recommended
        "jsdoc/require-property-name": 1, // Recommended
        "jsdoc/require-property-type": 1, // Recommended
        "jsdoc/require-returns": 0, // Recommended
        "jsdoc/require-returns-check": 1, // Recommended
        "jsdoc/require-returns-description": 0, // Recommended
        "jsdoc/require-returns-type": 1, // Recommended
        "jsdoc/require-throws": 1,
        "jsdoc/require-yields": 1, // Recommended
        "jsdoc/require-yields-check": 1, // Recommended
        "jsdoc/sort-tags": 0,
        "jsdoc/tag-lines": 0, // Recommended
        "jsdoc/valid-types": 1,
        "key-spacing":"warn",
        "linebreak-style": "off",
        "max-classes-per-file": "off",
        "max-len": "off",
        "new-parens": "warn",
        "no-bitwise": "off",
        "no-caller": "warn",
        "no-cond-assign": "off",
        "no-console": "off",
        "no-debugger": "off",
        "no-duplicate-case": "warn",
        "no-duplicate-imports": "warn",
        "no-empty": "off",
        "no-eval": "warn",
        "no-extra-bind": "warn",
        "no-fallthrough": "warn",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": "off",
        "no-new-func": "warn",
        "no-new-wrappers": "warn",
        "no-null/no-null": "off",
        "no-redeclare": "warn",
        "no-return-await": "warn",
        "no-sequences": "off",
        "no-sparse-arrays": "warn",
        "no-template-curly-in-string": "warn",
        "no-throw-literal": "warn",
        "no-trailing-spaces": "warn",
        "no-undef-init": "warn",
        "no-underscore-dangle": "off",
        "no-unsafe-finally": "warn",
        "no-unused-labels": "warn",
        "no-var": "warn",
        "object-shorthand": "warn",
        "one-var": [
            "off",
            "never"
        ],
        "prefer-arrow/prefer-arrow-functions": "warn",
        "prefer-const": "warn",
        "prefer-object-spread": "off",
        "quote-props": [
            "warn",
            "consistent-as-needed"
        ],
        radix: "off",
        "space-before-function-paren": "off",
        "space-in-parens": [
            "warn",
            "never"
        ],
        "spaced-comment": [
            "warn",
            "always",
            {
                markers: [
                    "/"
                ]
            }
        ],
        "use-isnan": "warn",
        "valid-typeof": "off"
    }
};
