"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tradeSchema, calcChecklistScore, calcRR } from "@/lib/validations/trade.schema";

export type TradeActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createTradeAction(
  prevState: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  // Parse raw form data
  const raw = {
    pair: formData.get("pair"),
    direction: formData.get("direction"),
    strategy: formData.get("strategy") || undefined,
    entryPrice: formData.get("entryPrice"),
    exitPrice: formData.get("exitPrice") || undefined,
    stopLoss: formData.get("stopLoss"),
    takeProfit: formData.get("takeProfit"),
    positionSize: formData.get("positionSize") || undefined,
    riskPercent: formData.get("riskPercent") || undefined,
    entryTime: formData.get("entryTime"),
    exitTime: formData.get("exitTime") || undefined,
    entryTf: formData.get("entryTf") || undefined,
    higherTf: formData.get("higherTf") || undefined,
    setupNotes: formData.get("setupNotes") || undefined,
    executionNotes: formData.get("executionNotes") || undefined,
    mistakeNotes: formData.get("mistakeNotes") || undefined,
    lessonsLearned: formData.get("lessonsLearned") || undefined,
    mentalState: formData.get("mentalState") || undefined,
    followedPlan: formData.get("followedPlan") === "true",
    movedSL: formData.get("movedSL") === "true",
    enteredEarly: formData.get("enteredEarly") === "true",
    overtraded: formData.get("overtraded") === "true",
    mentalHealthOk: formData.get("mentalHealthOk") === "true",
    // Checklist
    supportRespected: formData.get("supportRespected") === "true",
    resistanceRespected: formData.get("resistanceRespected") === "true",
    trendlineRespected: formData.get("trendlineRespected") === "true",
    orderBlockRespected: formData.get("orderBlockRespected") === "true",
    confluence: formData.get("confluence") === "true",
    retestConfirmed: formData.get("retestConfirmed") === "true",
    rejectionCandle: formData.get("rejectionCandle") === "true",
    liquiditySweep: formData.get("liquiditySweep") === "true",
    msShift: formData.get("msShift") === "true",
    htfAligned: formData.get("htfAligned") === "true",
    londonSession: formData.get("londonSession") === "true",
    nySession: formData.get("nySession") === "true",
    avoidedLowVolume: formData.get("avoidedLowVolume") === "true",
    entryConfirmed: formData.get("entryConfirmed") === "true",
    riskManaged: formData.get("riskManaged") === "true",
    noImpulsiveEntry: formData.get("noImpulsiveEntry") === "true",
  };

  const parsed = tradeSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  const score = calcChecklistScore(data);
  const rr = calcRR(
    data.direction,
    data.entryPrice,
    data.stopLoss,
    data.takeProfit
  );

  // Handle screenshot uploads
  const supabase = await createClient();
  const imageTypes = ["before_entry", "after_exit", "higher_timeframe"] as const;
  const uploadedImages: { imageUrl: string; imageType: string }[] = [];

  for (const imgType of imageTypes) {
    const file = formData.get(`screenshot_${imgType}`) as File | null;
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${imgType}.${ext}`;
      const { data: upload, error } = await supabase.storage
        .from("trade-screenshots")
        .upload(path, file, { upsert: false });

      if (!error && upload) {
        const { data: urlData } = supabase.storage
          .from("trade-screenshots")
          .getPublicUrl(upload.path);
        uploadedImages.push({ imageUrl: urlData.publicUrl, imageType: imgType });
      }
    }
  }

  // Save to database
  await prisma.trade.create({
    data: {
      userId: user.id,
      pair: data.pair,
      direction: data.direction,
      strategy: data.strategy,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice ? Number(data.exitPrice) : undefined,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      positionSize: data.positionSize ? Number(data.positionSize) : undefined,
      riskPercent: data.riskPercent ? Number(data.riskPercent) : undefined,
      riskReward: rr ?? undefined,
      entryTime: new Date(data.entryTime),
      exitTime: data.exitTime ? new Date(data.exitTime) : undefined,
      entryTf: data.entryTf,
      higherTf: data.higherTf,
      setupNotes: data.setupNotes,
      executionNotes: data.executionNotes,
      mistakeNotes: data.mistakeNotes,
      lessonsLearned: data.lessonsLearned,
      mentalState: data.mentalState,
      followedPlan: data.followedPlan,
      movedSL: data.movedSL,
      enteredEarly: data.enteredEarly,
      overtraded: data.overtraded,
      mentalHealthOk: data.mentalHealthOk,
      checklist: {
        create: {
          supportRespected: data.supportRespected,
          resistanceRespected: data.resistanceRespected,
          trendlineRespected: data.trendlineRespected,
          orderBlockRespected: data.orderBlockRespected,
          confluence: data.confluence,
          retestConfirmed: data.retestConfirmed,
          rejectionCandle: data.rejectionCandle,
          liquiditySweep: data.liquiditySweep,
          msShift: data.msShift,
          htfAligned: data.htfAligned,
          londonSession: data.londonSession,
          nySession: data.nySession,
          avoidedLowVolume: data.avoidedLowVolume,
          entryConfirmed: data.entryConfirmed,
          riskManaged: data.riskManaged,
          noImpulsiveEntry: data.noImpulsiveEntry,
          score,
        },
      },
      images:
        uploadedImages.length > 0
          ? { createMany: { data: uploadedImages } }
          : undefined,
    },
  });

  revalidatePath("/trades");
  revalidatePath("/dashboard");
  redirect("/trades");
}
