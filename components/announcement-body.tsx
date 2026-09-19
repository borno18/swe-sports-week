import React from "react";
import { ExternalLink } from "lucide-react";

interface AnnouncementBodyProps {
  content: string;
  className?: string;
}

/**
 * Tokenizes announcement text into:
 * 1. Markdown links: [label](url)
 * 2. Raw URLs: https://... or http://...
 * 3. Markdown bold: **bold text**
 * 4. Plain text with preserved line breaks
 */
function parseAnnouncementContent(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1) Markdown link: [text](https?://...)
  // 2) Raw URL: https://... or http://...
  // 3) Bold text: **text**
  const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s<]+|\*\*[^*]+\*\*)/gi;

  const parts = text.split(tokenRegex);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (!part) return;

    // 1. Markdown link: [text](url)
    const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/i);
    if (mdLinkMatch) {
      const [, label, url] = mdLinkMatch;
      nodes.push(
        <a
          key={`md-link-${idx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="announcement-link"
        >
          <span className="announcement-link-label">{label}</span>
          <ExternalLink size={12} className="announcement-link-icon" aria-hidden="true" />
        </a>
      );
      return;
    }

    // 2. Bold text: **text**
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      nodes.push(
        <strong key={`bold-${idx}`} className="announcement-bold">
          {boldMatch[1]}
        </strong>
      );
      return;
    }

    // 3. Raw URL: http:// or https://
    if (/^https?:\/\//i.test(part)) {
      let cleanUrl = part;
      let trailing = "";

      // Trim trailing punctuation: .,;:!?
      const punctMatch = cleanUrl.match(/[.,;:!?]+$/);
      if (punctMatch) {
        trailing = punctMatch[0] + trailing;
        cleanUrl = cleanUrl.slice(0, -punctMatch[0].length);
      }

      // Handle unmatched trailing parenthesis
      const openCount = (cleanUrl.match(/\(/g) || []).length;
      const closeCount = (cleanUrl.match(/\)/g) || []).length;
      if (closeCount > openCount && cleanUrl.endsWith(")")) {
        trailing = ")" + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      }

      nodes.push(
        <React.Fragment key={`raw-url-frag-${idx}`}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-link"
          >
            <span className="announcement-link-label">{cleanUrl}</span>
            <ExternalLink size={12} className="announcement-link-icon" aria-hidden="true" />
          </a>
          {trailing}
        </React.Fragment>
      );
      return;
    }

    // 4. Plain text
    nodes.push(<React.Fragment key={`text-${idx}`}>{part}</React.Fragment>);
  });

  return nodes;
}

export function AnnouncementBody({ content, className = "" }: AnnouncementBodyProps) {
  const elements = parseAnnouncementContent(content);

  return (
    <div className={`announcement-body-wrapper ${className}`}>
      {elements}
    </div>
  );
}
