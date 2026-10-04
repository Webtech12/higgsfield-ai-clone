"use client";

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FadeInImage,
} from "@/shared/ui";

import type { TalentCardModel } from "../model/talentCard";

/** The full profile in a dialog: every photo, the bio and the consent on file (ADR-024). */
export function TalentProfile({
  talent,
  trigger,
  action,
}: {
  talent: TalentCardModel;
  trigger: ReactNode;
  /** E.g. "Cast Ava": rendered at the foot of the profile. */
  action?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <div>
          <DialogTitle>{talent.name}</DialogTitle>
          <DialogDescription>{talent.tagline}</DialogDescription>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {talent.photos.map((photo) => (
            <li
              key={photo.url}
              className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted"
            >
              <FadeInImage
                src={photo.url}
                alt={photo.alt}
                className="absolute inset-0 size-full object-cover"
              />
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed">{talent.bio}</p>
        <div className="flex gap-2.5 rounded-md border border-border bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <p>
            <span className="font-medium text-foreground">{talent.consentLine}.</span>{" "}
            {talent.consentScope}
          </p>
        </div>
        {action}
      </DialogContent>
    </Dialog>
  );
}
