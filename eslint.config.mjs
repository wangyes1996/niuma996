import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default rules to allow any type and unused variables
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // 允许未使用的变量
      "@typescript-eslint/no-unused-params": "off", // 允许未使用的参数
      "@typescript-eslint/no-explicit-any": "off", // 允许显式使用any类型
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
