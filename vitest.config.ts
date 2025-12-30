import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

const templateRoot = path.resolve(import.meta.dirname);

// Load .env.test file when running tests
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: path.resolve(templateRoot, ".env.test") });
}

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    env: {
      // Load test environment variables
      NODE_ENV: "test",
    },
    // Run test files sequentially (one at a time, not in parallel). This is necessary because both db.test.ts and
    // db_additions.ts make updates to the database. When they run in parallel, they cause conflicts.
    fileParallelism: false,
    // Ensure test files run in a predictable order
    sequence: {
      shuffle: false,
    },
  },
});
