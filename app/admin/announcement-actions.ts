"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/db";
import { addAnnouncement, deleteAnnouncement, type AnnouncementLevel } from "@/lib/announcements";

export type AnnouncementActionResult = {
  ok: boolean;
  message: string;
};

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveAnnouncementAction(
  _prevState: AnnouncementActionResult,
  form: FormData
): Promise<AnnouncementActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, message: "Your session expired. Please sign in again." };
  }

  const title = field(form, "title");
  const body = field(form, "body");
  const level = (field(form, "level") || "general") as AnnouncementLevel;
  const time = field(form, "time");

  if (!title) {
    return { ok: false, message: "Please enter a title for the announcement." };
  }
  if (!body) {
    return { ok: false, message: "Please enter announcement content." };
  }

  try {
    const db = await ensureDatabaseInitialized();
    await addAnnouncement(db, {
      title,
      body,
      level,
      time: time || undefined,
      createdBy: admin.id,
    });

    revalidatePath("/", "layout");
    revalidatePath("/announcements");
    revalidatePath("/admin");
    return { ok: true, message: "Announcement published successfully to the website." };
  } catch (err) {
    const message =
      err instanceof Error && !/SQLITE|constraint|database|libsql/i.test(err.message)
        ? err.message
        : "Failed to publish announcement. Please try again.";
    return { ok: false, message };
  }
}

export async function deleteAnnouncementAction(
  _prevState: AnnouncementActionResult,
  form: FormData
): Promise<AnnouncementActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { ok: false, message: "Your session expired. Please sign in again." };
  }

  const id = field(form, "id");
  if (!id) {
    return { ok: false, message: "Missing announcement ID." };
  }

  try {
    const db = await ensureDatabaseInitialized();
    await deleteAnnouncement(db, id);

    revalidatePath("/", "layout");
    revalidatePath("/announcements");
    revalidatePath("/admin");
    return { ok: true, message: "Announcement deleted successfully." };
  } catch (err) {
    const message =
      err instanceof Error && !/SQLITE|constraint|database|libsql/i.test(err.message)
        ? err.message
        : "Failed to delete announcement. Please try again.";
    return { ok: false, message };
  }
}
