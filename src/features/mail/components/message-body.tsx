"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

const plainTextClassName =
  "whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground/90 [overflow-wrap:anywhere]";

const htmlBodyClassName =
  "email-html-body max-w-none text-[15px] leading-7 text-foreground/90 [overflow-wrap:anywhere]";

interface MessageBodyProps {
  bodyHtml?: string;
  bodyText?: string;
}

function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}

export function MessageBody({ bodyHtml, bodyText }: MessageBodyProps) {
  const sanitizedHtml = useMemo(
    () => (bodyHtml ? sanitizeEmailHtml(bodyHtml) : null),
    [bodyHtml],
  );

  if (sanitizedHtml) {
    return (
      <div
        className={htmlBodyClassName}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  if (bodyText) {
    return <div className={plainTextClassName}>{bodyText}</div>;
  }

  return <div className={plainTextClassName}>(No message body)</div>;
}
