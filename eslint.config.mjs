import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores
  {
    ignores: ["dist/", "coverage/"],
  },

  // Base configuration for all files
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Recommended configs
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Configuration for JS files (like jest.config.js)
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Configuration for test files
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
