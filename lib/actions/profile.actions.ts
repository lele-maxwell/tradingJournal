"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { mergePinSymbol, mergeUnpinSymbol } from "@/lib/trading/profile-helpers";

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

const AssetCategoryEnum = z.enum(["forex", "index", "futures", "crypto", "stock"]);

const profileUpdateSchema = z.object({
  accountBalance: z.coerce.number().nonnegative().max(1_000_000_000),
  baseCurrency: z.string().min(1).max(8).default("USD"),
  defaultRiskPct: z.coerce.number().nonnegative().max(100),
  pinnedSymbols: z.array(z.string().min(1).max(32)).max(50).default([]),
});

const customAssetSchema = z.object({
  symbol: z.string().min(1).max(32),
  category: AssetCategoryEnum,
  contractSize: z.coerce.number().positive().optional(),
  pipValue: z.coerce.number().positive().optional(),
  tickSize: z.coerce.number().positive().optional(),
});

export async function getOrCreateProfile() {
  const user = await getUser();
  if (!user) return null;
  const existing = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (existing) return existing;
  return prisma.userProfile.create({
    data: {
      userId: user.id,
      accountBalance: 0,
      baseCurrency: "USD",
      defaultRiskPct: 1,
      pinnedSymbols: [],
    },
  });
}

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const pinnedRaw = formData.get("pinnedSymbols");
  let pinned: string[] = [];
  if (typeof pinnedRaw === "string" && pinnedRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(pinnedRaw);
      if (Array.isArray(parsed)) pinned = parsed.filter((x) => typeof x === "string");
    } catch {
      return { error: "Invalid pinnedSymbols payload" };
    }
  }

  const raw = {
    accountBalance: formData.get("accountBalance") ?? "0",
    baseCurrency: formData.get("baseCurrency") ?? "USD",
    defaultRiskPct: formData.get("defaultRiskPct") ?? "1",
    pinnedSymbols: pinned,
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/dashboard");
  revalidatePath("/trades/new");
  return { success: true };
}

export async function addCustomAssetAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const raw = {
    symbol: formData.get("symbol"),
    category: formData.get("category"),
    contractSize: formData.get("contractSize") ?? undefined,
    pipValue: formData.get("pipValue") ?? undefined,
    tickSize: formData.get("tickSize") ?? undefined,
  };

  const parsed = customAssetSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await prisma.customAsset.upsert({
    where: { userId_symbol: { userId: user.id, symbol: parsed.data.symbol } },
    create: { userId: user.id, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/trades/new");
  return { success: true };
}

export async function removeCustomAssetAction(id: string): Promise<void> {
  const user = await getUser();
  if (!user) return;
  await prisma.customAsset.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/trades/new");
}

export async function listCustomAssets() {
  const user = await getUser();
  if (!user) return [];
  return prisma.customAsset.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
}

/**
 * Append a symbol to the user's pinned list. Idempotent — re-pinning an
 * already-pinned symbol is a no-op. Uses a single read-modify-write inside
 * the function (no atomic upsert) so concurrent pins serialize on the
 * last-write-wins semantics Prisma gives us; this matches the rest of the
 * app's per-user update patterns.
 */
export async function pinSymbolAction(symbol: string): Promise<ProfileActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };
  if (!symbol || typeof symbol !== "string" || symbol.length > 32) {
    return { error: "Invalid symbol" };
  }

  const profile = await getOrCreateProfile();
  if (!profile) return { error: "Unauthorized" };

  const current = Array.isArray(profile.pinnedSymbols) ? (profile.pinnedSymbols as string[]) : [];
  const next = mergePinSymbol(current, symbol);
  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { pinnedSymbols: next },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

/** Remove a symbol from the user's pinned list. Idempotent. */
export async function unpinSymbolAction(symbol: string): Promise<ProfileActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };
  if (!symbol || typeof symbol !== "string" || symbol.length > 32) {
    return { error: "Invalid symbol" };
  }

  const profile = await getOrCreateProfile();
  if (!profile) return { error: "Unauthorized" };

  const current = Array.isArray(profile.pinnedSymbols) ? (profile.pinnedSymbols as string[]) : [];
  const next = mergeUnpinSymbol(current, symbol);
  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { pinnedSymbols: next },
  });
  revalidatePath("/dashboard");
  return { success: true };
}
