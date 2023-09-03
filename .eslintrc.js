
module.exports = {
    root: true,
    env: {
        node: true,
        es2020: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "jsconfig.json",
        ecmaVersion: 2020,
        sourceType: "module",
        createDefaultProgram: true
    },
    ignorePatterns: [
        "**/test-fixture/**/*.js",
        "*.json",
        "**/node_modules/**",
        "**/.eslint*",
        "dist/**",
        "**/examples/**",
        "**/.vscode-test/**"
    ],
    settings: {
      jsdoc: {
        mode: "typescript",
        tagNamePreference: {
            virtual: "virtual",
            augments: "extends"
        }
      }
    },
    overrides: [
    {
        files: [
            "**/*.js",
            "**/*.d.ts"
        ],
        excludedFiles: [
            "*.json",
            "node_modules/**",
            "**/node_modules/**"
        ]
    }],
    plugins: [
        "eslint-plugin-jsdoc",
        "eslint-plugin-no-null",
        "eslint-plugin-import",
        "eslint-plugin-prefer-arrow",
        "anti-trojan-source",
        "@spmeesseman/eslint-plugin",
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    globals: {
        __WPBUILD__: "readonly"
    },
    rules: {
        "@spmeesseman/extjs-array-bracket-newline": 1,
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
        "jsdoc/check-alignment": 0, // Recommended | and i recommend this doesn't work half the time and is annoying as s***
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
        "jsdoc/require-jsdoc": 0, // Recommended
        "jsdoc/require-param": 0, // Recommended
        "jsdoc/require-param-description": 0, // Recommended
        "jsdoc/require-param-name": 1, // Recommended
        "jsdoc/require-param-type": 0, // Recommended
        "jsdoc/require-property": 1, // Recommended
        "jsdoc/require-property-description": 0, // Recommended
        "jsdoc/require-property-name": 1, // Recommended
        "jsdoc/require-property-type": 1, // Recommended
        "jsdoc/require-returns": 1, // Recommended
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
        "quotes": [
            "warn",
            "double",
            {
                avoidEscape: true
            }
        ],
        "radix": "off",
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
        "valid-typeof": "off",
        
        "@typescript-eslint/adjacent-overload-signatures": "warn",
        "@typescript-eslint/array-type": [
            "warn",
            {
                default: "array"
            }
        ],
        "@typescript-eslint/ban-types": [
            "warn",
            {
                types: {
                    Object: {
                        message: "Avoid using the `Object` type. Did you mean `object`?"
                    },
                    Function: {
                        message: "Avoid using the `Function` type. Prefer a specific function type, like `() => void`, or use `ts.AnyFunction`."
                    },
                    Boolean: {
                        message: "Avoid using the `Boolean` type. Did you mean `boolean`?"
                    },
                    Number: {
                        message: "Avoid using the `Number` type. Did you mean `number`?"
                    },
                    String: {
                        message: "Avoid using the `String` type. Did you mean `string`?"
                    }
                }
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/consistent-type-definitions": "warn",
        "@typescript-eslint/dot-notation": "warn",
        "@typescript-eslint/explicit-member-accessibility": [
            "off",
            {
                accessibility: "explicit"
            }
        ],
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/member-delimiter-style": [
            "warn",
            {
                multiline: {
                    delimiter: "semi",
                    requireLast: true
                },
                singleline: {
                    delimiter: "semi",
                    requireLast: false
                }
            }
        ],
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "warn",
        "@typescript-eslint/no-misused-new": "warn",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-shadow": [
            "off",
            {
                hoist: "all"
            }
        ],
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-unnecessary-qualifier": "warn",
        "@typescript-eslint/no-unnecessary-type-assertion": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/prefer-for-of": "off",
        "@typescript-eslint/prefer-function-type": "warn",
        "@typescript-eslint/prefer-namespace-keyword": "warn",
        "@typescript-eslint/quotes": [
            "warn",
            "double",
            {
                avoidEscape: true
            }
        ],
        "@typescript-eslint/semi": [
            "warn",
            "always"
        ],
        "@typescript-eslint/triple-slash-reference": [
            "off",
            {
                path: "always",
                types: "prefer-import",
                lib: "always"
            }
        ],
        "@typescript-eslint/type-annotation-spacing": "warn",
        "@typescript-eslint/unified-signatures": "warn",
    }
};
