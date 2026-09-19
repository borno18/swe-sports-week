"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function LiveRefresh({ initialRevision }: { initialRevision: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const busy = useRef(pending);
  const revision = useRef(initialRevision);
  useEffect(() => { busy.current = pending; }, [pending]);
  useEffect(() => { revision.current = initialRevision; }, [initialRevision]);
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let disposed = false;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (!disposed) timer = setTimeout(check, Math.min(60_000, 10_000 * 2 ** failures));
    };
    async function check() {
      if (disposed || inFlight) return;
      if (document.hidden || !navigator.onLine || busy.current) { schedule(); return; }
      inFlight = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8_000);
      try {
        const response = await fetch("/api/updates", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Update check failed");
        const data = await response.json() as { revision: string };
        if (typeof data.revision !== "string") throw new Error("Invalid revision");
        failures = 0;
        if (!disposed && data.revision !== revision.current) startTransition(() => router.refresh());
      } catch {
        failures = Math.min(failures + 1, 3);
      } finally {
        clearTimeout(timeout);
        inFlight = false;
        schedule();
      }
    }
    schedule();
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [pathname, router]);
  return null;
}
