"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function LiveRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const refresh = () => { if (!document.hidden && !pending) startTransition(() => router.refresh()); };
    const timer = window.setInterval(refresh, 10_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [pathname, router, pending]);
  return null;
}
