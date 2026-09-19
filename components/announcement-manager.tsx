"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Megaphone, Trash2, Send, ExternalLink, AlertTriangle, AlertCircle, Info, Clock, CheckCircle2 } from "lucide-react";
import {
  saveAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementActionResult,
} from "@/app/admin/announcement-actions";
import type { Announcement, AnnouncementLevel } from "@/lib/announcements";
import { AnnouncementBody } from "@/components/announcement-body";

const initial: AnnouncementActionResult = { ok: false, message: "" };

const LEVELS: { value: AnnouncementLevel; label: string; description: string; icon: any }[] = [
  { value: "general", label: "General Notice", description: "Standard update or announcement", icon: Info },
  { value: "important", label: "Important", description: "Highlighted schedule or venue change", icon: AlertCircle },
  { value: "urgent", label: "Urgent Alert", description: "Immediate attention, rain delay or alert", icon: AlertTriangle },
  { value: "update", label: "Score / Update", description: "Tournament fixture or score bulletin", icon: Megaphone },
];

function LevelBadge({ level }: { level: AnnouncementLevel }) {
  const meta = LEVELS.find(l => l.value === level) ?? LEVELS[0];
  const Icon = meta.icon;
  return (
    <span className={`announcement-pill ${level}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
}

function AnnouncementDeleteButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(deleteAnnouncementAction, initial);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <form action={action} className="announcement-delete-confirm">
        <input type="hidden" name="id" value={id} />
        <span>Delete &ldquo;{title.slice(0, 24)}…&rdquo;?</span>
        <button
          type="submit"
          className="button danger-button small-button"
          disabled={pending}
        >
          {pending ? "Deleting…" : "Yes, Delete"}
        </button>
        <button
          type="button"
          className="button ghost small-button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="button danger-ghost-button small-button"
        onClick={() => setConfirming(true)}
        title="Delete announcement"
      >
        <Trash2 size={14} /> Delete
      </button>
      {state.message && !state.ok && (
        <span className="inline-feedback error">{state.message}</span>
      )}
    </div>
  );
}

export function AnnouncementManager({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [state, action, pending] = useActionState(saveAnnouncementAction, initial);
  const [selectedLevel, setSelectedLevel] = useState<AnnouncementLevel>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [customTime, setCustomTime] = useState("");

  const handleFormReset = () => {
    setTitle("");
    setBody("");
    setCustomTime("");
    setSelectedLevel("general");
  };

  return (
    <div className="announcements-admin-container">
      <div className="announcements-admin-grid">
        {/* Creator Column */}
        <section className="admin-panel-card post-card">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">Public Broadcasting</span>
              <h2>Post Announcement</h2>
            </div>
            <Link href="/announcements" target="_blank" className="preview-link">
              <span>View Public Page</span>
              <ExternalLink size={14} />
            </Link>
          </div>
          <p className="card-subtitle">
            Publish official bulletins, fixture delays, check-in instructions, or emergency notices directly to the website.
          </p>

          {state.message && (
            <div
              className={`admin-feedback ${state.ok ? "success" : "error"}`}
              role={state.ok ? "status" : "alert"}
            >
              {state.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{state.message}</span>
            </div>
          )}

          <form
            action={async (formData) => {
              await action(formData);
              if (state.ok) handleFormReset();
            }}
            className="organizer-form announcement-form"
          >
            <div>
              <label className="field-label">Notice Priority & Type</label>
              <div className="level-radio-group">
                {LEVELS.map((lvl) => {
                  const Icon = lvl.icon;
                  const isChecked = selectedLevel === lvl.value;
                  return (
                    <label
                      key={lvl.value}
                      className={`level-radio-card ${lvl.value} ${isChecked ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={lvl.value}
                        checked={isChecked}
                        onChange={() => setSelectedLevel(lvl.value)}
                        className="sr-only"
                      />
                      <Icon size={16} />
                      <div>
                        <strong>{lvl.label}</strong>
                        <small>{lvl.description}</small>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <label>
              Announcement Headline
              <input
                name="title"
                placeholder="e.g. Rain Delay: Badminton Quarters postponed to 4:00 PM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                required
              />
              <span className="input-hint">{title.length} / 150 characters</span>
            </label>

            <label>
              Custom Time / Day Tag (Optional)
              <input
                name="time"
                placeholder="e.g. Day 2 · 3:45 PM (leave blank for current timestamp)"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                maxLength={50}
              />
              <span className="input-hint">Leave blank to automatically use current time.</span>
            </label>

            <label>
              Detailed Message
              <textarea
                name="body"
                rows={5}
                placeholder="Provide clear details, instructions, affected batches, or new venue directions…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
              />
              <span className="input-hint">{body.length} / 2000 characters</span>
            </label>

            <div className="form-action-row">
              <button
                type="submit"
                className="button organizer-primary"
                disabled={pending}
              >
                <Send size={16} />
                {pending ? "Publishing Notice…" : "Publish Announcement"}
              </button>
              {(title || body || customTime) && (
                <button
                  type="button"
                  className="button ghost"
                  onClick={handleFormReset}
                  disabled={pending}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Live List Column */}
        <section className="admin-panel-card list-card">
          <div className="card-header-row">
            <div>
              <span className="eyebrow">Live Feed</span>
              <h2>Published Notices ({announcements.length})</h2>
            </div>
          </div>
          <p className="card-subtitle">
            All notices currently visible to students and participants on the public site and search.
          </p>

          <div className="announcements-admin-list">
            {announcements.map((item) => (
              <article key={item.id} className={`admin-notice-item ${item.level}`}>
                <div className="notice-item-head">
                  <div className="notice-badges">
                    <LevelBadge level={item.level} />
                    <span className="notice-time-badge">
                      <Clock size={12} /> {item.time}
                    </span>
                  </div>
                  <AnnouncementDeleteButton id={item.id} title={item.title} />
                </div>
                <h3 className="notice-item-title">{item.title}</h3>
                <div className="notice-item-body">
                  <AnnouncementBody content={item.body} />
                </div>
                {item.authorName && (
                  <footer className="notice-item-author">
                    Posted by: <span>{item.authorName}</span>
                  </footer>
                )}
              </article>
            ))}

            {announcements.length === 0 && (
              <div className="announcements-empty-state">
                <Megaphone size={40} />
                <h3>No announcements published yet</h3>
                <p>Use the form on the left to broadcast match schedule updates, weather delays, or reminders.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
