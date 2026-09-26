"use client";

import { useLinkStatus } from "next/link";

export function NavigationHint() {
  const { pending } = useLinkStatus();
  return pending ? <span className="navigation-hint" role="status">Loading…</span> : null;
}
