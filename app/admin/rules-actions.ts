"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/db";
import { saveSportRule } from "@/lib/rules-store";
import type { GameRule } from "@/lib/data";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function updateSportRulesAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, message: "Unauthorized. Please sign in again." };
  }

  const sportSlug = String(formData.get("sportSlug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const format = (String(formData.get("format") || "knockout")) as "knockout" | "flexible" | "round_robin";
  const advancement = String(formData.get("advancement") || "").trim();
  const rulesRaw = String(formData.get("rules") || "").trim();
  const rounds = String(formData.get("rounds") || "").trim();
  const tiebreaker = String(formData.get("tiebreaker") || "").trim();

  if (!sportSlug) {
    return { ok: false, message: "Sport slug is required." };
  }
  if (!title) {
    return { ok: false, message: "Rule title is required." };
  }
  if (!advancement) {
    return { ok: false, message: "Advancement criteria is required." };
  }

  const rulesList = rulesRaw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const updatedRule: GameRule = {
    sportSlug,
    title,
    format,
    advancement,
    rules: rulesList.length ? rulesList : ["অফিসিয়াল টুর্নামেন্ট নিয়মাবলি প্রযোজ্য হবে।"],
    rounds: rounds || undefined,
    tiebreaker: tiebreaker || undefined,
  };

  try {
    const db = await ensureDatabaseInitialized();
    await saveSportRule(db, updatedRule);

    revalidatePath(`/sports/${sportSlug}`);
    revalidatePath("/sports");
    revalidatePath("/admin");

    return { ok: true, message: "খেলার নিয়মাবলি সফলভাবে সংরক্ষিত হয়েছে! (Rules saved successfully!)" };
  } catch (error) {
    console.error("Failed to update sport rules:", error);
    return { ok: false, message: "Failed to save rules. Please try again." };
  }
}
