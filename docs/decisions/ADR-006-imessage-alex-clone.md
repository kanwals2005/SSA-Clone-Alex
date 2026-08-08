# ADR-006: iMessage Alex-Clone Is the Primary Outbound Channel

**Status:** Superseded 2026-08-08 — iMessage is a consent-gated experiment arm behind the channel layer, not the primary outbound channel; GHL-native SMS/email is the V1 spine. See `docs/architecture/agencyos-architecture.md` §6, §17 and forthcoming ADR-012  
**Date:** 2026-08-08  
**Source:** Alex Call 02  

## Context

Alex wants the bot to *be him* — knowledge base, human cadence (including intentional delay), video/PDF drops, and community invites after rapport. Email is used to train opens/clicks and deliverability, not as the only channel.

## Decision

Use **iMessage** as the primary outbound nurture/sales channel for the AgencyOS lead AI. Email is complementary. Test **direct CTA** vs **relationship nurture** empirically. Cadence should feel human (including multi-hour gaps / ~1.5-day pauses).

## Consequences

- Need iMessage sending infrastructure compatible with Hermes/MCP.
- Templated personalized videos become a content production workstream for Alex.
- Compliance/risk review needed for automated personal messaging (follow-up ADR if required).
