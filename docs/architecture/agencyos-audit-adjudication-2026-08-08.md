# AgencyOS Audit Adjudication — 2026-08-08

**Status:** Decision record. Adjudicates all 13 findings of the independent architecture audit (`agencyos-architecture-audit.canvas.tsx`) against founder intent, repository reality, and first-party vendor documentation current as of 2026-08-08.
**Object under audit:** the 2026-08-08 architecture review artifact (`docs/architecture/agencyos-architecture-review-2026-08-08.md`), which served as the then-current architecture. It is retained unedited (status line only) so the audit's line-number citations remain resolvable at commit `7c9e19e`.
**Output:** every accepted/modified correction is incorporated into the canonical architecture, `docs/architecture/agencyos-architecture.md` ("canonical §" references below), written as if the corrections were part of the design from the beginning.
**Mandate boundary:** documentation only. No application code, no schema implementation, no Phase 0 work was performed.

---

## 1. Method

1. Both raw founder transcripts and their timestamped segment files were read in full; every founder citation used by the audit was checked against the segment files and confirmed accurate.
2. Every vendor-behavior claim material to a disposition was re-verified against current first-party documentation on 2026-08-08 (see §2).
3. Each finding was adjudicated **ACCEPT / MODIFY / REJECT / DEFER** with the rule: do not defend the original architecture by default, do not blindly accept the audit, and make the smallest correction that actually resolves the finding.
4. The five approval gates named in the review mandate (tenant identity/isolation, consent enforcement, temporal leakage, prompt-injection boundaries, experiment/holdout/evaluation governance) plus the four named areas (call-recording rights, OAuth/webhook requirements, backfill controls, conflicting legacy ADRs) are individually closed in §5–§6.

## 2. Vendor claims re-verified (2026-08-08)

