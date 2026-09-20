"use client";

import { useState, useActionState } from "react";
import { BookOpen, ChevronDown, ChevronUp, AlertCircle, Trophy, Edit3, X, Check, Save } from "lucide-react";
import { gameRules, type GameRule } from "@/lib/data";
import { updateSportRulesAction, type ActionResult } from "@/app/admin/rules-actions";

const initialAction: ActionResult = { ok: false, message: "" };

export function GameRulesCard({
  sportSlug,
  initialRule,
  editable = false,
}: {
  sportSlug: string;
  initialRule?: GameRule | null;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateSportRulesAction, initialAction);

  // Fallback to in-memory gameRules or generic
  const rule: GameRule = initialRule || gameRules[sportSlug] || {
    sportSlug,
    title: `${sportSlug.toUpperCase()} খেলার নিয়মাবলি`,
    format: "knockout",
    advancement: "সিঙ্গেল এলিমিনেশন নকআউট · বিজয়ী পরবর্তী রাউন্ডে উত্তীর্ণ হবে",
    rules: ["অফিসিয়াল টুর্নামেন্ট নিয়মাবলি অনুসরণ করা হবে।"],
    rounds: "নকআউট রাউন্ড",
    tiebreaker: "টাই হলে অতিরিক্ত সময় বা টাইব্রেকার অনুষ্ঠিত হবে।"
  };

  return (
    <div className="game-rules-card">
      <div className="game-rules-header">
        <button
          type="button"
          className="game-rules-header-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <div className="game-rules-title-group">
            <BookOpen size={18} className="game-rules-icon" />
            <div>
              <h3>{rule.title}</h3>
              <span className="game-rules-sub">অফিসিয়াল টুর্নামেন্ট ফরম্যাট ও খেলার নিয়মাবলি</span>
            </div>
          </div>
          <div className="game-rules-toggle">
            <span className="game-rules-badge">
              {rule.format === "flexible" ? "Flexible / Battle Royale" : rule.format === "knockout" ? "Knockout Bracket" : "League"}
            </span>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {editable && (
          <button
            type="button"
            className="game-rules-edit-btn"
            onClick={() => setEditing(!editing)}
            title={editing ? "Cancel editing" : "Edit rules"}
          >
            {editing ? <X size={15} /> : <Edit3 size={15} />}
            <span>{editing ? "Cancel" : "Edit Rules"}</span>
          </button>
        )}
      </div>

      {open && (
        <div className="game-rules-body">
          {/* Feedback message */}
          {state.message && (
            <p className={`admin-feedback ${state.ok ? "success" : "error"}`} role="alert">
              {state.message}
            </p>
          )}

          {editing ? (
            /* Admin Edit Form */
            <form action={formAction} className="game-rules-form organizer-form">
              <input type="hidden" name="sportSlug" value={rule.sportSlug} />

              <div className="form-row-2">
                <label>
                  Title (শিরোনাম)
                  <input
                    type="text"
                    name="title"
                    defaultValue={rule.title}
                    required
                  />
                </label>
                <label>
                  Format (খেলার ধরন)
                  <select name="format" defaultValue={rule.format}>
                    <option value="knockout">Knockout Bracket (1v1 / Head to Head)</option>
                    <option value="flexible">Flexible / Multi-Player / Battle Royale</option>
                    <option value="round_robin">Round Robin / League</option>
                  </select>
                </label>
              </div>

              <label>
                Advancement Criteria (উত্তীর্ণ হওয়ার নিয়ম)
                <input
                  type="text"
                  name="advancement"
                  defaultValue={rule.advancement}
                  placeholder="যেমন: গ্রুপ পর্বের প্রতি খেলা থেকে ৩ জন করে বিজয়ী নেওয়া হবে।"
                  required
                />
              </label>

              <label>
                Match Rules (খেলার নিয়মাবলি — প্রতি লাইনে ১টি নিয়ম)
                <textarea
                  name="rules"
                  rows={6}
                  defaultValue={rule.rules.join("\n")}
                  placeholder="১. নিয়মের বিবরণ লিখুন...&#10;২. পরবর্তী নিয়ম..."
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Rounds Info (ম্যাচ রাউন্ড — ঐচ্ছিক)
                  <input
                    type="text"
                    name="rounds"
                    defaultValue={rule.rounds || ""}
                    placeholder="যেমন: ৪ রাউন্ড / ১০ রাউন্ড"
                  />
                </label>
                <label>
                  Tiebreaker Rule (টাইব্রেকার নিয়ম — ঐচ্ছিক)
                  <input
                    type="text"
                    name="tiebreaker"
                    defaultValue={rule.tiebreaker || ""}
                    placeholder="যেমন: অতিরিক্ত ১টি রাউন্ড / সুপার ওভার"
                  />
                </label>
              </div>

              <div className="game-rules-form-actions">
                <button
                  type="submit"
                  disabled={pending}
                  className="organizer-primary"
                >
                  <Save size={15} />
                  <span>{pending ? "সংরক্ষণ করা হচ্ছে..." : "Save Rules (সংরক্ষণ করুন)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="filter"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <>
              {/* Advancement Banner */}
              <div className="game-rules-advancement">
                <Trophy size={16} />
                <div>
                  <strong>উত্তীর্ণ হওয়ার নিয়ম / Advancement:</strong>
                  <p>{rule.advancement}</p>
                </div>
              </div>

              {/* Detailed Rules List */}
              <div className="game-rules-list">
                <h4>খেলার নিয়মাবলি (Match Rules):</h4>
                <ol>
                  {rule.rules.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ol>
              </div>

              {/* Rounds & Tiebreakers if present */}
              {(rule.rounds || rule.tiebreaker) && (
                <div className="game-rules-extras">
                  {rule.rounds && (
                    <div className="game-rules-extra-item">
                      <span className="extra-label">ম্যাচের রাউন্ড / Rounds</span>
                      <span className="extra-val">{rule.rounds}</span>
                    </div>
                  )}
                  {rule.tiebreaker && (
                    <div className="game-rules-extra-item tiebreaker">
                      <span className="extra-label">
                        <AlertCircle size={14} /> টাইব্রেকার নিয়ম / Tiebreaker
                      </span>
                      <span className="extra-val">{rule.tiebreaker}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
