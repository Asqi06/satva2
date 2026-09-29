import { describe, expect, it } from "vitest";
import { garbaProgress } from "@/lib/garba-benefit";

describe("reward shopping guidance", () => {
  it("explains missing and excess bundle quantities", () => {
    expect(garbaProgress(0, 2, 298, 0).message).toContain("Add 2 more");
    expect(garbaProgress(3, 3, 447, 0).message).toContain("Remove 1");
    expect(garbaProgress(1, 2, 298, 0).message).toContain("Add 1 more");
  });
  it("explains remaining spend and gift selection as separate steps", () => {
    expect(garbaProgress(4, 2, 399, 0).message).toContain("₹100 more");
    expect(garbaProgress(5, 2, 399, 0).message).toContain("₹200 more");
    expect(garbaProgress(4, 3, 599, 0).message).toContain("Choose one free piece");
    expect(garbaProgress(6, 3, 447, 0).message).toContain("Add your mystery gift");
    expect(garbaProgress(6, 3, 447, 2).message).toContain("Keep just one");
  });
});
