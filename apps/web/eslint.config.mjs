import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Apply to all JavaScript/JSX files
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      // Specify global variables for React and Jest
      globals: {
        ...globals.browser,
        React: "readonly",
        test: "readonly",
        expect: "readonly",
      },
    },
    settings: {
      // Automatically detect the React version
      react: {
        version: "detect",
      },
    },
    // Extend the recommended configurations
    plugins: {
      react: pluginReact,
    },
    rules: {},
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];