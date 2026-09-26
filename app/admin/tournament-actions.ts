"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { tournamentDatabase } from "@/lib/tournaments";
import { addTournament, deleteTournament, mutateTournament, type Mutation } from "@/lib/tournament-store";
import { addSport, deleteSport, listSports } from "@/lib/sports-store";
import type { TournamentFormat, RoundConfig, GroupStageConfig } from "@/lib/bracket";

export type ActionResult = { ok: boolean; message: string; id?: string };
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveTournament(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again to save changes." };
  const kind = field(form, "kind");

  if (admin.role === "RESULT_MANAGER" && !["winner", "details", "qualifiers", "flex_set_advancers"].includes(kind)) {
    return { ok: false, message: "Only tournament organizers can edit lineups, formats, or delete sections." };
  }

  try {
    const db = await tournamentDatabase();

    if (kind === "create") {
      const sport = field(form, "sport");
      const currentSports = await listSports(db);
      if (!currentSports.some(item => item.slug === sport)) {
        return { ok: false, message: "Choose a valid sport." };
      }
      const title = field(form, "title");
      const entryKind = field(form, "entryKind");
      const format = (field(form, "format") || "knockout") as TournamentFormat;
      const legs = Number(field(form, "legs")) === 2 ? 2 : 1;
      const playersPerGame = Number(field(form, "playersPerGame")) || 2;
      const totalGames = Number(field(form, "totalGames")) || undefined;

      const id = await addTournament(db, sport, title, entryKind, format, legs, playersPerGame, totalGames);
      revalidatePath("/", "layout");
      revalidatePath("/admin");
      return { ok: true, message: "Section created. Add its players or teams below.", id };
    }

    if (kind === "delete") {
      if (field(form, "confirmation") !== "DELETE") {
        return { ok: false, message: "Type DELETE in capital letters to permanently remove this section." };
      }
      await deleteTournament(db, field(form, "id"));
      revalidatePath("/", "layout");
      revalidatePath("/admin");
      return { ok: true, message: "Section permanently deleted." };
    }

    let mutation: Mutation;
    switch (kind) {
      case "lineup": {
        const format = (field(form, "format") || undefined) as TournamentFormat | undefined;
        const legs = field(form, "legs") ? Number(field(form, "legs")) : undefined;
        const playersPerGame = field(form, "playersPerGame") ? Number(field(form, "playersPerGame")) : undefined;
        const totalGames = field(form, "totalGames") ? Number(field(form, "totalGames")) : undefined;
        const roundConfigRaw = field(form, "roundConfig");
        const roundConfig: RoundConfig[] | undefined = roundConfigRaw ? JSON.parse(roundConfigRaw) : undefined;
        const hasGroupStage = field(form, "hasGroupStage") === "true";
        const groupStageConfigRaw = field(form, "groupStageConfig");
        const groupStageConfig: GroupStageConfig | undefined = groupStageConfigRaw ? JSON.parse(groupStageConfigRaw) : undefined;
        mutation = { kind, names: field(form, "names"), format, legs, playersPerGame, totalGames, roundConfig, hasGroupStage, groupStageConfig };
        break;
      }
      case "rename":
        mutation = { kind, names: field(form, "names") };
        break;
      case "reset":
        if (field(form, "confirmation") !== "RESET") {
          return { ok: false, message: "Type RESET to clear this section's names and results." };
        }
        mutation = { kind };
        break;
      case "winner":
        mutation = { kind, matchId: field(form, "matchId"), entryId: field(form, "entryId") || null };
        break;
      case "qualifiers":
        mutation = { kind, groupId: field(form, "groupId"), entryIds: form.getAll("qualifierId").map(String) };
        break;
      case "details": {
        const scores: Record<string, string> = {};
        const cricketScores: Record<string, { score: string; overs: string; allOut: boolean }> = {};
        for (const [k, v] of form.entries()) {
          if (k.startsWith("score_") && typeof v === "string") {
            scores[k.replace("score_", "")] = v.trim();
          }
          if (k.startsWith("cricket_score_") && typeof v === "string") {
            const id = k.slice("cricket_score_".length);
            cricketScores[id] = {
              score: v.trim(),
              overs: field(form, `cricket_overs_${id}`),
              allOut: form.has(`cricket_all_out_${id}`),
            };
          }
        }
        mutation = {
          kind,
          matchId: field(form, "matchId"),
          date: field(form, "date"),
          time: field(form, "time"),
          venue: field(form, "venue"),
          scoreA: field(form, "scoreA"),
          scoreB: field(form, "scoreB"),
          date2: field(form, "date2") || undefined,
          time2: field(form, "time2") || undefined,
          venue2: field(form, "venue2") || undefined,
          scoreA2: field(form, "scoreA2") !== "" ? field(form, "scoreA2") : undefined,
          scoreB2: field(form, "scoreB2") !== "" ? field(form, "scoreB2") : undefined,
          scores: Object.keys(scores).length > 0 ? scores : undefined,
          cricketScores: Object.keys(cricketScores).length > 0 ? cricketScores : undefined,
        };
        break;
      }
      case "add_match": {
        const raw = form.getAll("participantIds");
        const participantIds = raw.flatMap(r => typeof r === "string" ? r.split(",") : []).map(s => s.trim()).filter(Boolean);
        mutation = { kind, round: Number(field(form, "round")), participantIds };
        break;
      }
      case "delete_match":
        mutation = { kind, matchId: field(form, "matchId") };
        break;
      case "add_participant":
        mutation = { kind, matchId: field(form, "matchId"), participantId: field(form, "participantId") || field(form, "entryId") };
        break;
      case "remove_participant":
        mutation = { kind, matchId: field(form, "matchId"), participantId: field(form, "participantId") || field(form, "entryId") };
        break;
      case "flex_add_match": {
        const participantIds = field(form, "participantIds").split(",").filter(Boolean);
        mutation = { kind, round: Number(field(form, "round")), participantIds };
        break;
      }
      case "flex_remove_match":
        mutation = { kind, matchId: field(form, "matchId") };
        break;
      case "flex_set_advancers": {
        const advancerIds = field(form, "advancerIds").split(",").filter(Boolean);
        mutation = { kind, matchId: field(form, "matchId"), advancerIds };
        break;
      }
      case "flex_update_participants": {
        const pIds = field(form, "participantIds").split(",").filter(Boolean);
        mutation = { kind, matchId: field(form, "matchId"), participantIds: pIds };
        break;
      }
      case "flex_add_round":
        mutation = { kind };
        break;
      default:
        return { ok: false, message: "Unknown action." };
    }

    await mutateTournament(db, field(form, "id"), Number(field(form, "version")), admin.id, mutation);
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    return {
      ok: true,
      message:
        kind === "winner"
          ? field(form, "entryId")
            ? "Result saved and advanced. The public view is updated."
            : "Result undone. Dependent results have been cleared."
          : "Saved. The public website is updated.",
    };
  } catch (error) {
    const message =
      error instanceof Error && !/SQLITE|constraint|database|libsql/i.test(error.message)
        ? error.message
        : "Could not save. Please refresh and try again.";
    return { ok: false, message };
  }
}

