import { defineConfig } from "@playwright/test";

// Builds and serves the site against the local file store (.data/) with throwaway passwords.
export default defineConfig({
  testDir: "tests/evidence",
  timeout: 180_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      CRM_PASSWORD: "e2e-owner-password",
      ADMIN_PASSWORD: "e2e-admin-password-123",
      ADMIN_STATUS_TOKEN: "e2e-status-token-123456",
      NEXT_PUBLIC_DEMO_MODE: "1",
    },
  },
});
