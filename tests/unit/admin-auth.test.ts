import { afterEach, describe, expect, it } from "vitest";
import { createAdminToken, verifyAdminBearer, verifyAdminToken } from "@/lib/admin-auth";
import { createSessionToken, verifySessionToken } from "@/lib/auth";

afterEach(() => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.CRM_PASSWORD;
  delete process.env.ADMIN_STATUS_TOKEN;
});

describe("admin auth", () => {
  it("accepts its own token and rejects the CRM session token", () => {
    process.env.ADMIN_PASSWORD = "admin-password-123";
    process.env.CRM_PASSWORD = "crm-password-123";
    expect(verifyAdminToken(createAdminToken())).toBe(true);
    expect(verifyAdminToken(createSessionToken())).toBe(false);
    expect(verifySessionToken(createAdminToken())).toBe(false);
  });

  it("is closed when no admin password is set", () => {
    expect(verifyAdminToken("1.abc")).toBe(false);
  });

  it("checks the bearer token", () => {
    process.env.ADMIN_STATUS_TOKEN = "a-long-status-token-1234";
    expect(verifyAdminBearer("Bearer a-long-status-token-1234")).toBe(true);
    expect(verifyAdminBearer("Bearer wrong")).toBe(false);
    expect(verifyAdminBearer(null)).toBe(false);
  });
});
