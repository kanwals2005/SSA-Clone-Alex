# ADR-003: Agent OS Autonomy Requires a Funded Spend Card

**Status:** Amended 2026-08-08 — split into a Phase-0 human operating budget/card and Phase-4 agent-initiated spend; card provisioning no longer blocks V1 observation. See `docs/architecture/agencyos-architecture.md` §17–§18  
**Date:** 2026-08-08  
**Source:** Alex Call 01 & 02  

## Context

Alex does not want to be pinged for every operational detail. AgencyOS (Hermes + MCP loop) is expected to create docs, PDFs, landing pages, run experiments, and eventually propose ad/School moves.

## Decision

Stand up Agent OS with a **bounded agent spend card** (budget + receipts) so Kamal/agents can execute without constant Alex approval for routine work. Large or irreversible spends still require an explicit owner gate.

## Consequences

- Budget and card provisioning are blockers before serious autonomy.
- All agent purchases must log receipts into durable state.
- Role split (sales/marketing/fulfillment/CS) can share or isolate cards — decide in a follow-up ADR after pilot.
