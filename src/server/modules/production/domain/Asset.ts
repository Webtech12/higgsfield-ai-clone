import type { AspectRatio } from "@/contracts/brief";
import type { AssetKind, AssetStatus } from "@/contracts/project";
import { DomainError } from "@/server/platform/errors";

/** Legal lifecycle moves. Data, not branching: a new state is a new entry (AGENTS.md §6). */
const TRANSITIONS = {
  queued: ["submitted", "failed"],
  submitted: ["running", "persisting", "failed"],
  running: ["persisting", "failed"],
  persisting: ["succeeded", "failed"],
  succeeded: [],
  failed: ["queued"],
} as const satisfies Record<AssetStatus, readonly AssetStatus[]>;

const TERMINAL: ReadonlySet<AssetStatus> = new Set(["succeeded", "failed"]);

export class IllegalTransitionError extends DomainError {
  readonly code = "ILLEGAL_TRANSITION";

  constructor(from: AssetStatus, to: AssetStatus) {
    super(`An asset cannot move from ${from} to ${to}`);
  }
}

/** What the provider needs at submit time, kept with the asset so a retried step can rebuild it. */
export interface AssetMeta {
  aspectRatio: AspectRatio;
  durationS?: number;
  label: { title: string; subtitle: string };
}

export interface AssetProps {
  id: string;
  meta: AssetMeta;
  projectId: string;
  shotId: string;
  kind: AssetKind;
  version: number;
  parentAssetId: string | null;
  status: AssetStatus;
  model: string;
  prompt: string;
  /** For a video: the storyboard frame used as its first frame (ADR-017). */
  sourceUrl: string | null;
  providerRequestId: string | null;
  url: string | null;
  error: string | null;
  costCredits: number;
  /** 1 for the first try; a user retry after a final failure is attempt 2, and pays again. */
  attempt: number;
}

export type NewAsset = Omit<
  AssetProps,
  "status" | "providerRequestId" | "url" | "error" | "parentAssetId" | "attempt"
> & {
  parentAssetId?: string | null;
};

/**
 * One user-visible version of a frame or video (ADR-011). The repository saves transitions with
 * `WHERE status = persistedStatus`, so a retried workflow step can never apply one twice.
 */
export class Asset {
  private constructor(
    private props: AssetProps,
    /** The status as last read from or written to the database. */
    readonly persistedStatus: AssetStatus | null,
  ) {}

  static create(input: NewAsset): Asset {
    return new Asset(
      {
        ...input,
        parentAssetId: input.parentAssetId ?? null,
        status: "queued",
        providerRequestId: null,
        url: null,
        error: null,
        attempt: 1,
      },
      null,
    );
  }

  get attempt(): number {
    return this.props.attempt;
  }

  static rehydrate(props: AssetProps): Asset {
    return new Asset({ ...props }, props.status);
  }

  get id(): string {
    return this.props.id;
  }

  get status(): AssetStatus {
    return this.props.status;
  }

  get isTerminal(): boolean {
    return TERMINAL.has(this.props.status);
  }

  markSubmitted(providerRequestId: string): void {
    this.transitionTo("submitted");
    this.props.providerRequestId = providerRequestId;
  }

  markRunning(): void {
    this.transitionTo("running");
  }

  markPersisting(): void {
    this.transitionTo("persisting");
  }

  markSucceeded(url: string): void {
    this.transitionTo("succeeded");
    this.props.url = url;
  }

  markFailed(reason: string): void {
    this.transitionTo("failed");
    this.props.error = reason;
  }

  requeueForRetry(): void {
    this.transitionTo("queued");
    this.props.error = null;
    this.props.providerRequestId = null;
    this.props.attempt += 1;
  }

  toSnapshot(): Readonly<AssetProps> {
    return { ...this.props };
  }

  private transitionTo(next: AssetStatus): void {
    const allowed: readonly AssetStatus[] = TRANSITIONS[this.props.status];
    if (!allowed.includes(next)) throw new IllegalTransitionError(this.props.status, next);
    this.props.status = next;
  }
}
