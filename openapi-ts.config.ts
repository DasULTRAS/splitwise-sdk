import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: {
    path: "./src/generated",
    entryFile: false,
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      enums: false,
    },
  ],
});
