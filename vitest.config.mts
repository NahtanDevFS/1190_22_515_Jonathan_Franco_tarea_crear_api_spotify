import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://x:x@localhost:5432/x",
      JWT_ACCESS_SECRET: "test_access_secret_1234567890",
      JWT_REFRESH_SECRET: "test_refresh_secret_1234567890",
      BCRYPT_ROUNDS: "4",
    },
  },
});
