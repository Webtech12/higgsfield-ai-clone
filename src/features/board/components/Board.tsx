"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import type { WorkspaceView } from "@/contracts/project";
import { errorMessage } from "@/shared/lib/apiErrors";
import { Button } from "@/shared/ui";

import { useBoardActions } from "../hooks/useBoardActions";
import { DirectionList } from "./DirectionList";
import { PlanningSkeleton } from "./PlanningSkeleton";

/** The Board: the plan while the Director writes it, then three storyboarded directions to pick from. */
export function Board({ view }: { view: WorkspaceView }) {
  const actions = useBoardActions(view.id);
  // Produce reports its own errors next to its button.
  const actionError = [actions.selectDirection, actions.updateShot, actions.redrawFrame].find(
    (m) => m.isError,
  )?.error;

  if (view.status === "planning") return <PlanningSkeleton />;
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
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-xl border border-border p-6">
      <AlertTriangle className="size-6 text-destructive" aria-hidden />
      <p>The Director couldn&apos;t turn this brief into a plan. Try rephrasing the idea.</p>
      <Button asChild variant="outline">
        <Link href="/">Write a new brief</Link>
      </Button>
    </div>
  );
}
