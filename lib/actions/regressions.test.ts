import { describe, it, expect } from "vitest";
import { mergePinSymbol, mergeUnpinSymbol } from "@/lib/trading/profile-helpers";
import { validateCustomAssetCategory } from "@/lib/trading/trade-validation";

describe("mergePinSymbol (regression for B1: pin was replacing list)", () => {
  it("appends to an empty list", () => {
    expect(mergePinSymbol([], "EUR/USD")).toEqual(["EUR/USD"]);
  });
  it("appends to an existing list without losing entries", () => {
    const result = mergePinSymbol(["EUR/USD", "BTC/USD"], "AAPL");
    expect(result).toEqual(["EUR/USD", "BTC/USD", "AAPL"]);
  });
  it("is idempotent — re-pinning the same symbol does not duplicate it", () => {
    expect(mergePinSymbol(["EUR/USD", "BTC/USD"], "EUR/USD")).toEqual(["EUR/USD", "BTC/USD"]);
  });
  it("does not overwrite the list with a single-element array (B1 repro)", () => {
    // The original B1 bug: handlePin posted pinnedSymbols=[symbol] and the
    // server action wrote that single-element array over the entire list.
    // The fix routes pin through mergePinSymbol which appends; verify the
    // merged result is NOT a single-element list when the user already had pins.
    const before = ["EUR/USD", "BTC/USD", "AAPL"];
    const after = mergePinSymbol(before, "TSLA");
    expect(after).not.toEqual(["TSLA"]);
    expect(after).toEqual(["EUR/USD", "BTC/USD", "AAPL", "TSLA"]);
    expect(after.length).toBe(4);
  });
  it("respects the max cap", () => {
    const list = Array.from({ length: 50 }, (_, i) => `S${i}`);
    const result = mergePinSymbol(list, "NEW", 50);
    expect(result.length).toBe(50);
    expect(result).not.toContain("NEW"); // capped, newest pushed out by slicing
    expect(result[0]).toBe("S0"); // oldest is still at index 0; slice(0, 50) drops the last prepended "NEW"
  });
  it("returns the input unchanged when symbol is empty", () => {
    expect(mergePinSymbol(["EUR/USD"], "")).toEqual(["EUR/USD"]);
  });
});

describe("mergeUnpinSymbol", () => {
  it("removes a pinned symbol", () => {
    expect(mergeUnpinSymbol(["EUR/USD", "BTC/USD", "AAPL"], "BTC/USD")).toEqual(["EUR/USD", "AAPL"]);
  });
  it("is idempotent — unpinning a non-pinned symbol is a no-op", () => {
    expect(mergeUnpinSymbol(["EUR/USD"], "AAPL")).toEqual(["EUR/USD"]);
  });
  it("returns an empty list when removing the last entry", () => {
    expect(mergeUnpinSymbol(["EUR/USD"], "EUR/USD")).toEqual([]);
  });
});

describe("validateCustomAssetCategory (regression for B2: category mismatch)", () => {
  const userId = "user-1";
  const otherUserId = "user-2";

  it("returns null when customAssetId is not set", () => {
    expect(
      validateCustomAssetCategory({
        customAssetId: undefined,
        assetCategory: "forex",
        customAsset: null,
        currentUserId: userId,
      })
    ).toBeNull();
  });
  it("returns null when category matches", () => {
    expect(
      validateCustomAssetCategory({
        customAssetId: "ca-1",
        assetCategory: "forex",
        customAsset: { category: "forex", userId },
        currentUserId: userId,
      })
    ).toBeNull();
  });
  it("rejects a category mismatch (B2 repro)", () => {
    const msg = validateCustomAssetCategory({
      customAssetId: "ca-1",
      assetCategory: "forex",
      customAsset: { category: "crypto", userId },
      currentUserId: userId,
    });
    expect(msg).not.toBeNull();
    expect(msg).toMatch(/crypto/);
    expect(msg).toMatch(/forex/);
  });
  it("rejects a custom asset owned by a different user", () => {
    const msg = validateCustomAssetCategory({
      customAssetId: "ca-1",
      assetCategory: "forex",
      customAsset: { category: "forex", userId: otherUserId },
      currentUserId: userId,
    });
    expect(msg).toBe("Custom asset not found");
  });
  it("rejects a missing custom asset", () => {
    const msg = validateCustomAssetCategory({
      customAssetId: "ca-1",
      assetCategory: "forex",
      customAsset: null,
      currentUserId: userId,
    });
    expect(msg).toBe("Custom asset not found");
  });
});
