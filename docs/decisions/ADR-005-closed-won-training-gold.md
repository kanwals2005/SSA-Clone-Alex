# ADR-005: Closed-Won Conversations Are the Training Gold Set

**Status:** Accepted  
**Date:** 2026-08-08  
**Source:** Alex Call 02  

## Context

SSA has ~5–6k leads and ~200 sales-call transcripts. Messaging quality varies. Alex wants an AI that scores leads, learns why closes happen, and replicates winning talk tracks.

## Decision

Train and score outbound AI primarily from contacts with **closed** status (and their full threads). Use non-closed threads to find **gaps**, not as equal positive examples. Tags and content-consumption signals are inputs to buy-likelihood.

## Consequences

- Export/filter pipeline must distinguish closed vs open reliably.
- ICP is derived from closed buyers first.
- Experiment loop may propose copy, but promotion to default playbook requires measured reply/close lift.
