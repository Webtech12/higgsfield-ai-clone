# ADR-015: Paradigm per layer

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

TypeScript and React are multi-paradigm. Applying one paradigm everywhere produces either anemic services or class-heavy React.

## Decision

The backend domain uses a rich OOP domain model (entities/aggregates with private state, immutable value objects, pure domain services). The application layer uses use-case classes with constructor injection. Infrastructure uses adapter classes and decorators. The frontend uses functional composition (components, hooks, pure view models). Inheritance is allowed only for the `DomainError` hierarchy.

## Alternatives considered

- **OOP everywhere**: Class components and inheritance in React are legacy patterns.
- **Functional everywhere**: Backend invariants become easier to bypass without encapsulation.

## Consequences

Each layer uses the tool that best protects its concerns. Contributors must understand both styles; the standards doc documents both.

## Revisit when

—
