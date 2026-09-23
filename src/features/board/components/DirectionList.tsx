"use client";

import type { WorkspaceView } from "@/contracts/project";
import { Button } from "@/shared/ui";

import type { useBoardActions } from "../hooks/useBoardActions";
import { DirectionCard } from "./DirectionCard";
import type { ShotCardActions } from "./ShotCard";

/**
 * The three directions. Before choosing, all three sit side by side for comparison; after choosing,
 * the chosen one leads and becomes editable while the others step back.
 */
export function DirectionList({
  view,
  actions,
}: {
  view: WorkspaceView;
  actions: ReturnType<typeof useBoardActions>;
}) {
  const selectedId = view.selectedDirectionId;
  const ordered = selectedId
    ? [...view.directions].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId))
    : view.directions;

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
    <div className="space-y-6">
      {ordered.map((direction) => {
        const isSelected = direction.id === selectedId;
        return (
          <div key={direction.id} className={selectedId && !isSelected ? "opacity-60" : undefined}>
            <DirectionCard
              direction={direction}
              ratio={view.aspectRatio}
              isSelected={isSelected}
              canChoose={view.isOwner && view.status === "planned"}
              isChoosing={
                actions.selectDirection.isPending &&
                actions.selectDirection.variables === direction.id
              }
              isLocked={actions.selectDirection.isPending}
              onChoose={() => {
                actions.selectDirection.mutate(direction.id);
              }}
              shotActions={view.isOwner && isSelected ? shotActions : null}
            />
            {isSelected ? (
              <div className="mt-4 flex flex-col items-start gap-1 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Next: turn these three shots into video, each starting from its frame.
                </p>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <Button disabled>Produce 3 shots · 30 credits</Button>
                  <span className="text-xs text-muted-foreground">
                    Production opens with the next deploy.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
