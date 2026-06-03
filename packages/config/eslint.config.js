import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Shared flat ESLint config for the BorderVet monorepo.
// Packages/apps import this and extend it as needed.
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/.astro/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
