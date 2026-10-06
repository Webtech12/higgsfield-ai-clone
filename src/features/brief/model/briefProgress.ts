import { AD_FIELD_LIMITS, AD_TEMPLATES, type AdTemplateId } from "@/contracts/ad";

/**
 * What the brief still needs, in the brand's words (ADR-028): the "Your ad" panel lists it, so the
 * Create button's state is never a mystery. Required steps block nothing by themselves: pressing
 * Create still explains each missing field where it is.
 */

export type BriefCheckId = "product" | "benefit" | "talent" | "photo";

export interface BriefCheck {
  id: BriefCheckId;
  label: string;
  isDone: boolean;
  isRequired: boolean;
}

export interface BriefProgress {
  checks: BriefCheck[];
  requiredLeft: number;
  isReady: boolean;
  /** "Ready to create", "1 step left" */
  summary: string;
}

export function briefProgress(brief: {
  template: AdTemplateId;
  productName: string;
  benefit: string;
  talentId: string | null;
  productPhotos: number;
}): BriefProgress {
  const needsTalent = AD_TEMPLATES[brief.template].needsTalent;
  const checks: BriefCheck[] = [
    {
      id: "product",
      label: "Name the product",
      isDone: brief.productName.trim().length >= AD_FIELD_LIMITS.productName.min,
      isRequired: true,
    },
    {
      id: "benefit",
      label: "Say why it matters",
      isDone: brief.benefit.trim().length >= AD_FIELD_LIMITS.benefit.min,
      isRequired: true,
    },
    needsTalent
      ? { id: "talent", label: "Cast a talent", isDone: brief.talentId !== null, isRequired: true }
      : { id: "talent", label: "No talent needed", isDone: true, isRequired: false },
    {
      id: "photo",
      label: "Add a product photo",
      isDone: brief.productPhotos > 0,
      isRequired: false,
    },
  ];
  const requiredLeft = checks.filter((check) => check.isRequired && !check.isDone).length;
  return {
    checks,
    requiredLeft,
    isReady: requiredLeft === 0,
    summary:
      requiredLeft === 0
        ? "Ready to create"
        : `${String(requiredLeft)} ${requiredLeft === 1 ? "step" : "steps"} left`,
  };
}

export interface SubmitStatus {
  text: string;
  isAlert: boolean;
}

/** The line under the Create button: the most useful thing to know right now. */
export function submitStatus(state: {
  error: string | null;
  isUploading: boolean;
  isSubmittedInvalid: boolean;
}): SubmitStatus {
  if (state.error) return { text: state.error, isAlert: true };
  if (state.isUploading) {
    return { text: "Waiting for your photos to finish uploading…", isAlert: false };
  }
  if (state.isSubmittedInvalid) return { text: "Check the highlighted fields.", isAlert: true };
  return { text: "Free · storyboards in about a minute", isAlert: false };
}
