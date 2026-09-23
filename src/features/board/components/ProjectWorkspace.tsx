"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { boardProgress, useProject, type WorkspaceSnapshot } from "@/entities/project";
import { errorMessage } from "@/shared/lib/apiErrors";
import { Button } from "@/shared/ui";

import { useBoardActions } from "../hooks/useBoardActions";
import { DirectionList } from "./DirectionList";
import { PlanningSkeleton } from "./PlanningSkeleton";

/** The live project page: header, announced status, then the planning, failed or board state. */
export function ProjectWorkspace({ initial }: { initial: WorkspaceSnapshot }) {
  const projectId = initial.view.id;
  const { data } = useProject(projectId, initial);
  const view = data.view;
  const actions = useBoardActions(projectId);
  const progress = boardProgress(view);
  const actionError = [actions.selectDirection, actions.updateShot, actions.redrawFrame].find(
    (m) => m.isError,
  )?.error;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{view.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">“{view.brief}”</p>
        <p aria-live="polite" className="mt-4 text-sm font-medium text-primary">
          {progress.message}
        </p>
        {actionError ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {errorMessage(actionError)}
          </p>
        ) : null}
      </header>

      <div className="mt-10">
        {view.status === "planning" ? (
          <PlanningSkeleton />
        ) : view.status === "failed" ? (
          <div className="flex max-w-xl flex-col items-start gap-4 rounded-xl border border-border p-6">
            <AlertTriangle className="size-6 text-destructive" aria-hidden />
            <p>The Director couldn&apos;t turn this brief into a plan. Try rephrasing the idea.</p>
            <Button asChild variant="outline">
              <Link href="/">Write a new brief</Link>
            </Button>
          </div>
        ) : (
          <DirectionList view={view} actions={actions} />
        )}
      </div>
    </main>
  );
}
