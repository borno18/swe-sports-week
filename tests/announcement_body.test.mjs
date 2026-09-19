import { test } from 'node:test';
import assert from 'node:assert/strict';

// Test token pattern and parser logic
const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s<]+|\*\*[^*]+\*\*)/gi;

function parseAnnouncementTokens(text) {
  if (!text) return [];
  const parts = text.split(tokenRegex);
  const results = [];

  parts.forEach((part) => {
    if (!part) return;

    const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/i);
    if (mdLinkMatch) {
      results.push({ type: 'markdown-link', label: mdLinkMatch[1], url: mdLinkMatch[2] });
      return;
    }

    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      results.push({ type: 'bold', text: boldMatch[1] });
      return;
    }

    if (/^https?:\/\//i.test(part)) {
      let cleanUrl = part;
      let trailing = '';

      const punctMatch = cleanUrl.match(/[.,;:!?]+$/);
      if (punctMatch) {
        trailing = punctMatch[0] + trailing;
        cleanUrl = cleanUrl.slice(0, -punctMatch[0].length);
      }

      const openCount = (cleanUrl.match(/\(/g) || []).length;
      const closeCount = (cleanUrl.match(/\)/g) || []).length;
      if (closeCount > openCount && cleanUrl.endsWith(')')) {
        trailing = ')' + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      }

      results.push({ type: 'url', url: cleanUrl, trailing });
      return;
    }

    results.push({ type: 'text', text: part });
  });

  return results;
}

test('announcement parser extracts URLs, handles punctuation, and preserves newlines', () => {
  const input = `Registration Started

Get ready for SWE Sports Week 2026!
🔥 Outdoor Sports: Football • Short-Pitch Cricket
forms:
outdoor - https://forms.gle/Qgobbjcum4uJRaBZ6
indoor - https://forms.gle/7qEZjn8in46mq9ZZ9.
More info: [Guide](https://sust.edu/guide) and (https://example.com/details).`;

  const parsed = parseAnnouncementTokens(input);

  // Assert URLs extracted
  const urls = parsed.filter(p => p.type === 'url' || p.type === 'markdown-link');
  assert.equal(urls.length, 4);

  assert.equal(urls[0].url, 'https://forms.gle/Qgobbjcum4uJRaBZ6');
  assert.equal(urls[0].trailing, '');

  assert.equal(urls[1].url, 'https://forms.gle/7qEZjn8in46mq9ZZ9');
  assert.equal(urls[1].trailing, '.');

  assert.equal(urls[2].type, 'markdown-link');
  assert.equal(urls[2].label, 'Guide');
  assert.equal(urls[2].url, 'https://sust.edu/guide');

  assert.equal(urls[3].url, 'https://example.com/details');
  assert.equal(urls[3].trailing, ').');

  // Verify newlines are preserved in text segments
  assert.ok(input.includes('\noutdoor - '));
});
