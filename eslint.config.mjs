import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Required for resolving paths correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert old-style ESLint config into the new flat config format
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Define the ESLint configuration
const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript"
  ),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Add custom rules here if needed
    },
  },
];

// ✅ Export the config array directly — DO NOT call it as a function
export default eslintConfig;