| Claim used by the audit | Verification result |
|---|---|
| GHL lifecycle events are Marketplace (OAuth) app subscriptions; PIT is internal REST access; workflow webhooks fire only inside configured workflows | **Confirmed** (GHL marketplace/authorization docs, SDK) |
| Marketplace webhooks signed with Ed25519 `X-GHL-Signature`; legacy scheme retiring | **Confirmed and now stronger:** legacy RSA `x-wh-signature` retired **2026-07-01**; Ed25519 is the only scheme; verification must use raw request bytes |
| Private marketplace apps have an agency-install ceiling | **Confirmed:** 5 unique agency installs for apps created on/after 2025-11-18; 6th blocked until public listing or GHL Security Review |
| GHL contacts are location-scoped and can merge (one contact retained) | **Confirmed** (GHL support portal) |
| Convex actions are not automatically retried (side effects can't be replayed) | **Confirmed** (Convex docs: actions are at-most-once; Workflow component for durable retries) |
| Convex authorization is application logic, not row-level security | **Confirmed** (Convex auth docs; custom-function wrapper pattern) |
| Convex snapshot/backup covers table data + file storage only | **Confirmed** (excludes code, config, env vars, pending scheduled functions) |
| R2 same-key writes are last-writer-wins; no append primitive | **Confirmed** (R2 consistency model) |
| R2 jurisdiction fixed at bucket creation | **Confirmed** ("Once an R2 bucket is created, the jurisdiction cannot be changed") |
| FCC/TCPA revocation requirements | **Confirmed and sharpened:** reasonable-method revocation + ≤10-business-day processing effective 2025-04-11; the "revoke-all-topics" scope rule (47 CFR 64.1200(a)(10)) waived to **2027-01-31** (FCC DA-26-12, 2026-01-06). Canonical design honors revocation globally now |
| Recording-consent statutes (18 U.S.C. §2511 baseline; CA Penal §632, FL §934.03 all-party) | **Confirmed, stable** |
| OpenAI/Anthropic guidance: treat third-party content as untrusted; least privilege for tools | **Confirmed, consistent** |

No audit premise failed verification. Two audit statements were phrased more cautiously than current reality (signature retirement; revoke-all timing); the canonical architecture states the current facts.

## 3. Disposition summary

| ID | Audit severity | Title (abridged) | Disposition | Canonical resolution |
|---|---|---|---|---|
| F1 | High | Phase plan postpones founder-critical prerequisites (budget/card, AOV) | **ACCEPT** | §2.1, §15.2, §17 Phase 0 |
| F2 | Critical | Claimed consent choke point cannot control every send; consent model too coarse | **ACCEPT** | §6, I3 |
| F3 | High | PIT / workflow webhooks / OAuth conflated; install ceiling ignored | **ACCEPT** | §7, §17 Phases 0/5 |
| F4 | High | Inbound dedup mistaken for end-to-end exactly-once; "append-only JSONL" wrong on R2 | **ACCEPT** | §8 |
| F5 | Critical | `agencyId` column is not a tenant boundary or person identity | **ACCEPT** | §5, §15.3, I4 |
| F6 | High | Privacy controls asserted in self-review, undefined in body | **ACCEPT** | §13 |
| F7 | High | Exports conflated with backup and exit; nonexistent §3.11 cited | **ACCEPT** | §14 |
| F8 | Critical | Golden set / historical ranker can see the answer (temporal leakage) | **ACCEPT** | §9.3, §11.2–11.3, I2 |
| F9 | High | Shadow mode records counterfactual outcomes as facts; assistance contamination | **ACCEPT** | §11.4 |
| F10 | High | Experiment and autonomy gates don't support their causal claims | **ACCEPT** | §11.5–11.6 |
| F11 | Critical | No prompt-injection trust boundary for CRM/retrieved content | **ACCEPT** | §12, I5 |
| F12 | High | Repository still marks the superseded stack as accepted | **ACCEPT** | §18; status edits in this pass (§6 below) |
| F13 | Critical | Call pipeline copies/transcribes before proving processing rights | **MODIFY** | §10, §17 Phase 1 |

**Totals: 12 ACCEPT, 1 MODIFY, 0 REJECT, 0 DEFER.** Every audit premise was independently re-verified; rejecting any finding would have been defending the original architecture by default, which the mandate forbids. The audit's seven "decisions that survived" (GHL as engagement layer; Convex canonical + R2 evidence split; five data classes; deferred fine-tuning; human review/experiments/scoped autonomy/kill switch; deferred iMessage and autonomous spend; documentation-only honesty) are all retained in the canonical architecture.

---

## 4. Per-finding adjudication

Quoted passages are from the superseded review artifact (previous architecture), preserved verbatim there.

### F1 — Founder-critical prerequisites postponed — ACCEPT (High)

**Audit claim:** the plan defers the funded operating card to the autonomy phase and the only AgencyOS upsell test to Phase 5, although Alex asked for a budget and bounded spending authority at startup and called AOV the binding constraint.
**Evidence verified:** "Come on, needs a card with money on it so you can begin the process and not contact me like about this and that. We need to come up with the budget" `[call-01 0018–0033]`; AOV as the ad-scale unlock `[call-01 0119–0150]`. The prior architecture placed the card in Phase 4 ("spend card with caps + receipts") and the upsell experiment only in Phase 5, leaving the budget as open question #11.
**Reasoning:** the transcripts contain **two different cards**: the day-zero operating card for Kamal (call 1) and the agent's own spend card (call 2, `0686–0722`). ADR-003 and the prior architecture conflated them; deferring both to Phase 4 contradicted founder intent. Pulling full student productization forward would over-correct; the audit explicitly avoids that.
**Correction (canonical):** §2.1 distinguishes the two instruments; §17 Phase 0 includes the written budget + bounded human-accountable operating card (caps, receipts to ledger); autonomous agent spend stays in Phase 4 (§11.6); a parallel time-boxed AOV/VSL discovery lane runs in Phases 0–1 with the smallest testable upsell hypothesis named (§15.2); the productized AgencyOS-slice test remains Phase 5.

### F2 — Consent choke point cannot control every send — ACCEPT (Critical; approval gate)

**Audit claim:** "No send bypasses it, human or AI" is false while Alex sends natively in GHL; observing an outbound webhook after delivery is not enforcement; the four-state model (opted-in / implied / unknown / opted-out) cannot prove authorization for a particular seller, purpose, destination, and channel.
**Evidence verified:** the prior text simultaneously claimed the universal gate and had "Alex works normally — in GHL" with linkage only after the action. FCC rules require reasonable-method revocation honored on a ≤10-business-day ceiling (effective 2025-04-11); GHL's own messaging policy expects opted-in sends.
**Reasoning:** a gate that a manual GHL send can walk around is a compliance narrative, not a control. The fix is not to pretend to intercept GHL — it is to enforce what AgencyOS originates and to stop claiming what it does not control.
**Correction (canonical §6, I3):** `authorizeAndEnqueueSend` is the sole interface for every AgencyOS-originated outbound side effect; no other code path holds provider credentials; decisions (including denials) recorded as evidence; policy re-checked at dispatch; revocation cancels queued intents. Consent modeled as append-only events + materialized policy state keyed (tenant, person, contactPoint, channel, purpose, seller); `unverified_claim`/`none` are non-sendable for promotional SMS/iMessage; historical consent inference is class-3 interpretation until evidence-verified. Revocation honored globally by default (ahead of the 2027-01-31 rule); quiet hours in recipient-local time; DNC + Reassigned Numbers Database checks for aged numbers. GHL-native sends are explicitly **observed-not-enforced**, with operational containment (native marketing automations disabled for uncleared segments). AgencyOS never queues contact to uncleared destinations in any phase.

### F3 — PIT / workflow webhooks / OAuth conflated — ACCEPT (High)

**Audit claim:** the named Phase-0 event types are Marketplace/OAuth subscriptions, not PIT or generic workflow-webhook output; signature schemes differ; the private-app path has an agency-install ceiling that can stall productization at the sixth agency.
**Evidence verified:** all confirmed in §2, including the 2026-07-01 Ed25519-only cutover and the 5-agency cap for apps created on/after 2025-11-18 (which any new AgencyOS app is).
**Reasoning:** the prior "PIT first, OAuth later" progression would have silently missed lifecycle events or depended on hand-maintained GHL workflows, and its Phase-1 "≥95% of GHL threads ingested" had no denominator.
**Correction (canonical §7):** Private Marketplace OAuth app from Phase 0 for event subscriptions + least-privilege PIT for REST backfill; an event transport matrix (transport, credential, verification, replay key, ordering key, reconciliation query) with **signed sandbox fixtures required before any coverage claim**; Ed25519 raw-byte verification with no legacy fallback; workflow webhooks demoted to advisory with a separate rotating-secret contract; backfill completeness declared per channel/message type with reconciliation-derived denominators, cursor checkpointing, separate email-body hydration, and nullable actor attribution; install/refresh/revocation/uninstall lifecycle designed at app creation; GHL Security Review scheduled before the sixth agency (§17 Phase 5).

### F4 — Inbound dedup ≠ exactly-once; R2 append fiction — ACCEPT (High)

**Audit claim:** the only idempotency test was replaying one inbound webhook; crashes between Convex, R2, and providers and ambiguous timeouts were unhandled; "webhook payloads (JSONL, append-only)" is not a real contract on last-writer-wins object storage.
**Evidence verified:** Convex actions are at-most-once and never auto-retried; R2 has no append and same-key writes are last-writer-wins.
**Correction (canonical §8):** durable inbox with deterministic receipt IDs; outbox with `pending → authorized → dispatched → sent | failed | unknown` and deterministic attempt IDs; **`unknown` reconciled against provider state before any retry**; dispatcher on the durable Workflow component; one immutable object per artifact under deterministic keys with hash/size/tenant/retention metadata; compaction as a derived batch output, never read-merge-reupload; failure-injection tests at every boundary as Phase-0 exit criteria.

### F5 — `agencyId` is not a tenant boundary or person model — ACCEPT (Critical; approval gate)

**Audit claim:** Convex authorization is application logic; "`agencyId` everywhere" plus prose ("no query path crosses `agencyId`") is aspiration without mechanism; GHL contact rows are unstable identity subjects (location-scoped, mergeable), so consent/outcomes/experiments could attach to the wrong human.
**Evidence verified:** Convex docs confirm app-level authorization and explicit vector-search filtering; GHL merge behavior confirmed.
**Correction (canonical §5, §15.3, I4):** principals/memberships/roles; a single authorization helper wrapping every public query, mutation, action, HTTP endpoint, scheduled job, search (FTS/vector), and export — deriving tenant scope server-side, never from client args, with per-document ownership checks; `person` / `contactPoint` / `sourceContact` / `identityLink` with append-only merge provenance and the **suppression-union rule** (merges can only widen suppression); cross-tenant probes (IDs, pagination, search, HTTP, jobs, exports, credentials) failing closed in CI, gating Phase 5; separate deployments available where a contract demands hard isolation.

### F6 — Privacy controls asserted but undefined — ACCEPT (High)

**Audit claim:** the prior self-review said purge, role-scoped auth, restricted buckets, allowlists, and redaction were "added," but the body contained no retention periods, access matrix, deletion state machine, backup/export treatment, or vendor-erasure path — while full model prompts/completions were logged by default.
**Evidence verified:** accurate against the prior text; R2 jurisdiction immutability confirms residency must be decided at bucket creation.
**Correction (canonical §13):** data inventory with purpose-based retention matrix (defaults stated, ratified in ADR-011); principal × resource × operation access matrix; idempotent purge state machine spanning Convex, R2 (all versions), indexes, exports, backups, and vendors, with deletion receipts, legal holds, and minimal suppression tombstones; model gateway logs metadata + **redacted** payloads by default, full payloads opt-in/justified/30-day/access-restricted; processor + DPA inventory completed before the corpus is copied anywhere (Phase 1 gate); jurisdiction and lifecycle chosen at bucket creation.

### F7 — Exports conflated with backup and exit; phantom §3.11 — ACCEPT (High)

**Audit claim:** nightly snapshots restore neither configuration nor a working replacement service; the prior document twice cited a §3.11 that does not exist.
**Evidence verified:** Convex backups exclude code/config/env/scheduled state (confirmed); the phantom §3.11 citations exist in the prior text (§2 ADD table and open-question 12).
**Correction (canonical §14):** operational backup/restore (RPO 24h / RTO 4h targets; quarterly restore drills into a clean deployment with a runbook covering what backups exclude) separated from vendor-exit export (stable application-level IDs; versioned manifest with schema version, checksums, object inventory, relationship map, secret-free config references; semiannual rehydration drill); per-vendor exit posture table. The export/retention discipline now has a real, numbered home (§13–§14), removing the dangling reference.

### F8 — The golden set and historical ranker can see the answer — ACCEPT (Critical; approval gate)

**Audit claim:** replaying every change against the same ≥50 historical decisions, with retrieval over the same corpus, no exclusion of the eval thread/action/post-decision messages/outcomes, plus backfilled *current* tags/opportunity state, produces target leakage and overfitting — and old high-ticket wins come from a policy regime the new strategy rejects.
**Evidence verified:** the prior text replayed "every prompt/model/playbook change" against one curated set, ran Phase-2 retrieval over the corpus with no event-time contract, and backfilled current tags/opportunities; founders' own framing (`[call-02 0303–0477]`) mixes exactly the data that must be separated at evaluation time.
**Correction (canonical §9.3, §11.2–11.3, I2):** `occurredAt`/`observedAt` on every record with backfill stamped at backfill time; immutable `asOfDecisionTs` evaluation snapshots with hidden labels; `observedAt ≤ decisionTs` enforced by a shared library; person + time splits; frozen core test set used only at declared milestones plus a prospective pool; retrieval/mining/score-fitting exclusions for evaluated persons, post-decision records, and holdouts; policy-era fields (offer, price, campaign, source, channel, era) so old-regime wins are contrast evidence; verified outcome labels + offline-eval pass before any lead-facing rollout.

### F9 — Shadow mode records counterfactual/assistance-contaminated labels — ACCEPT (High)

**Audit claim:** outcomes were attached "to both the action taken and the recommendation record" enabling "whose choice won?", though the unexecuted recommendation has no observable outcome; `sourceRecommendationId` was optional and GHL sends cannot reveal draft copying, so AI text could re-enter the corpus as "independent" human behavior.
**Evidence verified:** accurate quotes from the prior §7.1/§7.2.
**Correction (canonical §11.4):** outcomes attach **only** to executed actions; unexecuted recommendations stay `executed: false` (a `factualOutcomeRef` allowed for audit, excluded from all reward/performance metrics); "whose choice won" is declared unanswerable from shadow data, replaced by prediction calibration; every displayed draft has an immutable ID with edit lineage on gated sends; GHL-originated sends default `assistanceUnknown`, never `humanOnly`; the pure imitation corpus contains only verified human-only actions; preference labels are captured before outcomes are known.

### F10 — Experiment and autonomy gates don't support causal claims — ACCEPT (High; approval gate)

**Audit claim:** lead/thread-level randomization without person-level assignment, exposure records, maturity, power, stopping rules, or ITT; autonomy gated mainly on agreement/acceptance, which measures imitation, not benefit or safety.
**Evidence verified:** accurate quotes from prior §4.5/§7.3 and Phases 3–4.
**Correction (canonical §11.5–11.6):** randomize once per normalized person per experiment; persist eligibility snapshot, assignment, attempts, delivery, exact payload + edits, `outcomeMatureAt`; preregistration (metric, horizon, MDE/power, exclusions, stopping rule, multiplicity); intent-to-treat on mature cohorts; standing holdouts excluded from retrieval/fitting/mining; agreement/acceptance retained as imitation-UX metrics only (the audit's own recommendation — kept, not modified); autonomy per segment × action × channel requires a zero-violation safety window plus randomized assisted-champion vs autonomous-challenger non-inferiority; kill switch fire-drilled. Small-sample honesty (intervals, few big tests) from the prior design is retained — it is compatible with preregistration.

### F11 — No prompt-injection trust boundary — ACCEPT (Critical; approval gate)

**Audit claim:** attacker-controlled lead/CRM/file/tool content flows into tenant-wide retrieval, then later phases add spend authority and write-capable MCP tools, with no injection boundary, within-tenant lead isolation, output DLP, link policy, or deterministic tool validation. Tenant scoping alone does not prevent cross-lead disclosure.
**Evidence verified:** the prior isolation story was tenant-level only; vendor safety guidance (OpenAI, Anthropic) confirms the recommended posture.
**Correction (canonical §12, I5):** all CRM/lead/file/transcript/retrieval/tool text is data, never instructions; **two retrieval domains** — current person/thread raw context vs a curated, de-identified, human-approved exemplar library as the only cross-lead content in live prompts; the founders' "scan every conversation" intent is preserved in offline mining whose outputs reach live contexts only after curation; recommender holds no secrets and no side-effect tools, emits typed JSON through deterministic validators; DLP + link allowlists on drafts; content-isolated interpretation invocations; injection fixture suite inside offline evals from Phase 2, blocking promotion on regression; least-privilege capability tokens + explicit side-effect approval before any Phase 4–5 autonomous sends, spend, or write-capable MCP.

### F12 — Repository still marks the old stack as accepted — ACCEPT (High)

**Audit claim:** the prior review's §11 dispositions (amend ADR-003/005/006/007; banner the v0 architecture and strategy) were never applied, leaving two authoritative-looking plans (Convex-first/GHL-first/eval-gated vs Hermes-first/iMessage-primary/spend-card-first).
**Evidence verified:** at commit `7c9e19e` all seven ADRs read "Accepted," the v0 architecture had no banner, and the strategy's "near-term sequence" still ordered card → iMessage pilot → Hermes dashboard.
**Correction (executed in this pass, documentation-only):** the canonical architecture now occupies `agencyos-architecture.md`, eliminating the two-plan ambiguity at its root; the review artifact's status line marks it superseded (body untouched — line numbers preserved for the audit's citations); ADR-003/005/007 status lines → **Amended**, ADR-006 → **Superseded** (line-count-preserving, single-line edits; bodies untouched per ADR integrity); the strategy doc's header carries a status pointer (line-count-preserving). Canonical §18 is the standing decision register; ADR-008…015 stubs are Phase-0 governance work (prescribed, not performed — Phase 0 is out of mandate). ADR-001/002/004 stand unchanged.

### F13 — Recordings copied and transcribed before proving processing rights — MODIFY (Critical; approval gate)

**Audit claim:** the pipeline order acquire → archive → transcribe, with consent verification a later audit note ("likely already handled"), and a Phase-1 exit requiring **every located recording** transcribed, creates privacy/wiretap exposure before any rights check. Correction proposed: inventory metadata without copying media; quarantine by default; per-call rights manifest before download/archive/transcription/retrieval/model use; exit criterion reworded to rights-cleared-only.
**Evidence verified:** accurate quotes from prior §6.1/§6.2/Phase 1; statutes confirmed (federal one-party baseline; CA/FL all-party; processor disclosure is a separate act from lawful capture).
**Disposition — MODIFY, not plain ACCEPT:** the audit's ordering is adopted in full — including the reworded Phase-1 exit ("every rights-cleared recording transcribed; unresolved recordings counted and quarantined") — with **one added provision** the audit's ordering did not price: where a documented risk of source deletion exists (e.g., recorder retention windows), a **storage-only quarantine copy** may be taken into a locked bucket prefix before full clearance, with owner sign-off recorded, no vendor disclosure, no transcription, no indexing, no model access, and scheduled deletion if rights cannot be established within the review window. Rationale: a strict no-copy rule converts a rights-review delay into permanent evidence loss; the exception grants zero processing rights and is narrower than the exposure it prevents.
**Correction (canonical §10, §17 Phase 1):** as above.

---

## 5. Approval-gate resolution

| Gate (from the review mandate) | Resolved by | Canonical location |
|---|---|---|
| Canonical tenant identity and tenant isolation | F5 corrections | §5, §15.3, I4 |
| Consent enforcement | F2 corrections | §6, I3 |
| Temporal leakage in historical evaluation | F8 corrections | §9.3, §11.2–11.3, I2 |
| Prompt-injection boundaries for CRM/retrieved content | F11 corrections | §12, I5 |
| Experiment, holdout, and evaluation governance | F8/F9/F10 corrections | §11 |
| Call-recording rights | F13 (MODIFY) + §9 shipping-gate residual | §10, §17 Phase 1 |
| OAuth/webhook requirements | F3 corrections | §7.1–7.2 |
| Backfill controls | F3/F4/F8 corrections | §7.3, §8, §9.3 |
| Conflicting legacy ADRs/documents | F12 corrections | §18 + status edits |

All Phase-0 foundation decisions named in the resume mandate are explicit in the canonical document: identity/authorization including GHL installation→tenant binding and agency-install location membership (§5.0, §5.1), consent/data-rights/retention enforcement (§6, §13), call-rights-before-processing with preservation-authorized quarantine exception only (§10), event-time `observedAt ≤ T` semantics (§9.3, §11.2), OAuth/webhook verification with idempotency/retries/replay/reconciliation/backfill (§7–§8), immutable evidence-storage semantics via create-only R2 writes (§8.3), and legacy document status (§18.3). Shipping-gate residuals that closed remaining contract gaps are recorded in §9 of this adjudication.

## 6. Repository changes in this pass

Documentation only; working tree changes over commit `7c9e19e`:

1. `docs/architecture/agencyos-architecture.md` — **replaced** with the canonical architecture (the superseded v0 text remains recoverable at `7c9e19e`).
2. `docs/architecture/agencyos-audit-adjudication-2026-08-08.md` — **created** (this file).
3. `docs/architecture/agencyos-architecture-review-2026-08-08.md` — status line replaced in place (single line; line numbers preserved).
4. `docs/decisions/ADR-003…` status → Amended; `ADR-005` → Amended; `ADR-006` → Superseded; `ADR-007` → Amended — each a single-line, line-count-preserving status edit; bodies untouched.
5. `docs/founder-context/agencyos-current-strategy.md` — one header line amended in place with a status pointer; body untouched. Transcripts and `founder-intent.md` untouched (founder evidence; its architecture link now resolves to the canonical document).

Prescribed for Phase 0 (not performed): ADR-008…015 stubs; CI; schema; all implementation.

## 7. Final verification checklist

| Requirement | Verdict | Where |
|---|---|---|
| Architecture reflects complete founder intent (four goals, two-card ask, partnership, mission-as-tone) | Pass | canonical §2 |
| V1 remains the smallest system accumulating proprietary evidence about how the business sells | Pass | §16 (Observe + Understand + Copilot; nothing else survived) |
| Raw evidence / AI interpretations / human actions / AI recommendations / outcomes remain distinguishable | Pass | §9.1 (I1), assistance lineage §11.4 |
| An evaluation at time T cannot access information from after T | Pass | §9.3, §11.2 (I2), enforced by shared library + leakage checks in Phase 2 exit |
| Untrusted CRM/customer content cannot become trusted agent instructions | Pass | §12 (I5), injection fixtures gate promotion |
| One tenant's data cannot cross into another tenant or global learning without explicit authorization | Pass | §5, §15 (I4); opt-in k-anonymized aggregates only |
| Hermes, Prime Agent, model providers, and GoHighLevel remain replaceable without losing proprietary intelligence | Pass | §4 consumers, §14 exit postures (I7) |

## 8. Unresolved items (none block committing these documents)

The following are **discovery gates for later phases**, tracked in canonical §19 — they do not affect the correctness or completeness of the documents submitted for PASS/BLOCK review: consent evidence for the historical lead base and A2P/10DLC registration status (gates Phase 3, not the docs); physical location and rights manifests for the ~200 recordings (gates Phase 1 processing); the actual closed-won count (produced by Phase 1); payment processor and community-platform telemetry; the written budget number (Phase 0 deliverable); **unsigned equity/IP assignment** — flagged as the sharpest business risk for a proprietary-asset strategy, but a legal matter, not an architectural one.

---

## 9. Shipping-gate residual corrections (2026-08-08)

Independent final shipping gate at commit `6fc4fc624f9c37ed79312338d57461201cb3c86f` passed the broader architecture and identified three residual Phase-0 contract blockers. These are documentation corrections to the canonical architecture; they do not reopen resolved audit findings beyond the residual gaps named below. No application code was implemented.

| Residual | Prior adjudication | Verification | Canonical fix |
|---|---|---|---|
| Tenant ↔ GHL installation / ingress identity | F3 ACCEPT / F5 ACCEPT incomplete | GHL [AppInstall](https://marketplace.gohighlevel.com/docs/webhook/AppInstall/) / [AppUninstall](https://marketplace.gohighlevel.com/docs/webhook/AppUninstall/) payloads expose `appId`, `companyId`, `locationId` — **no** `installId`. Canonical §5 lacked installation→tenant binding; §7.2 used nonexistent `installId`; §8.1 receipt hash was not tenant/installation-scoped. | Canonical **§5.0**, I4, §7.2 INSTALL/UNINSTALL row, §8.1 |
| Agency `companyId` install ↔ location webhook `locationId` | Residual after §5.0 | Agency-level INSTALL is `companyId`-keyed; ordinary events (e.g. [InboundMessage](https://marketplace.gohighlevel.com/docs/webhook/InboundMessage/)) carry `locationId` only. First-party bulk/agency flow requires [installedLocations](https://marketplace.gohighlevel.com/docs/ghl/oauth/get-installed-location/) + [locationToken](https://marketplace.gohighlevel.com/docs/ghl/oauth/get-location-access-token/) ([App Distribution](https://marketplace.gohighlevel.com/docs/oauth/AppDistribution/)) — not event-time inference. | Canonical **§5.0** `installationLocationMembership`, ingress precedence, lifecycle deactivation; §7.2 reconciliation column |
| R2 evidence immutability / purge | F4 ACCEPT / F6 ACCEPT incomplete | R2 has **no** native S3 versioning ([S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)); supports create-only conditionals and [bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/) that block delete/overwrite while active. Canonical assumed “versioning” and purge of “all versions.” | Canonical §1.3 R2 fact, **§8.3**, **§13.3** lock-aware completion, §14.1 |
| Call-preservation / processor authority | F13 MODIFY incomplete | Prior exception copied audio to R2 while claiming “no vendor disclosure.” Cloudflare’s [Customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) treats Cloudflare as Processor of Customer Content stored via the Services. | Canonical **§10.1** capability chain + preservation-authorization before any copy; Phase 1 exit + §19.3 |

**Disposition of F13 MODIFY:** rights-manifest-before-processing remains; the storage-only exception is retained only when copy/possession authority **and** Cloudflare R2 processor/storage authority are recorded first. Otherwise metadata-only.

After these corrections — including the agency-install ↔ location-membership binding — the shipping-gate blocker clusters are closed at the documentation-contract level. R2 and call-rights corrections were not reopened. Phase 0 implementation remains out of mandate for this pass.

---

*End of adjudication. The canonical architecture is `docs/architecture/agencyos-architecture.md`.*
