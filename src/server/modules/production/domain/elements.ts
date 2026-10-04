/**
 * A person or object the video model keeps consistent in motion, from their photos (ADR-026): the
 * frame starts the shot, and the elements keep the talent's face and the product's label as it moves.
 */
export interface VideoElement {
  role: "talent" | "product";
  /** Best photo first: it is the element's main, frontal view. */
  imageUrls: string[];
}

/** A frontal view and up to three more angles: Kling's limit per element. */
export const MAX_ELEMENT_PHOTOS = 4;

const ROLES = ["talent", "product"] as const;

/** The talent and the product as video elements, in that order, each only if there are photos. */
export function videoElements(photos: Record<VideoElement["role"], string[]>): VideoElement[] {
  return ROLES.flatMap((role) =>
    photos[role].length > 0 ? [{ role, imageUrls: photos[role].slice(0, MAX_ELEMENT_PHOTOS) }] : [],
  );
}
