import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { executor, type Database, type Tx as UnitOfWorkTx } from "@/server/platform/db";

import { Project } from "../domain/Project";
import { toProjectProps } from "./mappers";
import { directions, projects, shots } from "./schema";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export class ProjectRepository {
  constructor(private readonly db: Database) {}

  async insert(project: Project): Promise<void> {
    const p = project.toSnapshot();
    await this.db.insert(projects).values({
      id: p.id,
      userId: p.userId,
      title: p.title,
      brief: p.brief,
      ad: p.ad,
      talentId: p.talentId,
      references: p.references,
      aspectRatio: p.aspectRatio,
      styles: p.styles,
      status: p.status,
      selectedDirectionId: p.selectedDirectionId,
      isDemo: p.isDemo,
      elements: p.elements,
    });
  }

  load(id: string): Promise<Project | null> {
    return this.loadWith(this.db, id, false);
  }

  /**
   * Loads the project with its row locked, applies `change`, and saves, all in one transaction.
   * Frame workflows finish concurrently; without the lock, one save would erase another's pointer.
   */
  async update<T>(
    id: string,
    change: (project: Project) => T,
    outer?: UnitOfWorkTx,
  ): Promise<T | null> {
    const run = async (tx: Tx) => {
      const project = await this.loadWith(tx, id, true);
      if (!project) return null;
      const result = change(project);
      await this.save(tx, project);
      return result;
    };
    // Inside a caller's unit of work (e.g. the money path) the lock is held until it commits.
    if (outer) return run(executor(this.db, outer) as Tx);
    return this.db.transaction(run);
  }

  private async loadWith(db: Database | Tx, id: string, lock: boolean): Promise<Project | null> {
    const query = db.select().from(projects).where(eq(projects.id, id));
    const [row] = lock ? await query.for("update") : await query;
    if (!row) return null;
    const directionRows = await db
      .select()
      .from(directions)
      .where(eq(directions.projectId, id))
      .orderBy(asc(directions.ordinal));
    const shotRows = await db
      .select()
      .from(shots)
      .where(eq(shots.projectId, id))
      .orderBy(asc(shots.ordinal));
    return Project.rehydrate(toProjectProps(row, directionRows, shotRows));
  }

  private async save(tx: Tx, project: Project): Promise<void> {
    const p = project.toSnapshot();
    await tx
      .update(projects)
      .set({
        userId: p.userId,
        title: p.title,
        talentId: p.talentId,
        status: p.status,
        selectedDirectionId: p.selectedDirectionId,
        elements: p.elements,
        version: sql`${projects.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, p.id));

    for (const d of p.directions) {
      const { shots: directionShots, ...direction } = d;
      await tx
        .insert(directions)
        .values({ ...direction, projectId: p.id })
        .onConflictDoUpdate({
          target: directions.id,
          set: {
            name: d.name,
            tagline: d.tagline,
            look: d.look,
            hook: d.hook,
            headline: d.headline,
            cta: d.cta,
            musicBrief: d.musicBrief,
          },
        });
      for (const s of directionShots) {
        const values = { ...s, directionId: d.id, projectId: p.id };
        await tx.insert(shots).values(values).onConflictDoUpdate({ target: shots.id, set: values });
      }
    }
  }
}
