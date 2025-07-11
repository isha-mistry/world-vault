import { FlatCompat } from '@eslint/eslintrc';
import react from 'eslint-plugin-react';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    settings: { react: { version: 'detect' } },
    plugins: { react },
    rules: {
      "@typescript-eslint/no-unused-vars":"false",
      "@typescript-eslint/no-explicit-any": "false"
    },
  },
];

// const eslintConfig = [
//   ...compat.extends("next/core-web-vitals", "next/typescript"),
// ];

export default eslintConfig;
