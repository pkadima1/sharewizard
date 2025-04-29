// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        // Add global variables here
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "indent": ["error", 2]
    }
  },
  {
    ignores: ["lib/**/*", "generated/**/*"]
  }
];