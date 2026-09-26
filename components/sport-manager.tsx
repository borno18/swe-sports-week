"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Trophy, Layers, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { saveSportAction, deleteSportAction, type ActionResult } from "@/app/admin/tournament-actions";
import type { Sport } from "@/lib/data";
import type { Tournament } from "@/lib/bracket";

const initial: ActionResult = { ok: false, message: "" };

const PRESET_COLORS = [
  "#72d2ff", "#9de393", "#ffbd66", "#d6b3ff", "#ff8f9b",
  "#9ea9ff", "#f0db85", "#70e6cd", "#ffb59d", "#dfbf92",
  "#b8c5fa", "#f59eba", "#ff5722", "#00bcd4", "#8bc34a"
];

const PRESET_ICONS = ["⚽", "🏏", "🏸", "♟", "🏓", "🎮", "◉", "🎲", "🎯", "✒", "🃏", "🏐", "🤾", "🥊", "🥋", "🏊"];

function DeleteSportButton({ slug, name, sectionCount }: { slug: string; name: string; sectionCount: number }) {
  const [state, action, pending] = useActionState(deleteSportAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <form action={action} className="sport-delete-confirm-box">
        <input type="hidden" name="slug" value={slug} />
        <p>
          <AlertTriangle size={14} /> Remove <strong>{name}</strong>
          {sectionCount > 0 && ` and its ${sectionCount} section(s)`}?
        </p>
        <div className="btn-row">
          <button type="submit" className="button danger-button small-button" disabled={pending}>
            {pending ? "Removing…" : "Confirm Delete"}
          </button>
          <button type="button" className="button ghost small-button" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </button>
        </div>
        {state.message && !state.ok && <span className="inline-feedback error">{state.message}</span>}
      </form>
    );
  }

  return (
    <button
      type="button"
      className="button danger-ghost-button small-button"
      onClick={() => setConfirming(true)}
      title="Delete sport"
    >
      <Trash2 size={13} /> Delete
    </button>
  );
}

export function SportManager({
  sports,
  tournaments,
}: {
  sports: Sport[];
  tournaments: Pick<Tournament, "sportSlug">[];
}) {
  const [state, action, pending] = useActionState(saveSportAction, initial);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏐");
  const [category, setCategory] = useState<"Indoor" | "Outdoor">("Outdoor");
  const [color, setColor] = useState("#ff5722");
  const [detail, setDetail] = useState("Open knockout or league");

  return (
    <div className="sports-manager-layout">
      <div className="sports-manager-grid">
        {/* Creation card */}
        <section className="admin-panel-card post-card">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">Tournament Configuration</span>
              <h2>Add Game Segment</h2>
            </div>
            <span className="segment-badge-preview" style={{ backgroundColor: color }}>
              <i>{icon}</i>
            </span>
          </div>
          <p className="card-subtitle">
            Create a new sport or event category (e.g., Volleyball, Hand Cricket, Tug of War).
          </p>

          {state.message && (
            <div className={`admin-feedback ${state.ok ? "success" : "error"}`} role={state.ok ? "status" : "alert"}>
              {state.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{state.message}</span>
            </div>
          )}

          <form action={action} className="organizer-form">
            <label>
              Segment / Sport Name
              <input
                name="name"
                placeholder="e.g. Volleyball, Tug of War, Handball"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={50}
              />
            </label>

            <div>
              <label className="field-label">Icon / Emoji</label>
              <div className="icon-preset-selector">
                {PRESET_ICONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`icon-chip ${icon === emoji ? "active" : ""}`}
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                name="icon"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                placeholder="Or paste any custom emoji"
                maxLength={4}
                required
                className="custom-icon-input"
              />
            </div>

            <div className="category-radio-group">
              <label className={`category-radio-chip ${category === "Outdoor" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="category"
                  value="Outdoor"
                  checked={category === "Outdoor"}
                  onChange={() => setCategory("Outdoor")}
                  className="sr-only"
                />
                Outdoor Sport
              </label>
              <label className={`category-radio-chip ${category === "Indoor" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="category"
                  value="Indoor"
                  checked={category === "Indoor"}
                  onChange={() => setCategory("Indoor")}
                  className="sr-only"
                />
                Indoor Sport
              </label>
            </div>

            <div>
              <label className="field-label">Theme Color</label>
              <div className="color-presets-row">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch-btn ${color === c ? "selected" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <input
                name="color"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="color-picker-input"
              />
            </div>

            <label>
              Detail / Format Subtitle
              <input
                name="detail"
                placeholder="e.g. 6 batch teams · Knockout or League"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                maxLength={80}
              />
            </label>

            <button type="submit" className="button organizer-primary" disabled={pending}>
              <Plus size={16} /> {pending ? "Adding Segment…" : "Add Game Segment"}
            </button>
          </form>
        </section>

        {/* Existing segments list */}
        <section className="admin-panel-card list-card">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">Catalog Overview</span>
              <h2>Active Game Segments ({sports.length})</h2>
            </div>
          </div>
          <p className="card-subtitle">
            Existing game segments available across the public website and tournament draw editor.
          </p>

          <div className="sports-catalog-admin-list">
            {sports.map(sport => {
              const sections = tournaments.filter(t => t.sportSlug === sport.slug);
              return (
                <div key={sport.slug} className="sport-admin-row">
                  <div className="sport-row-lead">
                    <span className="sport-row-icon" style={{ backgroundColor: `${sport.color}26`, borderColor: sport.color }}>
                      {sport.icon}
                    </span>
                    <div>
                      <strong>{sport.name}</strong>
                      <small>{sport.category} · {sections.length} {sections.length === 1 ? "section" : "sections"}</small>
                    </div>
                  </div>
                  <div className="sport-row-actions">
                    <DeleteSportButton slug={sport.slug} name={sport.name} sectionCount={sections.length} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
