import globals from "globals";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";

export default tseslint.config(
  {
    ignores: ["**/*.js", "**/*.cjs", "dist/", "build/", "node_modules/", "out/", ".vite/", "cysploit-dist/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['client/**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'], // spreading the config object
    languageOptions: { // This will merge with languageOptions from the spread config
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['server/**/*.ts', 'electron/**/*.ts', 'tailwind.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": "warn",
    }
  }
);
