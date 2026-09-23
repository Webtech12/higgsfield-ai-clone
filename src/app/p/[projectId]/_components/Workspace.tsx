"use client";

import {
  progressMessage,
  SURFACE_OF_STATUS,
  toFilm,
  useProject,
  type WorkspaceSnapshot,
} from "@/entities/project";
import { Board } from "@/features/board";
import { Studio } from "@/features/studio";

/**
 * The project page. Features never import each other (AGENTS.md §7), so the Board and the Studio are
 * composed here: one polling read model feeds both, and the project's status picks the surface.
 */
export function Workspace({ initial }: { initial: WorkspaceSnapshot }) {
  const { data } = useProject(initial.view.id, initial);
  const view = data.view;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{view.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">“{view.brief}”</p>
        <p aria-live="polite" className="mt-4 text-sm font-medium text-primary">
          {progressMessage(view)}
        </p>
      </header>

      <div className="mt-10">
        {SURFACE_OF_STATUS[view.status] === "studio" ? (
          <Studio film={toFilm(view)} />
        ) : (
          <Board view={view} />
        )}
      </div>
    </main>
  );
}
