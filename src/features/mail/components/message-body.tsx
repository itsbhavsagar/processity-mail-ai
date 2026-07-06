"use client";

import { EmailHtmlFrame } from "./email-html-frame";

// Plain-text fallback (emails with no HTML part). Rendered on the same white
// sheet as HTML emails so both look consistent.
const plainTextClassName =
  "whitespace-pre-wrap break-words px-4 py-4 text-[14px] leading-6 text-neutral-800 [overflow-wrap:anywhere]";

interface MessageBodyProps {
  bodyHtml?: string;
  bodyText?: string;
}

export function MessageBody({ bodyHtml, bodyText }: MessageBodyProps) {
  if (bodyHtml) {
    return <EmailHtmlFrame html={bodyHtml} />;
  }

  if (bodyText) {
    return <div className={plainTextClassName}>{bodyText}</div>;
  }

  return <div className={plainTextClassName}>(No message body)</div>;
}
