import { describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const mockedAuth = vi.mocked(auth);

describe("requireAdmin", () => {
  it("throws 401 when logged out", async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws 403 for non-admin members", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "u1", role: "CUSTOMER", name: "C", email: "c@x.co" },
      expires: new Date().toISOString(),
    });
    await expect(requireAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("passes admins through with their profile", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "a1", role: "ADMIN", name: "A", email: "a@x.co" },
      expires: new Date().toISOString(),
    });
    await expect(requireAdmin()).resolves.toMatchObject({ id: "a1", role: "ADMIN" });
  });
});
