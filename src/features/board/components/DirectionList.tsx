"use client";

import type { WorkspaceView } from "@/contracts/project";

import type { useBoardActions } from "../hooks/useBoardActions";
import { DirectionCard } from "./DirectionCard";
import { ProduceBar } from "./ProduceBar";
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
            {isSelected && view.isOwner && view.status === "selected" ? (
              <ProduceBar view={view} produce={actions.produce} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
