"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { tournamentDatabase } from "@/lib/tournaments";
import { addTournament, mutateTournament, type Mutation } from "@/lib/tournament-store";
import { sports } from "@/lib/data";

export type ActionResult = { ok: boolean; message: string; id?: string };
const field = (form: FormData, key: string) => String(form.get(key) ?? "");

export async function saveTournament(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "Your session expired. Sign in again to save changes." };
  const kind = field(form, "kind");
  if (admin.role === "RESULT_MANAGER" && !["winner", "details"].includes(kind)) return { ok: false, message: "Only tournament organizers can edit lineups or reset brackets." };
  try {
    const db = tournamentDatabase();
    if (kind === "create") {
      const sport = field(form, "sport");
      if (!sports.some(item => item.slug === sport)) return { ok: false, message: "Choose a valid sport." };
      const id = addTournament(db, sport, field(form, "title"), field(form, "entryKind"));
      revalidatePath("/", "layout");
      return { ok: true, message: "Section created. Add its players or teams below.", id };
    }
    let mutation: Mutation;
    switch (kind) {
      case "lineup": case "rename": mutation = { kind, names: field(form, "names") }; break;
      case "winner": mutation = { kind, matchId: field(form, "matchId"), entryId: field(form, "entryId") || null }; break;
      case "reset":
        if (field(form, "confirmation") !== "RESET") return { ok: false, message: "Type RESET to clear this section's names and results." };
        mutation = { kind }; break;
      case "details": mutation = { kind, matchId: field(form, "matchId"), date: field(form, "date"), time: field(form, "time"), venue: field(form, "venue"), scoreA: field(form, "scoreA"), scoreB: field(form, "scoreB") }; break;
      default: return { ok: false, message: "Unknown action." };
    }
    mutateTournament(db, field(form, "id"), Number(field(form, "version")), admin.id, mutation);
    revalidatePath("/", "layout");
    return { ok: true, message: kind === "winner" ? (field(form, "entryId") ? "Winner saved and advanced. The public bracket is updated." : "Result undone. Dependent results have been cleared.") : "Saved. The public website is updated." };
  } catch (error) {
    // Domain errors are safe to display; never expose database internals.
    const message = error instanceof Error && !/SQLITE|constraint|database/i.test(error.message) ? error.message : "Could not save. Please refresh and try again.";
    return { ok: false, message };
  }
}
