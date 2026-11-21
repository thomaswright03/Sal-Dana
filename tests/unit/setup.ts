import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";

// Every test file runs in its own scratch directory, so the file-backed store (.data/) is isolated.
const dir = mkdtempSync(path.join(os.tmpdir(), "sd-test-"));
process.chdir(dir);
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.VERCEL;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.RESEND_API_KEY;

beforeEach(() => rmSync(path.join(dir, ".data"), { recursive: true, force: true }));
afterEach(() => rmSync(path.join(dir, ".data"), { recursive: true, force: true }));
