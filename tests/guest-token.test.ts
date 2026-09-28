import { expect, it } from "vitest";
import { createGuestToken, readGuestToken } from "@/lib/guest-token";

it("guest identity is opaque, signed and isolated from forged cookies", async () => {
  process.env.AUTH_SECRET = "guest-test-secret-which-is-not-production";
  const first = await createGuestToken();
  const second = await createGuestToken();
  expect(first.id).not.toBe(second.id);
  expect(first.token).not.toContain(first.id);
  expect(await readGuestToken(first.token)).toBe(first.id);
  expect(await readGuestToken(first.id)).toBeNull();
  expect(await readGuestToken(first.token.slice(0, -10) + "forged-data")).toBeNull();
  expect(await readGuestToken()).toBeNull();
});
