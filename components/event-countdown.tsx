"use client";

import { useEffect, useState } from "react";
import { event } from "@/lib/data";

export function EventCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(event.startsAt).getTime() - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.floor((remaining ?? 0) / 1000);
  const parts = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  return <div className="event-countdown">
    <p>{remaining === 0 ? "Sports Week has begun!" : "The countdown to Sports Week"}</p>
    {remaining !== 0 && <div className="countdown-digits" role="timer" aria-label={remaining === null ? "Loading countdown" : `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes, ${parts[3]} seconds until Sports Week`}>
      {parts.map((value, i) => <div key={i}><strong>{remaining === null ? "--" : String(value).padStart(2, "0")}</strong><small>{["Days", "Hours", "Minutes", "Seconds"][i]}</small></div>)}
    </div>}
    <small>{new Date(event.startsAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h12" })} · Bangladesh time</small>
  </div>;
}
