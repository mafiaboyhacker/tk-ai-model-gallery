import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**/*",
      "out/**",
      "dist/**",
      "build/**",
      "next-env.d.ts",
      "src/deprecated/**",
      "prisma/generated/**",
      "*.d.ts",
      "logs/**",
      "*.log",
      ".cache/**",
      ".parcel-cache/**",
      ".env*",
      "!.env.example",
      "scripts/**/*",
      "**/scripts/**",
      "**/.next/**",
      "coverage/**",
      "*.min.js",
      "public/**/*.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "off", // CommonJS import 허용
      "@typescript-eslint/triple-slash-reference": "off", // next-env.d.ts 허용
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
