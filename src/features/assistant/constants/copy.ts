export const ASSISTANT_COPY = {
  draftReady: `Done! Here's the draft.

When you're happy with it, you can:
• reply "Send it"
• say "Make it shorter" or "Change the subject"
• edit the fields yourself
• or click Send below.`,

  draftUpdated: `Updated the draft.

Review the changes, then say "Send it" when you're ready—or keep editing.`,

  noActiveDraft:
    "There isn't an active draft to send. Would you like to compose a new email?",

  unavailable: "The assistant is unavailable. Try again in a moment.",

  composeCard: {
    preparing: "Preparing draft...",
    preparingRevise: "Updating draft...",
    writing: "Writing draft...",
    writingRevise: "Updating draft...",
    sending: "Sending...",
    sentTitle: "Email sent",
    draftTitle: "Draft email",
    replyTitle: "Reply",
    replyPreparing: "Preparing reply...",
    replyPreparingRevise: "Updating reply...",
    replyWriting: "Writing reply...",
    replyWritingRevise: "Updating reply...",
    replySentTitle: "Reply sent",
    supersededLabel: "Superseded",
    supersededTitle: "Draft email (superseded)",
    sendButton: "Send",
  },

  panel: {
    title: "CommandMail AI",
    typing: "Typing...",
    emptyHeading: "How can I help today?",
    inputPlaceholder: "Ask CommandMail AI...",
    openLabel: "Open CommandMail AI",
    closeLabel: "Close assistant",
    sendLabel: "Send message",
    voiceLabel: "Voice input (coming soon)",
  },
} as const;
