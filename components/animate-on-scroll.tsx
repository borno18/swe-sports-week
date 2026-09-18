"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

export function AnimateOnScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    // Keep server-rendered and already-visible content readable before hydration.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "revealed" : ""} ${className}`}>
      {children}
    </div>
  );
}
