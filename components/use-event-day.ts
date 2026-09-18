"use client";

import { useEffect, useState } from "react";
import { getEventDay } from "@/lib/data";

export function useEventDay() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setDay(getEventDay());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return day;
}
