import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("offline preview boundary", () => {
  it("adds the offline marker only on the demo URL", async () => {
    const response = await proxy(new NextRequest("http://localhost:3000/garba-ghumar/demo"));
    expect(response.headers.get("x-middleware-request-x-satva-offline-demo")).toBe("true");
  });
  it.each(["/garba-ghumar", "/api/garba-ghumar", "/shop", "/garba-ghumar/demo/anything"])("strips a forged demo marker from %s", async path => {
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`, { headers: { "x-satva-offline-demo": "true" } }));
    expect(response.headers.get("x-middleware-request-x-satva-offline-demo")).toBeNull();
  });
});
