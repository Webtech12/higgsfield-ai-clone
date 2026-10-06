"use client";

import Link from "next/link";

import {
  adHeader,
  progressMessage,
  SURFACE_OF_STATUS,
  toFilm,
  useProject,
  type WorkspaceSnapshot,
} from "@/entities/project";
import { NotifyMe, StatusPill, useReadyAlerts } from "@/features/alerts";
import { Board } from "@/features/board";
import { Studio } from "@/features/studio";
import { Button } from "@/shared/ui";

import { AdHeaderStrip } from "./AdHeaderStrip";

/**
 * The ad's page. Features never import each other (AGENTS.md §7), so the Board, the Studio and the
 * ready alerts are composed here: one polling read model feeds them all, and the project's status
 * picks the surface.
 */
export function Workspace({ initial }: { initial: WorkspaceSnapshot }) {
  const { data } = useProject(initial.view.id, initial);
  const view = data.view;
  const header = adHeader(view);
  const alerts = useReadyAlerts(view);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-10 pb-24 sm:px-6 lg:pt-14">
      <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl min-w-0">
          <p className="animate-rise text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            {view.isDemo ? "Example ad" : "Your ad"}
            {header ? ` · ${header.format}` : null}
          </p>
          <h1
            className="mt-4 animate-rise font-display text-4xl leading-[0.95] font-semibold tracking-[-0.035em] sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {view.title}
          </h1>
          <p
            className="mt-5 max-w-2xl animate-rise text-base leading-relaxed text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            “{view.brief}”
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
            <StatusPill phase={alerts.phase} message={progressMessage(view)} />
            {alerts.canNotify ? <NotifyMe /> : null}
            {view.isDemo ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/">Make your own</Link>
              </Button>
            ) : null}
          </div>
        </div>
        {header ? <AdHeaderStrip header={header} /> : null}
      </header>

      <div className="mt-10 lg:mt-12">
        {SURFACE_OF_STATUS[view.status] === "studio" ? (
          <Studio film={toFilm(view)} />
        ) : (
          <Board view={view} />
        )}
      </div>
    </main>
  );
}
