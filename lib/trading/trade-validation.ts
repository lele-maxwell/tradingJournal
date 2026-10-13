/**
 * Cross-field validation helper for the Trade form.
 *
 * Extracted from `lib/actions/trade.actions.ts` so it can be unit-tested
 * without triggering Next's "Server Actions must be async" rule on the
 * action module.
 */

export type AssetCategoryForValidation = "forex" | "index" | "futures" | "crypto" | "stock";

/**
 * Returns an error message string when the optional customAssetId is set and
 * the referenced CustomAsset is missing, owned by someone else, or its
 * category does not match the trade's assetCategory. Returns null when no
 * validation error applies (including when customAssetId is unset).
 */
export function validateCustomAssetCategory(input: {
  customAssetId?: string | undefined;
  assetCategory: AssetCategoryForValidation;
  customAsset: { category: string; userId: string } | null;
  currentUserId: string;
}): string | null {
  if (!input.customAssetId) return null;
  if (!input.customAsset) return "Custom asset not found";
  if (input.customAsset.userId !== input.currentUserId) return "Custom asset not found";
  if (input.customAsset.category !== input.assetCategory) {
    return `Custom asset category (${input.customAsset.category}) does not match trade category (${input.assetCategory})`;
  }
  return null;
}
