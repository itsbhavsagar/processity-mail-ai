"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useMemo, useRef, useState } from "react";

// Base styling injected INTO the isolated document. The app's Tailwind reset
// never reaches here, so emails render with their own CSS — like Gmail. Font
// size is nudged down to ~13px for density; emails with their own sizes win.
const FRAME_BASE_STYLES = `
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #202124;
    background: #ffffff;
    padding: 16px;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  * { box-sizing: border-box; }
  img { max-width: 100%; height: auto; }
  a { color: #1a73e8; }
  table { max-width: 100%; }
`;

function sanitizeEmailHtml(html: string): string {
  // Keep <style>, inline styles, tables and images so the layout survives;
  // strip anything executable or interactive.
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["style"],
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["srcdoc"],
  });
}

function buildSrcDoc(html: string): string {
  // `<base target="_blank">` makes every link open in a new tab.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"><style>${FRAME_BASE_STYLES}</style></head><body>${sanitizeEmailHtml(html)}</body></html>`;
}

interface EmailHtmlFrameProps {
  html: string;
}

export function EmailHtmlFrame({ html }: EmailHtmlFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const srcDoc = useMemo(() => buildSrcDoc(html), [html]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    let cancelled = false;

    const measure = () => {
      const doc = frame.contentDocument;
      if (!doc || cancelled) {
        return;
      }
      const next =
        doc.documentElement.scrollHeight || doc.body?.scrollHeight || 0;
      if (next > 0) {
        setHeight(next);
      }
    };

    const handleLoad = () => {
      measure();
      const doc = frame.contentDocument;
      if (!doc) {
        return;
      }
      // Images change layout height only after they load — re-measure then.
      doc.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", measure, { once: true });
          img.addEventListener("error", measure, { once: true });
        }
      });
    };

    frame.addEventListener("load", handleLoad);
    if (frame.contentDocument?.readyState === "complete") {
      handleLoad();
    }

    window.addEventListener("resize", measure);

    return () => {
      cancelled = true;
      frame.removeEventListener("load", handleLoad);
      window.removeEventListener("resize", measure);
    };
  }, [srcDoc]);

  return (
    <iframe
      ref={frameRef}
      title="Email message"
      srcDoc={srcDoc}
      // No `allow-scripts`: email JavaScript can never run. `allow-same-origin`
      // (safe without scripts) lets the parent measure content height so the
      // frame auto-grows instead of showing an inner scrollbar.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      loading="lazy"
      className="block w-full border-0 bg-white"
      style={{ height }}
    />
  );
}
