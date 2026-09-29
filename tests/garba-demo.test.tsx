// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GarbaWheel } from "@/features/garba/GarbaWheel";
import { GARBA_OFFERS } from "@/lib/garba-offers";

vi.mock("next-auth/react", () => ({ useSession: () => ({ status: "authenticated", data: { user: { name: "Existing customer" } } }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));

describe("anonymous Garba demo", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("previews all seven chosen rewards without calling payment or account APIs", async () => {
    vi.useFakeTimers();
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<GarbaWheel paymentsEnabled={false} demoMode />);
    expect(screen.getByText("Demo mode · no account, payment or real coupons.")).toBeInTheDocument();
    expect(screen.queryByText("Check my payment & saved reward")).not.toBeInTheDocument();
    for (let i = 0; i < GARBA_OFFERS.length; i++) {
      fireEvent.change(screen.getByLabelText("Test a reward"), { target: { value: String(i) } });
      fireEvent.click(screen.getByRole("button", { name: /Spin demo wheel/ }));
      expect(screen.getByRole("button", { name: /Round and round/ })).toBeDisabled();
      await act(async () => { vi.advanceTimersByTime(5300); });
      expect(screen.getByRole("heading", { name: `${GARBA_OFFERS[i].name} ✦` })).toBeInTheDocument();
      expect(screen.getByText("PREVIEW ONLY · NO COUPON ISSUED")).toBeInTheDocument();
    }
    expect(network).not.toHaveBeenCalled();
  });
});
