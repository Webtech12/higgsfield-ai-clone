"use client";

import type { WorkspaceView } from "@/contracts/project";

import type { useBoardActions } from "../hooks/useBoardActions";
import { ConceptCard } from "./ConceptCard";
import { DirectionCard } from "./DirectionCard";
import { OtherConcepts } from "./OtherConcepts";
import { ProduceBar } from "./ProduceBar";
import type { ShotCardActions } from "./ShotCard";

type BoardActions = ReturnType<typeof useBoardActions>;

/**
 * The three concepts. Before choosing, they sit side by side as columns (a swipeable carousel on
 * phones), so they're compared at a glance; after choosing, the chosen one becomes the editable
 * focus and the others step back (ADR-028).
 */
export function DirectionList({ view, actions }: { view: WorkspaceView; actions: BoardActions }) {
  const chosen = view.directions.find((d) => d.id === view.selectedDirectionId);
  if (!chosen) return <ConceptComparison view={view} actions={actions} />;

  const shotActions = (shotId: string): ShotCardActions => ({
    isSaving: actions.updateShot.isPending && actions.updateShot.variables.shotId === shotId,
    isRedrawing: actions.redrawFrame.isPending && actions.redrawFrame.variables === shotId,
    onSave: (patch) => {
      actions.updateShot.mutate({ shotId, patch });
    },
    onRedraw: () => {
      actions.redrawFrame.mutate(shotId);
    },
  });

  return (
    <div className="space-y-12">
      <div>
        <DirectionCard
          direction={chosen}
          ratio={view.aspectRatio}
          shotActions={view.isOwner ? shotActions : null}
        />
        {view.isOwner && view.status === "selected" ? (
          <ProduceBar view={view} produce={actions.produce} />
        ) : null}
      </div>
      <OtherConcepts
        directions={view.directions.filter((d) => d.id !== chosen.id)}
        ratio={view.aspectRatio}
      />
    </div>
  );
}

function ConceptComparison({ view, actions }: { view: WorkspaceView; actions: BoardActions }) {
  return (
    <div>
      <p className="mb-5 text-sm text-muted-foreground lg:hidden">Swipe to compare all three.</p>
      <ol
        aria-label="Concepts"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-x-5 lg:gap-y-0 lg:overflow-visible lg:px-0"
      >
        {view.directions.map((direction, index) => (
          <li
            key={direction.id}
            className="w-[86%] shrink-0 animate-rise snap-center sm:w-[60%] lg:row-span-7 lg:grid lg:w-auto lg:grid-rows-subgrid"
            style={{ animationDelay: `${String(index * 110)}ms` }}
          >
            <ConceptCard
              direction={direction}
              ratio={view.aspectRatio}
              canChoose={view.isOwner && view.status === "planned"}
              isChoosing={
                actions.selectDirection.isPending &&
                actions.selectDirection.variables === direction.id
              }
              isLocked={actions.selectDirection.isPending}
              onChoose={() => {
                actions.selectDirection.mutate(direction.id);
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
