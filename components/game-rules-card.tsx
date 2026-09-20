"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, AlertCircle, Trophy } from "lucide-react";
import { gameRules } from "@/lib/data";

export function GameRulesCard({ sportSlug }: { sportSlug: string }) {
  const [open, setOpen] = useState(true);
  const rule = gameRules[sportSlug];
  if (!rule) return null;

  return (
    <div className="game-rules-card">
      <button
        type="button"
        className="game-rules-header"
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

      {open && (
        <div className="game-rules-body">
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
        </div>
      )}
    </div>
  );
}
