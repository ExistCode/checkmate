import React from "react";
import { OriginTracingDiagram } from "./analysis";

// Lightweight URL hostname extraction safe for client/server
function getHostnameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Simple client-safe credibility heuristic (0-100)
function computeCredibilityFromUrl(url: string): number {
  const host = getHostnameFromUrl(url) || "";
  const h = host.toLowerCase();
  const high: string[] = [
    "reuters.com",
    "apnews.com",
    "associatedpress.com",
    "bbc.com",
    "bbc.co.uk",
    "npr.org",
    "factcheck.org",
    "snopes.com",
    "politifact.com",
    "washingtonpost.com",
    "nytimes.com",
    "nature.com",
    "sciencemag.org",
  ];
  if (h.endsWith(".gov") || h.endsWith(".gov.uk") || h.endsWith(".edu") || h.includes("who.int") || h.includes("nih.gov") || h.includes("cdc.gov")) {
    return 95;
  }
  if (high.some((d) => h.endsWith(d))) return 92;
  if (h.includes("medium.com") || h.includes("substack.com")) return 65;
  if (h.includes("twitter.com") || h.includes("x.com") || h.includes("facebook.com") || h.includes("tiktok.com") || h.includes("youtube.com")) return 55;
  return 60;
}

function extractMarkdownLinks(text: string): Array<{ title: string; url: string }> {
  const links: Array<{ title: string; url: string }> = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    links.push({ title: match[1], url: match[2] });
  }
  // Deduplicate by url
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
}

