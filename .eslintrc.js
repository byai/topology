module.exports = {
    env: {
        browser: true,
        es6: true
    },
    settings: {
        "import/extensions": [".ts", ".tsx"],
        "import/resolver": {
            typescript: {}
        },
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"]
        }
    },
    parser: "@typescript-eslint/parser",
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jsx-a11y/recommended",
        "airbnb"
    ],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
    },
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 2018,
        sourceType: "module",
        errorOnTypeScriptSyntaticAndSemanticIssues: false
    },
    plugins: ["react", "import", "jsx-a11y", "@typescript-eslint"],
    rules: {
        indent: ["error", 4, { SwitchCase: 1 }],
        "max-len": ["error", { code: 150 }],
        "react/sort-comp": 0,
        "react/prop-types": 0,
        "import/no-unresolved": 0,
        "import/no-cycle": 0,
        "react/jsx-indent": ["error", 4],
        "react/no-did-update-set-state": 0,
        "react/jsx-indent-props": ["error", 4],
        "react/prefer-stateless-function": 0,
        "jsx-a11y/click-events-have-key-events": 0,
        "jsx-a11y/no-static-element-interactions": 0,
        "no-use-before-define": ["error", { functions: false }],
        "@typescript-eslint/no-use-before-define": [
            "error",
            { functions: false }
        ],
        "react/jsx-filename-extension": [1, { extensions: [".ts", ".tsx"] }],
        "@typescript-eslint/no-empty-interface": 0,
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/explicit-member-accessibility": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-object-literal-type-assertion": 0,
        "@typescript-eslint/no-unused-vars": [
            "error",
            { vars: "all", args: "after-used", ignoreRestSiblings: true }
        ],
        "quotes": 0,
        "comma-dangle": "off",
        "no-non-null-assertion": null,
        "no-else-return": ["error", { allowElseIf: true }],
        "react/destructuring-assignment": [
            "warn",
            "always",
            { ignoreClassFields: true }
        ]
    }
};
