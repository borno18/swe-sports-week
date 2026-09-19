"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Shield, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

const nav = [
  ["Home", "/"],
  ["Schedule", "/schedule"],
  ["Sports", "/sports"],
  ["Results", "/results"],
  ["Champions", "/champions"],
  ["Announcements", "/announcements"],
];

type SearchItem = { icon: string; title: string; subtitle: string; href: string; type: string };

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  function closeSearch() { setSearchOpen(false); setQuery(""); }
  function openSearch() { setMenuOpen(false); setSearchOpen(true); }

  useEffect(() => {
    if (!searchOpen) return;
    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError(false);
    fetch("/api/search", { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error("Search unavailable"); return response.json(); })
      .then((items: SearchItem[]) => { if (!controller.signal.aborted) setSearchItems(items); })
      .catch(() => { if (!controller.signal.aborted) setSearchError(true); })
      .finally(() => { if (!controller.signal.aborted) setSearchLoading(false); });
    return () => controller.abort();
  }, [searchOpen, searchAttempt]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchItems.filter(item =>
      item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, searchItems]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setMenuOpen(false); setQuery(""); setSearchOpen(v => !v);
      }
      if (e.key === "Escape" && menuOpen) { setMenuOpen(false); menuRef.current?.focus(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!searchOpen) { dialog.close(); return; }
    dialog.showModal();
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [searchOpen]);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setQuery(""); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    headerRef.current?.querySelector<HTMLAnchorElement>("nav a")?.focus();
    function outside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menuOpen]);

  return (
    <>
      <header className="site-header" ref={headerRef}>
        <div className="nav-shell">
          <Link href="/" className="brand" aria-label="Sports Week home">
            <div className="brand-logo-frame">
              <img
                src="/logos/swe-society-logo-white.png"
                alt="SWE Society"
                className="brand-logo-img"
              />
            </div>
            <div className="brand-text">
              <strong>SPORTS WEEK</strong>
              <small>SWE SOCIETY · SUST</small>
            </div>
          </Link>
          <nav id="main-navigation" className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
            {nav.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</Link>)}
            <Link href="/admin" className="mobile-admin-link" aria-current={pathname === "/admin" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Shield size={16} /> Admin</Link>
          </nav>
          <div className="nav-actions">
            <button className="icon-button" aria-label="Search" aria-haspopup="dialog" onClick={openSearch}><Search size={19} /></button>
            <Link className="admin-link" href="/admin"><Shield size={16} /> Admin</Link>
            <button ref={menuRef} className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="main-navigation">{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      <dialog ref={dialogRef} className="search-overlay" aria-label="Search Sports Week" onCancel={closeSearch} onClose={closeSearch} onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }} onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = e.currentTarget.querySelectorAll<HTMLElement>("input, button, a[href]");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }}>
        <div className="search-box">
          <div className="search-input-row">
            <Search size={20} />
            <input ref={inputRef} aria-label="Search matches, sports, and announcements" type="search" placeholder="Search matches, sports, announcements…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "Enter") {
                const first = dialogRef.current?.querySelector<HTMLAnchorElement>(".search-result-item");
                if (first) { e.preventDefault(); if (e.key === "Enter") first.click(); else first.focus(); }
              }
            }} />
            <button className="search-close" aria-label="Close search" onClick={closeSearch}><X size={18} /></button>
          </div>
          {searchLoading ? <div className="search-empty" role="status"><p>Loading search…</p></div> : searchError ? (
            <div className="search-empty" role="status"><p>Search couldn’t load. Please try again.</p><button className="button" onClick={() => setSearchAttempt(n => n + 1)}>Retry search</button></div>
          ) : query.trim() ? (
            results.length > 0 ? (
              <div className="search-results">
                {results.map((item, i) => (
                  <Link key={i} href={item.href} className="search-result-item" onClick={closeSearch}>
                    <span className="search-result-icon">{item.icon}</span>
                    <div><h4>{item.title}</h4><p>{item.subtitle}</p></div>
                    <span className="search-result-type">{item.type}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="search-empty" role="status"><span>🔍</span><p>No results for &ldquo;{query}&rdquo;</p></div>
            )
          ) : (
            <div className="search-results">
              <div className="search-empty"><span>⚡</span><p>Start typing to search across the entire Sports Week</p></div>
            </div>
          )}
          <div className="sr-only" role="status">{!searchLoading && !searchError && query.trim() && `${results.length} results found`}</div>
          <div className="search-hint"><span><kbd>Esc</kbd> to close</span><span><kbd>Ctrl / ⌘ K</kbd> to open</span></div>
        </div>
      </dialog>
    </>
  );
}