function findSection(text: string, titles: string[]): { start: number; end: number } | null {
  const lines = text.split("\n");
  const headerRegex = /^(#{1,6})\s+(.+)$|^\*\*([^*]+):\*\*$/; // markdown or legacy **Header:**
  const normalizedTitles = titles.map((t) => t.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(headerRegex);
    if (m) {
      const headerText = (m[2] || m[3] || "").toLowerCase();
      if (normalizedTitles.some((t) => headerText.includes(t))) {
        // find end until next header
        let j = i + 1;
        for (; j < lines.length; j++) {
          const l2 = lines[j].trim();
          if (headerRegex.test(l2)) break;
        }
        return { start: i + 1, end: j };
      }
    }
  }
  return null;
}

function parseVerdict(text: string): "verified" | "misleading" | "false" | "unverified" | "satire" | undefined {
  const m = text.match(/verdict\s*[:\-]\s*([a-zA-Z\s]+)/i);
  if (!m) return undefined;
  const v = m[1].trim().toLowerCase();
  if (/(true|accurate|verified)/.test(v)) return "verified";
  if (/(partly|partial|partially|mixed|misleading)/.test(v)) return "misleading";
  if (/(false|fake|fabricated)/.test(v)) return "false";
  if (/(satire)/.test(v)) return "satire";
  if (/(unverified|unknown|unclear)/.test(v)) return "unverified";
  return undefined;
}

function parseOriginTracing(content: string) {
  const originSection = findSection(content, ["origin tracing", "origin", "original source", "hypothesized origin"]);
  const timelineSection = findSection(content, ["first seen", "timeline", "first appearance"]);
  const propagationSection = findSection(content, ["propagation", "spread", "amplification", "platforms"]);
  const sourcesSection = findSection(content, ["sources", "references", "citations", "fact check sources"]);
  const beliefsSection = findSection(content, ["belief drivers", "why people believe", "cognitive biases"]);

  const lines = content.split("\n");

  // Hypothesized origin: first non-empty line from origin section
  let hypothesizedOrigin: string | undefined;
  if (originSection) {
    const slice = lines.slice(originSection.start, originSection.end).map((l) => l.trim()).filter(Boolean);
    hypothesizedOrigin = slice[0];
  }

  // First seen dates: bullet lines with optional (YYYY-MM-DD)
  const firstSeenDates: Array<{ source: string; date?: string; url?: string }> = [];
  if (timelineSection) {
    const slice = lines.slice(timelineSection.start, timelineSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (!/^[-*]\s+/.test(l)) continue;
      const dateMatch = l.match(/\((\d{4}-\d{2}-\d{2})\)/);
      const linkMatch = l.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      let sourceText = l.replace(/^[-*]\s+/, "");
      if (linkMatch) sourceText = linkMatch[1];
      firstSeenDates.push({ source: sourceText.replace(/\s*\(.*?\)\s*$/, "").trim(), date: dateMatch?.[1], url: linkMatch?.[2] });
    }
  }

  // Propagation paths: bullet lines under section
  const propagationPaths: string[] = [];
  if (propagationSection) {
    const slice = lines.slice(propagationSection.start, propagationSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (/^[-*]\s+/.test(l)) {
        const text = l.replace(/^[-*]\s+/, "").trim();
        if (text) propagationPaths.push(text);
      }
    }
  }

  // Sources: prefer links in Sources section; fallback to all links
  let linkPool: Array<{ title: string; url: string }> = [];
  if (sourcesSection) {
    const slice = lines.slice(sourcesSection.start, sourcesSection.end).join("\n");
    linkPool = extractMarkdownLinks(slice);
  }
  if (linkPool.length === 0) {
    linkPool = extractMarkdownLinks(content);
  }
  const sources = linkPool.map((l) => ({ url: l.url, title: l.title, credibility: computeCredibilityFromUrl(l.url) }));

  // Belief drivers: lines like - **Name:** description
  const beliefDrivers: Array<{ name: string; description: string; references?: Array<{ title: string; url: string }> }> = [];
  if (beliefsSection) {
    const slice = lines.slice(beliefsSection.start, beliefsSection.end);
    for (const raw of slice) {
      const l = raw.trim();
      if (/^[-*]\s+\*\*[^*]+:\*\*/.test(l)) {
        const m = l.match(/^[-*]\s+\*\*([^*]+):\*\*\s*(.*)$/);
        if (m) beliefDrivers.push({ name: m[1].trim(), description: m[2].trim() });
      }
    }
  }

  const verdict = parseVerdict(content);

  return {
    originTracing: {
      hypothesizedOrigin,
      firstSeenDates: firstSeenDates.length ? firstSeenDates : undefined,
      propagationPaths: propagationPaths.length ? propagationPaths : undefined,
    },
    beliefDrivers,
    sources,
    verdict,
  };
}

/**
 * AnalysisRenderer - Enhanced component to render markdown-like analysis content
 *
 * Supported heading formats:
 * - # Heading 1 (h1 - text-2xl)
 * - ## Heading 2 (h2 - text-xl)
 * - ### Heading 3 (h3 - text-lg)
 * - #### Heading 4 (h4 - text-base)
 * - ##### Heading 5 (h5 - text-sm font-medium)
 * - ###### Heading 6 (h6 - text-sm)
 * - **Legacy Header:** (converted to h3)
 *
 * Also supports:
 * - **Bold text**
 * - *Italic text*
 * - `Code snippets`
 * - [Links](https://example.com)
 * - - Bullet points
 * - - **Sub-headers:** with content
 */
export function AnalysisRenderer({ content }: { content: string }) {
  // Guard against null, undefined, or empty content
  if (!content || typeof content !== "string" || content.trim() === "") {
    return null;
  }

  const diagram = parseOriginTracing(content);

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements = [];
    let currentSection = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for markdown-style headers (# ## ### etc.)
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Process any accumulated content before this header
        if (currentSection.length > 0) {
          elements.push(
            <div key={`section-${i}`} className="mb-4">
              {renderSectionContent(currentSection.join("\n"))}
            </div>
          );
          currentSection = [];
        }

        // Render the header
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        elements.push(renderHeader(headerText, level, `header-${i}`));
        continue;
      }

      // Check for legacy **Header:** format
      const legacyHeaderMatch = trimmedLine.match(/^\*\*([^*]+):\*\*$/);
      if (legacyHeaderMatch) {
        // Process any accumulated content before this header
        if (currentSection.length > 0) {
          elements.push(
            <div key={`section-${i}`} className="mb-4">
              {renderSectionContent(currentSection.join("\n"))}
            </div>
          );
          currentSection = [];
        }

        // Render as h3 by default for legacy format
        elements.push(
          renderHeader(legacyHeaderMatch[1], 3, `legacy-header-${i}`)
        );
        continue;
      }

      // Accumulate regular content
      currentSection.push(line);
    }

    // Process any remaining content
    if (currentSection.length > 0) {
      elements.push(
        <div key="final-section" className="mb-4">
          {renderSectionContent(currentSection.join("\n"))}
        </div>
      );
    }

    return elements.length > 0 ? elements : renderParagraphs(text);
  };

  const renderHeader = (text: string, level: number, key: string) => {
    const baseClasses = "font-semibold mb-3 text-foreground";
    const levelClasses: Record<number, string> = {
      1: "text-2xl", // h1
      2: "text-xl", // h2
      3: "text-lg", // h3
      4: "text-base", // h4
      5: "text-sm font-medium", // h5
      6: "text-sm", // h6
    };

    const className = `${baseClasses} ${levelClasses[level] || levelClasses[4]}`;

    switch (level) {
      case 1:
        return (
          <h1 key={key} className={className}>
            {text}
          </h1>
        );
      case 2:
        return (
          <h2 key={key} className={className}>
            {text}
          </h2>
        );
      case 3:
        return (
          <h3 key={key} className={className}>
            {text}
          </h3>
        );
      case 4:
        return (
          <h4 key={key} className={className}>
            {text}
          </h4>
        );
      case 5:
        return (
          <h5 key={key} className={className}>
            {text}
          </h5>
        );
      case 6:
        return (
          <h6 key={key} className={className}>
            {text}
          </h6>
        );
      default:
        return (
          <h4 key={key} className={className}>
            {text}
          </h4>
        );
    }
  };

  const renderSectionContent = (content: string) => {
    const lines = content.split("\n").filter((line) => line.trim());
    const elements = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("- **") && line.includes(":**")) {
        // Sub-header with content
        const match = line.match(/- \*\*([^*]+):\*\*(.*)/);
        if (match) {
          elements.push(
            <div key={i} className="mb-3">
              <h5 className="font-medium text-sm mb-1 text-foreground">
                {match[1]}
              </h5>
              <div className="pl-3">{renderText(match[2])}</div>
            </div>
          );
        }
      } else if (line.startsWith("- ")) {
        // Regular bullet point
        elements.push(
          <div key={i} className="flex items-start gap-2 mb-2">
            <span className="text-primary mt-1 text-xs">•</span>
            <div className="flex-1 text-sm leading-relaxed">
              {renderText(line.substring(2))}
            </div>
          </div>
        );
      } else if (line.trim()) {
        // Regular paragraph
        elements.push(
          <div key={i} className="mb-2 text-sm leading-relaxed">
            {renderText(line)}
          </div>
        );
      }
    }

    return elements;
  };

  const renderParagraphs = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
    if (paragraphs.length <= 1) {
      return renderText(text);
    }

    return paragraphs.map((paragraph, index) => (
      <div key={index} className="mb-3 last:mb-0">
        {renderText(paragraph.trim())}
      </div>
    ));
  };

  const renderText = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const remaining = text;
    let keyCounter = 0;

    // Combined regex for all inline elements
    const markdownRegex =
      /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = markdownRegex.exec(remaining)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(remaining.substring(lastIndex, match.index));
      }

      const fullMatch = match[1];
      const boldText = match[2];
      const italicText = match[3];
      const codeText = match[4];
      const linkText = match[5];
      const linkUrl = match[6];

      if (boldText) {
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-semibold">
            {boldText}
          </strong>
        );
      } else if (italicText) {
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic">
            {italicText}
          </em>
        );
      } else if (codeText) {
        parts.push(
          <code
            key={`code-${keyCounter++}`}
            className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-muted-foreground"
          >
            {codeText}
          </code>
        );
      } else if (linkText && linkUrl) {
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline font-medium"
          >
            {linkText}
          </a>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-4">
      {/* Origin Tracing Diagram rendered above the analysis text */}
      <OriginTracingDiagram
        originTracing={diagram.originTracing}
        beliefDrivers={diagram.beliefDrivers}
        sources={diagram.sources}
        verdict={diagram.verdict}
        content={content}
      />
      {renderContent(content)}
    </div>
  );
}
