interface AssistantTypingIndicatorProps {
  className?: string;
}

export function AssistantTypingIndicator({
  className,
}: AssistantTypingIndicatorProps) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <div className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/80"
            style={{ animationDelay: `${index * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
