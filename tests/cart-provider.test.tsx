/** @vitest-environment jsdom */
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CartProvider, useBag } from "@/features/cart/CartProvider";
import { GUEST_CART_KEY, saveGuestCart } from "@/features/cart/guest-cart";

const session = vi.hoisted(() => ({ status: "unauthenticated", data: null as null | { user: { email: string } } }));
vi.mock("next-auth/react", () => ({ useSession: () => session }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

it("merges new guest picks on a later login with the same account, once per login", async () => {
  let bag: ReturnType<typeof useBag>;
  function Probe() { bag = useBag(); return null; }
  const item = { productId: "64f000000000000000000001", qty: 1, name: "Ring", slug: "ring", price: 499 };
  // Legacy bookkeeping must not prevent new picks from being merged.
  localStorage.setItem("satvastones:cart-merged:v1", JSON.stringify(["buyer@example.com"]));
  saveGuestCart(localStorage, [item]);
  const fetcher = vi.fn(async (url: string) => new Response(JSON.stringify(
    url === "/api/cart/merge" ? { success: true, data: { added: 1, capped: 0, dropped: 0 } } :
      session.status === "authenticated" ? { success: true, data: { items: [], count: 0, subtotal: 0, unavailableCount: 0 } } :
        { success: false, error: { message: "Sign in required" } }
  ), { status: url === "/api/cart/merge" || session.status === "authenticated" ? 200 : 401 }));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<CartProvider><Probe /></CartProvider>);
  await waitFor(() => expect(bag.count).toBe(1));
  const login = () => { session.status = "authenticated"; session.data = { user: { email: "buyer@example.com" } }; view.rerender(<CartProvider><Probe /></CartProvider>); };
  act(login);
  await waitFor(() => expect(localStorage.getItem(GUEST_CART_KEY)).toBe("[]"));
  expect(fetcher.mock.calls.filter(([url]) => url === "/api/cart/merge")).toHaveLength(1);
  act(() => { session.status = "unauthenticated"; session.data = null; view.rerender(<CartProvider><Probe /></CartProvider>); });
  await waitFor(() => expect(bag.loading).toBe(false));
  await act(async () => { await bag.add({ ...item, qty: 2 }); });
  act(login);
  await waitFor(() => expect(fetcher.mock.calls.filter(([url]) => url === "/api/cart/merge")).toHaveLength(2));
  await waitFor(() => expect(localStorage.getItem(GUEST_CART_KEY)).toBe("[]"));
  view.rerender(<CartProvider><Probe /></CartProvider>);
  expect(fetcher.mock.calls.filter(([url]) => url === "/api/cart/merge")).toHaveLength(2);
});
