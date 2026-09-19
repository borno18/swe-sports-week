import "server-only";

import { cache } from "react";
import { ensureDatabaseInitialized } from "./db.ts";
import { listAnnouncements, type Announcement } from "./announcement-store.ts";

export * from "./announcement-store.ts";

export const getAnnouncements = cache(async (): Promise<Announcement[]> => {
  const db = await ensureDatabaseInitialized();
  return listAnnouncements(db);
});
