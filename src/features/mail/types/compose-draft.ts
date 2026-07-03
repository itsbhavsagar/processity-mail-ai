export interface ComposeDraft {
  to: string;
  subject: string;
  body: string;
}

export const emptyComposeDraft: ComposeDraft = {
  to: "",
  subject: "",
  body: "",
};
