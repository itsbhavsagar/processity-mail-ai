import { ASSISTANT_ANIMATION } from "@/features/assistant/constants";
import type { AssistantComposeDraftStatus } from "@/features/assistant/types/assistant-message";
import {
  emptyComposeDraft,
  type ComposeDraft,
} from "@/features/mail/types/compose-draft";

type AnimationSchedule = (callback: () => void, delay: number) => void;

export function typeAssistantMessage(
  text: string,
  schedule: AnimationSchedule,
  onStep: (partialText: string) => void,
  onComplete: () => void,
) {
  const { messageTypingSpeedMs } = ASSISTANT_ANIMATION;
  let elapsed = 0;

  if (text.length === 0) {
    schedule(() => {
      onStep("");
      onComplete();
    }, elapsed);
    return;
  }

  for (let index = 1; index <= text.length; index++) {
    const partial = text.slice(0, index);
    schedule(() => onStep(partial), elapsed + messageTypingSpeedMs * index);
  }

  elapsed += messageTypingSpeedMs * text.length;
  schedule(onComplete, elapsed);
}

export function runComposeTypingAnimation(
  target: ComposeDraft,
  schedule: AnimationSchedule,
  onStep: (draft: ComposeDraft, status: AssistantComposeDraftStatus) => void,
  onComplete: () => void,
) {
  let elapsed = ASSISTANT_ANIMATION.prepareDelayMs;

  const typeField = (
    field: keyof ComposeDraft,
    fullValue: string,
    durationMs: number,
    status: AssistantComposeDraftStatus,
    baseDraft: ComposeDraft,
  ) => {
    const length = fullValue.length;

    if (length === 0) {
      schedule(() => onStep({ ...baseDraft, [field]: "" }, status), elapsed);
      elapsed += durationMs;
      return;
    }

    const stepMs = durationMs / length;

    for (let index = 1; index <= length; index++) {
      const partial = fullValue.slice(0, index);
      const draft = { ...baseDraft, [field]: partial };

      schedule(() => onStep(draft, status), elapsed + stepMs * index);
    }

    elapsed += durationMs;
  };

  typeField(
    "to",
    target.to,
    ASSISTANT_ANIMATION.typeToDurationMs,
    "typing_to",
    emptyComposeDraft,
  );

  const afterTo: ComposeDraft = {
    to: target.to,
    subject: "",
    body: "",
  };

  typeField(
    "subject",
    target.subject,
    ASSISTANT_ANIMATION.typeSubjectDurationMs,
    "typing_subject",
    afterTo,
  );

  const afterSubject: ComposeDraft = {
    to: target.to,
    subject: target.subject,
    body: "",
  };

  typeField(
    "body",
    target.body,
    ASSISTANT_ANIMATION.typeBodyDurationMs,
    "typing_body",
    afterSubject,
  );

  schedule(() => {
    onStep(target, "draft");
    onComplete();
  }, elapsed);
}