export async function saveSportAction(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Please sign in again." };
  if (admin.role === "RESULT_MANAGER") {
    return { ok: false, message: "Only tournament organizers can create game segments." };
  }

  const name = field(form, "name");
  const icon = field(form, "icon") || "🏆";
  const category = (field(form, "category") === "Outdoor" ? "Outdoor" : "Indoor") as "Indoor" | "Outdoor";
  const color = field(form, "color") || "#72d2ff";
  const detail = field(form, "detail") || "Tournament";

  try {
    const db = await tournamentDatabase();
    const created = await addSport(db, { name, icon, category, color, detail });
    await addTournament(db, created.slug, created.name, ["football", "cricket"].includes(created.slug) ? "team" : "player");
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/sports");
    return { ok: true, message: `Game segment "${created.name}" created successfully.`, id: created.slug };
  } catch (err) {
    const message =
      err instanceof Error && !/SQLITE|constraint|database|libsql/i.test(err.message)
        ? err.message
        : "Failed to create game segment. Please try again.";
    return { ok: false, message };
  }
}

export async function deleteSportAction(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Please sign in again." };
  if (admin.role !== "SUPER_ADMIN") {
    return { ok: false, message: "Only Super Admins can remove entire game segments." };
  }

  const slug = field(form, "slug");
  if (!slug) return { ok: false, message: "Missing sport slug." };

  try {
    const db = await tournamentDatabase();
    await deleteSport(db, slug);
    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/sports");
    return { ok: true, message: `Game segment "${slug}" and its sections removed.` };
  } catch (err) {
    const message =
      err instanceof Error && !/SQLITE|constraint|database|libsql/i.test(err.message)
        ? err.message
        : "Failed to delete game segment. Please try again.";
    return { ok: false, message };
  }
}
