import { ASSISTANT_ANIMATION } from "@/features/assistant/constants";
import type { AssistantComposeDraftStatus } from "@/features/assistant/types/assistant-message";
import {
  emptyComposeDraft,
  isComposeDraft,
  type AssistantDraft,
  type ComposeDraft,
  type ReplyDraft,
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

function typeComposeField(
  field: keyof ComposeDraft,
  fullValue: string,
  durationMs: number,
  status: AssistantComposeDraftStatus,
  baseDraft: ComposeDraft,
  schedule: AnimationSchedule,
  elapsedRef: { value: number },
  onStep: (draft: AssistantDraft, status: AssistantComposeDraftStatus) => void,
) {
  const length = fullValue.length;

  if (length === 0) {
    schedule(() => onStep({ ...baseDraft, [field]: "" }, status), elapsedRef.value);
    elapsedRef.value += durationMs;
    return;
  }

  const stepMs = durationMs / length;

  for (let index = 1; index <= length; index++) {
    const partial = fullValue.slice(0, index);
    const draft = { ...baseDraft, [field]: partial };

    schedule(() => onStep(draft, status), elapsedRef.value + stepMs * index);
  }

  elapsedRef.value += durationMs;
}

function runComposeDraftAnimation(
  target: ComposeDraft,
  schedule: AnimationSchedule,
  onStep: (draft: AssistantDraft, status: AssistantComposeDraftStatus) => void,
  onComplete: () => void,
) {
  const elapsedRef = { value: ASSISTANT_ANIMATION.prepareDelayMs };

  typeComposeField(
    "to",
    target.to,
    ASSISTANT_ANIMATION.typeToDurationMs,
    "typing_to",
    emptyComposeDraft,
    schedule,
    elapsedRef,
    onStep,
  );

  const afterTo: ComposeDraft = {
    kind: "compose",
    to: target.to,
    subject: "",
    body: "",
  };

  typeComposeField(
    "subject",
    target.subject,
    ASSISTANT_ANIMATION.typeSubjectDurationMs,
    "typing_subject",
    afterTo,
    schedule,
    elapsedRef,
    onStep,
  );

  const afterSubject: ComposeDraft = {
    kind: "compose",
    to: target.to,
    subject: target.subject,
    body: "",
  };

  typeComposeField(
    "body",
    target.body,
    ASSISTANT_ANIMATION.typeBodyDurationMs,
    "typing_body",
    afterSubject,
    schedule,
    elapsedRef,
    onStep,
  );

  schedule(() => {
    onStep(target, "draft");
    onComplete();
  }, elapsedRef.value);
}

function runReplyDraftAnimation(
  target: ReplyDraft,
  schedule: AnimationSchedule,
  onStep: (draft: AssistantDraft, status: AssistantComposeDraftStatus) => void,
  onComplete: () => void,
) {
  const elapsedRef = { value: ASSISTANT_ANIMATION.prepareDelayMs };
  const baseDraft: ReplyDraft = { ...target, body: "" };
  const length = target.body.length;
  const durationMs = ASSISTANT_ANIMATION.typeBodyDurationMs;

  if (length === 0) {
    schedule(() => onStep({ ...baseDraft, body: "" }, "typing_body"), elapsedRef.value);
    elapsedRef.value += durationMs;
    schedule(() => {
      onStep(target, "draft");
      onComplete();
    }, elapsedRef.value);
    return;
  }

  const stepMs = durationMs / length;

  for (let index = 1; index <= length; index++) {
    const partial = target.body.slice(0, index);
    const draft = { ...baseDraft, body: partial };

    schedule(
      () => onStep(draft, "typing_body"),
      elapsedRef.value + stepMs * index,
    );
  }

  elapsedRef.value += durationMs;

  schedule(() => {
    onStep(target, "draft");
    onComplete();
  }, elapsedRef.value);
}

export function runDraftTypingAnimation(
  target: AssistantDraft,
  schedule: AnimationSchedule,
  onStep: (draft: AssistantDraft, status: AssistantComposeDraftStatus) => void,
  onComplete: () => void,
) {
  if (isComposeDraft(target)) {
    runComposeDraftAnimation(target, schedule, onStep, onComplete);
    return;
  }

  runReplyDraftAnimation(target, schedule, onStep, onComplete);
}
