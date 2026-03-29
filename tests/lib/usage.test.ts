import { describe, it, expect } from "vitest";
import { getCurrentMonth, FREE_TIER_AI_LIMIT } from "@/lib/usage";

describe("usage helpers", () => {
  it("getCurrentMonth returns YYYY-MM format", () => {
    const month = getCurrentMonth();
    expect(month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("FREE_TIER_AI_LIMIT is 50", () => {
    expect(FREE_TIER_AI_LIMIT).toBe(50);
  });
});
