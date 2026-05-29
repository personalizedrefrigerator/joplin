const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const react = require("eslint-plugin-react");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const seiyabEslintPluginReactHooks = require("@seiyab/eslint-plugin-react-hooks");
const _import = require("eslint-plugin-import");
const promise = require("eslint-plugin-promise");
const jest = require("eslint-plugin-jest");
const github = require("eslint-plugin-github");

const {
    fixupPluginRules,
} = require("@eslint/compat");

const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");
const { readFileSync } = require("fs-extra");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

const ignoreFile = readFileSync(join(__dirname, '.eslintignore'), 'utf-8');

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            "Atomics": "readonly",
            "SharedArrayBuffer": "readonly",
            "BufferEncoding": "readonly",
            "AsyncIterable": "readonly",
            "FileSystemFileHandle": "readonly",
            "FileSystemDirectoryHandle": "readonly",
            "ReadableStreamDefaultReader": "readonly",
            "FileSystemCreateWritableOptions": "readonly",
            "FileSystemHandle": "readonly",
            "IDBTransactionMode": "readonly",
            "FlatArray": "readonly",
            "BigInt": "readonly",
            "globalThis": "readonly",
            "ExtendableEvent": "readonly",
            "WindowClient": "readonly",
            "FetchEvent": "readonly",
            "test": "readonly",
            "expect": "readonly",
            "describe": "readonly",
            "it": "readonly",
            "beforeAll": "readonly",
            "afterAll": "readonly",
            "beforeEach": "readonly",
            "afterEach": "readonly",
            "jest": "readonly",
            "__DEV__": "readonly",
            "browserSupportsPromises_": true,
            "chrome": "readonly",
            "browser": "readonly",
            "onDocumentReady": "readonly",
            "setupPasswordStrengthHandler": "readonly",
            "$": "readonly",
            "zxcvbn": "readonly",
            "tinymce": "readonly",
            "JSX": "readonly",
            "NodeJS": "readonly",
        },

        parser: tsParser,
        "ecmaVersion": 2018,
        "sourceType": "module",

        parserOptions: {
            "ecmaFeatures": {
                "jsx": true,
            },
        },
    },

    extends: compat.extends("eslint:recommended"),

    "settings": {
        "react": {
            "version": "16.12",
        },
    },

    "rules": {
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",

        "no-unused-vars": ["error", {
            "argsIgnorePattern": "^_",
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            "argsIgnorePattern": "^_",
        }],

        "@typescript-eslint/explicit-member-accessibility": "off",
        "no-constant-condition": 0,
        "no-prototype-builtins": 0,
        "require-atomic-updates": 0,
        "prefer-const": ["error"],
        "no-var": ["error"],
        "no-new-func": ["error"],
        "import/prefer-default-export": ["error"],

        "prefer-promise-reject-errors": ["error", {
            allowEmptyReject: true,
        }],

        "no-throw-literal": ["error"],
        "no-unused-expressions": ["error"],
        "no-array-constructor": ["error"],
        "radix": ["error"],
        "eqeqeq": ["error", "always"],

        "no-console": ["error", {
            "allow": ["warn", "error"],
        }],

        "@seiyab/react-hooks/rules-of-hooks": "error",

        "@seiyab/react-hooks/exhaustive-deps": ["error", {
            "ignoreThisDependency": "props",
        }],

        "jest/require-top-level-describe": ["error", {
            "maxNumberOfTopLevelDescribes": 1,
        }],

        "jest/no-identical-title": ["error"],

        "jest/prefer-lowercase-title": ["error", {
            "ignoreTopLevelDescribe": true,
        }],

        "promise/prefer-await-to-then": "error",
        "no-unneeded-ternary": "error",
        "github/array-foreach": ["error"],

        "no-restricted-properties": ["error", {
            "property": "focus",
            "message": "Please use focusHandler::focus() instead",
        }, {
            "property": "blur",
            "message": "Please use focusHandler::blur() instead",
        }],

        "@typescript-eslint/no-explicit-any": ["error"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": ["error"],
        "curly": ["error", "multi-line", "consistent"],
        "semi": ["error", "always"],
        "eol-last": ["error", "always"],
        "quotes": ["error", "single"],
        "indent": ["error", "tab"],

        "comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "functions": "always-multiline",
        }],

        "comma-spacing": ["error", {
            "before": false,
            "after": true,
        }],

        "no-trailing-spaces": "error",
        "linebreak-style": ["error", "unix"],
        "prefer-template": ["error"],
        "template-curly-spacing": ["error", "never"],
        "object-curly-spacing": ["error", "always"],
        "array-bracket-spacing": ["error", "never"],

        "key-spacing": ["error", {
            "beforeColon": false,
            "afterColon": true,
            "mode": "strict",
        }],

        "block-spacing": ["error"],

        "brace-style": ["error", "1tbs", {
            "allowSingleLine": true,
        }],

        "no-spaced-func": ["error"],
        "func-call-spacing": ["error"],

        "space-before-function-paren": ["error", {
            "anonymous": "never",
            "named": "never",
            "asyncArrow": "always",
        }],

        "multiline-comment-style": ["error", "separate-lines", {
            checkJSDoc: true,
        }],

        "space-before-blocks": "error",
        "spaced-comment": ["error", "always"],

        "keyword-spacing": ["error", {
            "before": true,
            "after": true,
        }],

        "no-multi-spaces": ["error"],
        "prefer-object-spread": ["error"],

        "prefer-regex-literals": ["error", {
            disallowRedundantWrapping: true,
        }],

        "id-denylist": ["error", "err", "notebook", "notebooks"],
        "prefer-arrow-callback": ["error"],
        "no-constant-binary-expression": ["error"],
    },

    plugins: {
        react,
        "@typescript-eslint": typescriptEslint,
        "@seiyab/react-hooks": seiyabEslintPluginReactHooks,
        import: fixupPluginRules(_import),
        promise,
        jest,
        github,
    },
}, {
    files: [
        "packages/tools/**",
        "packages/app-mobile/tools/**",
        "packages/app-desktop/tools/**",
    ],

    "rules": {
        "no-console": "off",
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
        parserOptions: {
            "project": "./tsconfig.eslint.json",
        },
    },

    "rules": {
        "@typescript-eslint/indent": ["error", "tab", {
            "ignoredNodes": ["TSUnionType"],
        }],

        "@typescript-eslint/ban-ts-comment": ["error"],
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/explicit-member-accessibility": ["error"],

        "@typescript-eslint/type-annotation-spacing": ["error", {
            "before": false,
            "after": true,
        }],

        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/no-inferrable-types": ["error"],

        "@typescript-eslint/comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "enums": "always-multiline",
            "generics": "always-multiline",
            "tuples": "always-multiline",
            "functions": "always-multiline",
        }],

        "@typescript-eslint/object-curly-spacing": ["error", "always"],
        "@typescript-eslint/semi": ["error", "always"],

        "@typescript-eslint/member-delimiter-style": ["error", {
            "multiline": {
                "delimiter": "semi",
                "requireLast": true,
            },

            "singleline": {
                "delimiter": "semi",
                "requireLast": false,
            },
        }],

        "@typescript-eslint/no-floating-promises": ["error"],

        "@typescript-eslint/naming-convention": ["error", {
            selector: "enumMember",
            format: ["StrictPascalCase"],
        }, {
            selector: "enumMember",
            format: null,

            "filter": {
                "regex": "^(GET|POST|PUT|DELETE|PATCH|HEAD|SQLite|PostgreSQL|ASC|DESC|E2EE|OR|AND|UNION|INTERSECT|EXCLUSION|INCLUSION|EUR|GBP|USD|SJCL.*|iOS)$",
                "match": true,
            },
        }, {
            selector: "enumMember",
            format: null,

            "filter": {
                "regex": "^(sha1|sha256|sha384|sha512|AES_128_GCM|AES_192_GCM|AES_256_GCM)$",
                "match": true,
            },
        }, {
            selector: "interface",
            format: ["StrictPascalCase"],
        }, {
            selector: "interface",
            format: null,

            "filter": {
                "regex": "^(RSA|RSAKeyPair|iOS.*)$",
                "match": true,
            },
        }],
    },
}, globalIgnores(
    ignoreFile
        .split('\n')
        .filter(entry => !entry.startsWith('#') && !!entry.trim())
)]);
