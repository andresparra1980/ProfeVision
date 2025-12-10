import js from "@eslint/js";
import tsPlugin from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactNativePlugin from "eslint-plugin-react-native";
import prettierConfig from "eslint-config-prettier";

const config = [
  // Base JS config
  js.configs.recommended,

  // TypeScript config
  ...tsPlugin.configs.recommended,

  // React config
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native
      "react-native/no-unused-styles": "warn",
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "off",

      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // General
      "no-unused-vars": "off", // Using @typescript-eslint/no-unused-vars
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Prettier (disables conflicting rules)
  prettierConfig,

  // Ignore patterns
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "*.config.js",
      "babel.config.js",
    ],
  },
];

export default config;
