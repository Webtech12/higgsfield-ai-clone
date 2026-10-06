"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import type { WorkspaceView } from "@/contracts/project";
import { errorMessage } from "@/shared/lib/apiErrors";
import { Button } from "@/shared/ui";

import { useBoardActions } from "../hooks/useBoardActions";
import { DirectionList } from "./DirectionList";
import { PlanningProgress } from "./PlanningProgress";

/** The Board: the plan while it's written, then three storyboarded concepts to compare and pick from. */
export function Board({ view }: { view: WorkspaceView }) {
  const actions = useBoardActions(view.id);
  // Produce reports its own errors next to its button.
  const actionError = [actions.selectDirection, actions.updateShot, actions.redrawFrame].find(
    (m) => m.isError,
  )?.error;

  if (view.status === "planning") return <PlanningProgress />;
  if (view.status === "failed") return <PlanFailed />;
  return (
    <>
      {actionError ? (
        <p role="alert" className="mb-6 text-sm text-destructive">
          {errorMessage(actionError)}
        </p>
      ) : null}
      <DirectionList view={view} actions={actions} />
    </>
  );
}

function PlanFailed() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-3xl border border-border p-7">
      <span className="grid size-10 place-items-center rounded-full bg-destructive/12 text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <p className="leading-relaxed">
        We couldn&apos;t turn this brief into concepts. Try rewording it, or give it a little more
        detail.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Write a new brief</Link>
      </Button>
    </div>
  );
}
