import { randomUUID } from "node:crypto";

/** Readable, prefixed ids (prj_…, sht_…, ast_…) so logs and URLs say what they point at. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
