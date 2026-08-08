import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Pill,
  Row,
  Stack,
  Stat,
  Swatch,
  Text,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type Severity = "Critical" | "High";
type Filter = "all" | "critical" | "high";

type LocalEvidence = {
  kind: "local";
  label: string;
  path: string;
  startLine: number;
  endLine: number;
  detail: string;
};

type WebEvidence = {
  kind: "web";
  label: string;
  url: string;
  detail: string;
};

type Evidence = LocalEvidence | WebEvidence;

type Finding = {
  id: string;
  severity: Severity;
  severityNote?: string;
  categories: string[];
  title: string;
  conclusion: string;
  impact: string;
  correction: string[];
  evidence: Evidence[];
};

const findings: Finding[] = [
  {
    id: "F1",
    severity: "High",
    categories: ["Founder intent", "Sequencing"],
    title: "The phase plan postpones two founder-critical prerequisites",
    conclusion:
      "The review correctly puts the lead audit first, but it calls AOV a binding constraint while deferring the only AgencyOS upsell test to Phase 5. It also defers the funded operating card to the autonomy phase, although Alex asked for a budget and bounded spending authority at startup.",
    impact:
      "A team can complete four infrastructure/product phases without testing the front-end economics that Alex said unlock ad scale. Kamal also remains operationally dependent on ad hoc approvals for ordinary build costs.",
    correction: [
      "Add a Phase 0 budget and bounded, human-accountable operating card for infrastructure, transcription, and approved assets. Keep autonomous ad spend in Phase 4.",
      "Run a parallel, time-boxed VSL/checkout/AOV discovery lane in Phases 0–1 and name the smallest upsell hypothesis that can be tested after the lead audit; do not pull full student productization forward.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Founder call 1 · budget/card",
        path: "docs/founder-context/transcripts/alex-call-01.segments.txt",
        startLine: 7,
        endLine: 10,
        detail:
          'Alex: Kamal "needs a card with money on it," then "we need to come up with the budget" and execution plan.',
      },
      {
        kind: "local",
        label: "Founder call 1 · AOV",
        path: "docs/founder-context/transcripts/alex-call-01.segments.txt",
        startLine: 29,
        endLine: 35,
        detail:
          "Alex says a tool/feature upsell that helps students raise AOV would unlock more ad spend and leads.",
      },
      {
        kind: "local",
        label: "Architecture · Phases 4–5",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 516,
        endLine: 525,
        detail:
          "The spend card appears in Phase 4; the AgencyOS upsell experiment appears only in Phase 5.",
      },
    ],
  },
  {
    id: "F2",
    severity: "Critical",
    categories: ["Compliance", "Technology boundary"],
    title: "The claimed consent choke point cannot control every send",
    conclusion:
      'The document says no human or AI send bypasses the policy gate, yet Alex may continue sending inside GHL and Phase 2 uses "GHL-native SMS/email." Observing an outbound webhook after delivery is not enforcement. The proposed opted-in/implied/unknown/opted-out state is also too coarse to prove authorization for a particular seller, purpose, destination, and channel.',
    impact:
      "An AgencyOS workflow, a GHL workflow, a manual GHL send, or a retry can produce a regulated message without one authoritative authorization decision and immutable evidence trail.",
    correction: [
      "Make one `authorizeAndEnqueueSend` operation the only interface for every AgencyOS-controlled outbound side effect; agents and UI code receive no direct provider credentials.",
      "Treat GHL-native/manual outbound as observed-but-not-enforced unless native workflows and permissions are explicitly constrained. Phase 1 may rank dormant leads but must not contact uncleared destinations.",
      "Model append-only consent/revocation events plus materialized policy state keyed by tenant, normalized person/contact point, channel, purpose, and seller; retain evidence, disclosure version, scope, timezone, suppression reason, and decision output. `implied` and `unknown` are non-sendable for promotional SMS/iMessage.",
      "Normalize reasonable opt-out expressions across channels, cancel queued sends, re-check policy at dispatch, and include DNC, reassigned-number, and recipient-local-time controls in the decision.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · consent gate",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 263,
        endLine: 270,
        detail:
          'The policy claims "No send bypasses it, human or AI" but lists only a four-state consent summary.',
      },
      {
        kind: "local",
        label: "Architecture · normal GHL work",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 408,
        endLine: 414,
        detail:
          "Alex works normally in GHL; the resulting outbound event is linked only after the action.",
      },
      {
        kind: "web",
        label: "GHL · LC Phone Messaging Policy",
        url: "https://help.gohighlevel.com/support/solutions/articles/48001213941-lc-phone-messaging-policy",
        detail:
          "HighLevel applies its messaging policy to all platform messaging, including one-to-one Conversations sends, and says SMS should be sent only to opted-in contacts.",
      },
      {
        kind: "web",
        label: "GHL · User Replied trigger",
        url: "https://help.gohighlevel.com/support/solutions/articles/155000002677-workflow-trigger-user-replied",
        detail:
          "GHL describes this trigger as reacting after a reply/delivery path; workflow-generated messages do not fire it.",
      },
      {
        kind: "web",
        label: "FCC · TCPA rules",
        url: "https://www.fcc.gov/sites/default/files/tcpa-rules.pdf",
        detail:
          "FCC rules require evidence appropriate to the communication and require reasonable revocation methods to be honored.",
      },
      {
        kind: "web",
        label: "FTC · CAN-SPAM guide",
        url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
        detail:
          "Commercial email also requires accurate sender information, a postal address, opt-out mechanics, and timely suppression.",
      },
    ],
  },
  {
    id: "F3",
    severity: "High",
    categories: ["GHL", "Integration", "Sequencing"],
    title: "PIT, workflow webhooks, and OAuth are presented as one smooth integration path",
    conclusion:
      "They are different transports with different provisioning, coverage, and authenticity contracts. A PIT supports internal REST access, but the four named Phase 0 event types are Marketplace/OAuth subscriptions; no first-party workflow contract supplies a generic stream of every manual outbound message. Custom workflow webhooks fire only when a configured workflow reaches that action. The later private-app route also has an agency-install ceiling.",
    impact:
      "Phase 0 can silently miss lifecycle events, verify the wrong signature scheme, or depend on manually maintained GHL workflows. Productization can stall at the sixth agency.",
    correction: [
      "Use a Private Marketplace OAuth app in Phase 0 for the required event subscriptions and retain a least-privilege PIT for REST backfill. If OAuth is deferred, label Phase 0 partial observation and treat only AgencyOS-originated sends as authoritative.",
      "Add an event transport matrix: event, source transport, owning credential, scope, provisioning owner, raw-byte signature/secret verification, replay key, ordering key, and reconciliation query.",
      "Capture signed sandbox fixtures for every required event before claiming coverage. Verify current Ed25519 marketplace signatures before parsing; give custom-workflow webhooks a separate rotating-secret contract.",
      "Define backfill completeness by channel and supported message type: consume short-lived export cursor chains immediately, checkpoint durable date/ID windows, request email explicitly, hydrate email bodies separately, and make native actor attribution nullable with `unknown` confidence.",
      "Use current Private/Public app terminology and design install, refresh, revocation, uninstall, and security-review timing before tenant six.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · auth progression",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 255,
        endLine: 260,
        detail:
          "PIT, workflow webhooks, full subscriptions, and student OAuth are described as a progression without a per-event contract.",
      },
      {
        kind: "local",
        label: "Architecture · Phase 0",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 492,
        endLine: 501,
        detail:
          "Phase 0 assumes four workflow events; Phase 1 then claims ≥95% thread ingestion without defining the denominator or fixtures.",
      },
      {
        kind: "web",
        label: "GHL · authorization",
        url: "https://marketplace.gohighlevel.com/docs/Authorization/",
        detail:
          "GHL distinguishes Private Integration Tokens for internal integrations from OAuth app authorization.",
      },
      {
        kind: "web",
        label: "GHL · webhook integration guide",
        url: "https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/",
        detail:
          "Marketplace subscriptions are configured against an app and have explicit retry/deduplication behavior.",
      },
      {
        kind: "web",
        label: "GHL · Conversations v3 specification",
        url: "https://github.com/GoHighLevel/highlevel-api-docs/blob/main/apps/v3/conversations-v3.json",
        detail:
          "Exports have channel/type qualifications, short-lived cursor behavior, separate email-body hydration, and optional actor/source fields that prevent an unconditional “full backfill” or Alex/Manny attribution claim.",
      },
      {
        kind: "web",
        label: "GHL · webhook authorization",
        url: "https://marketplace.gohighlevel.com/docs/webhook/Authorization/",
        detail:
          "Current marketplace webhooks use `X-GHL-Signature` with Ed25519; the legacy signature is being retired.",
      },
      {
        kind: "web",
        label: "GHL · Private Integrations",
        url: "https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrations/",
        detail:
          "Private apps are limited to five unique agency installations unless distribution/review requirements change the posture.",
      },
    ],
  },
  {
    id: "F4",
    severity: "High",
    categories: ["Reliability", "Data storage"],
    title: "Inbound deduplication is mistaken for end-to-end exactly-once behavior",
    conclusion:
      "The Phase 0 replay test proves only one Convex row per duplicate webhook. It does not cover crashes between Convex, R2, and GHL or ambiguous provider timeouts. The evidence-store contract also calls R2 JSONL append-only even though rewriting an existing object replaces it.",
    impact:
      "A crash can create a ledger row without evidence, evidence without a ledger row, duplicate outbound messages, or a send whose final state is unknowable. Concurrent JSONL writers can overwrite one another.",
    correction: [
      "Use a durable inbox and outbox with deterministic receipt, intent, attempt, and provider IDs; model `pending`, `sent`, `failed`, and `unknown`, and reconcile ambiguous outcomes before retrying.",
      "Store one immutable object per webhook/call/model artifact under a deterministic key with hash, size, tenant, and retention class. Compact to JSONL/Parquet later; never append via read/merge/re-upload.",
      "Add failure-injection tests at each Convex ↔ R2 ↔ provider boundary.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · archive and reconciliation",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 247,
        endLine: 258,
        detail:
          "R2 is assigned append-only JSONL while ingestion promises archive plus idempotent upsert.",
      },
      {
        kind: "local",
        label: "Architecture · Phase 0 test",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 492,
        endLine: 495,
        detail:
          "The only idempotency exit criterion is replaying one inbound webhook into one ledger row.",
      },
      {
        kind: "web",
        label: "Convex · actions",
        url: "https://docs.convex.dev/functions/actions",
        detail:
          "Convex actions are not automatically retried because external side effects cannot be safely replayed.",
      },
      {
        kind: "web",
        label: "Cloudflare R2 · consistency",
        url: "https://developers.cloudflare.com/r2/reference/consistency/",
        detail:
          "Writes to the same key are last-writer-wins; replacing a key is not append semantics.",
      },
      {
        kind: "web",
        label: "Cloudflare R2 · bucket locks",
        url: "https://developers.cloudflare.com/r2/buckets/bucket-locks/",
        detail:
          "Finite lock policies can protect objects, but lock and lifecycle design must agree with deletion requirements.",
      },
    ],
  },
  {
    id: "F5",
    severity: "Critical",
    categories: ["Multi-tenancy", "Data model", "Authorization"],
    title: "An `agencyId` column is not a tenant boundary or a person identity model",
    conclusion:
      'The architecture says one field now prevents future tenant catastrophe and promises that no query crosses it. Convex authorization is application logic, not row-level security. Separately, GHL contact IDs are location-scoped and contacts can merge, so a lead/contact row is not a stable person, contact point, or consent subject.',
    impact:
      "A missed filter, unchecked document ID, scheduled job, vector query, or merge can disclose another agency's PII or attach consent, outcomes, and experiment assignments to the wrong human.",
    correction: [
      "Define authenticated principals, memberships, roles, and explicit agency/company/location relationships. Derive tenant scope server-side through one authorization helper on every public query, mutation, action, HTTP endpoint, search, and job.",
      "Separate `person`, `contactPoint`, `sourceContact`, and `externalAlias/merge` records; key external identities by vendor and location and define merge/split provenance plus suppression-union rules.",
      "Test cross-tenant IDs, pagination, full-text/vector search, HTTP routes, schedules, exports, and credentials. Use separate deployments where contractual hard isolation requires it.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · tenancy law",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 434,
        endLine: 446,
        detail:
          'The proposed isolation mechanism is "`agencyId` everywhere" plus tenant-scoped indexes.',
      },
      {
        kind: "local",
        label: "Architecture · lifecycle entities",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 309,
        endLine: 325,
        detail:
          "Lead/contact lifecycle, consent, calls, revenue, and outcomes are joined without a stable person/external-identity layer.",
      },
      {
        kind: "web",
        label: "Convex · authorization in functions",
        url: "https://docs.convex.dev/auth/functions-auth",
        detail:
          "Convex exposes authenticated identity; application functions must implement authorization.",
      },
      {
        kind: "web",
        label: "Convex · vector search filters",
        url: "https://docs.convex.dev/search/vector-search",
        detail:
          "Vector filters are explicit query behavior, not automatic tenant isolation.",
      },
      {
        kind: "web",
        label: "GHL · merging contacts",
        url: "https://help.gohighlevel.com/support/solutions/articles/155000003276-how-to-merge-contacts",
        detail:
          "GHL retains one contact and combines information during a merge, requiring aliases and provenance downstream.",
      },
    ],
  },
  {
    id: "F6",
    severity: "High",
    categories: ["Privacy", "Security", "Retention"],
    title: "The self-review claims privacy controls that the architecture body never defines",
    conclusion:
      "Section 13 says purge, role-scoped auth, restricted buckets, provider allowlists, and redaction were added. The operative sections still provide no retention periods, access matrix, deletion state machine, backup/export treatment, legal-hold/suppression exception, or provider erasure path. Full model prompts/completions are logged by default, duplicating sensitive content.",
    impact:
      "Call recordings, lead messages, derived traits, model payloads, exports, and backups may be over-retained, overexposed internally, or impossible to delete consistently.",
    correction: [
      "Add a purpose-based retention matrix for every data class and a principal × resource × operation access matrix.",
      "Specify an idempotent purge state machine spanning Convex, R2, indexes, exports, backups, model/transcription vendors, and deletion receipts, with legal-hold and minimal suppression-proof exceptions.",
      "Store model metadata, template/version, evidence references, costs, and redacted payloads by default; retain full prompt/completion content only when justified, access-restricted, and short-lived.",
      "Inventory processors, DPAs/subprocessors, credential rotation, residency, and cross-border transfer before copying the corpus.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · model boundary",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 287,
        endLine: 294,
        detail:
          "Every model call logs prompt/completion, while minimization is expressed only as field redaction where fields are unnecessary.",
      },
      {
        kind: "local",
        label: "Architecture · asserted revisions",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 607,
        endLine: 611,
        detail:
          'The self-review says controls were "added," but the cited body sections contain no executable policy or schema.',
      },
      {
        kind: "web",
        label: "Cloudflare R2 · data location",
        url: "https://developers.cloudflare.com/r2/reference/data-location/",
        detail:
          "Jurisdiction restrictions must be selected deliberately when the bucket is created and cannot later be changed.",
      },
    ],
  },
  {
    id: "F7",
    severity: "High",
    categories: ["Vendor lock-in", "Recovery"],
    title: "Portable exports are being treated as both backups and an exit plan",
    conclusion:
      "Nightly/weekly JSONL or Parquet snapshots reduce data hostage risk, but they do not restore environment configuration, schedules, auth mappings, indexes, secrets, R2 metadata, GHL installations, or a working replacement service. The document repeatedly cites a nonexistent §3.11 for this discipline.",
    impact:
      "A folder of exports may satisfy neither disaster recovery nor vendor migration. The team can discover that only after an outage or forced platform exit.",
    correction: [
      "Separate operational backup/restore from vendor-exit export.",
      "Define stable application IDs and a versioned export manifest with schema, relationships, checksums, object metadata, provenance, and configuration references without secrets.",
      "Set RPO/RTO and run periodic restore plus rehydration drills into a clean environment; document the replacement procedure rather than only the file format.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · lock-in claims",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 231,
        endLine: 253,
        detail:
          "GHL and Convex lock-in are called bounded primarily because entities and snapshots are exported.",
      },
      {
        kind: "local",
        label: "Architecture · missing cross-reference",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 584,
        endLine: 590,
        detail:
          "Convex risk cites §3.11, but the document has no §3.11.",
      },
      {
        kind: "web",
        label: "Convex · backup and restore",
        url: "https://docs.convex.dev/database/backup-restore",
        detail:
          "Snapshot exports cover data and files but not environment variables, source, configuration, or scheduled functions; restoration is a separate operation.",
      },
    ],
  },
  {
    id: "F8",
    severity: "Critical",
    categories: ["Evaluation", "Learning leakage"],
    title: "The golden set and historical ranker can see the answer",
    conclusion:
      "Every prompt/playbook change is tuned against the same ≥50 historical decisions while retrieval ranges over the same corpus. No rule excludes the eval thread, the actual action, post-decision messages, or final outcome from model context. Current tags and opportunity state are also backfilled even though they may have been created after the historical decision. Old high-ticket/hard-upsell wins come from a policy and offer regime the new system rejects.",
    impact:
      "A model can retrieve or infer the historical answer and appear calibrated or Alex-like without predicting a live decision. Repeated tuning overfits the benchmark; post-outcome tags create direct target leakage; obsolete sales behavior becomes a misleading success label.",
    correction: [
      "Materialize immutable `asOfDecisionTs` examples with hidden action/outcome labels and enforce `observedAt <= decisionTs` for every feature.",
      "Split by normalized person and time into exemplar/training, development, and locked test sets. Exclude the test person/thread, experiment holdouts, and all post-decision records from retrieval and playbook mining.",
      "Add offer, price, campaign, source, channel, and policy-era fields. Use old regimes as contrast/hypothesis evidence unless they match the intended policy.",
      "Keep a frozen core test set and a separate prospective pool; use the core only at declared milestones. Require verified outcome labels and an offline-eval pass before any lead-facing copilot rollout.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · golden set",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 345,
        endLine: 351,
        detail:
          "The same curated historical set is replayed for every prompt/model/playbook change.",
      },
      {
        kind: "local",
        label: "Architecture · retrieval and backfill",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 498,
        endLine: 507,
        detail:
          "Current tags/opportunities are backfilled and Phase 2 retrieval runs over the corpus without an event-time or exclusion contract.",
      },
      {
        kind: "local",
        label: "Founder call 2 · historical hypotheses",
        path: "docs/founder-context/transcripts/alex-call-02.segments.txt",
        startLine: 53,
        endLine: 75,
        detail:
          "The founders propose scanning closed threads, tags, actions, and outcomes—the exact data that must be separated at evaluation time.",
      },
      {
        kind: "web",
        label: "scikit-learn · data leakage",
        url: "https://scikit-learn.org/stable/common_pitfalls.html#data-leakage",
        detail:
          "Data leakage occurs when information unavailable at prediction time is used during model development or evaluation.",
      },
      {
        kind: "web",
        label: "OpenAI · evaluation best practices",
        url: "https://developers.openai.com/api/docs/guides/evaluation-best-practices",
        detail:
          "Evals should represent production distributions and be designed to avoid biased, non-generalizable measurements.",
      },
    ],
  },
  {
    id: "F9",
    severity: "High",
    categories: ["Evaluation", "Provenance"],
    title: "Shadow mode records counterfactual and assistance-contaminated labels as facts",
    conclusion:
      'A downstream outcome is attached to both the action Alex executed and the recommendation he did not execute, enabling the question "whose choice won?" The unexecuted recommendation has no observable outcome. Meanwhile `sourceRecommendationId` is optional and normal GHL sends cannot reveal whether Alex copied an AI draft, so AI text can re-enter the corpus as supposedly independent human behavior.',
    impact:
      "False reward labels and hidden AI assistance create a self-reinforcing loop: the system learns from its own text while reporting imitation and outcome gains as if they came from Alex.",
    correction: [
      "Attach outcomes only to the executed action. An unexecuted recommendation may reference the factual outcome for audit but must remain `executed=false` and be excluded from reward/performance calculations.",
      "Give every displayed draft an immutable ID and preserve exact edit lineage on gated sends. Default GHL-originated sends to `assistanceUnknown`, not `humanOnly`.",
      "Exclude `assisted` and `assistanceUnknown` actions from the pure Alex-imitation corpus; use them only to evaluate the joint human–AI policy. Capture preference labels before response/outcome and treat them as imitation labels only.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · shadow comparison",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 408,
        endLine: 424,
        detail:
          "Outcomes accrue to both executed action and recommendation; recommendation lineage on action records is optional.",
      },
      {
        kind: "local",
        label: "Architecture · data classes",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 322,
        endLine: 330,
        detail:
          "The intended assisted label is sound, but later ingestion paths do not guarantee that it is observable.",
      },
    ],
  },
  {
    id: "F10",
    severity: "High",
    categories: ["Experiments", "Autonomy"],
    title: "The experiment and autonomy gates do not support the causal claims they authorize",
    conclusion:
      "Randomization is allowed at lead or thread level without a normalized-person assignment, persistent exposure state, delivery accounting, outcome maturity, power target, stopping rule, or intent-to-treat analysis. Bounded autonomy is then gated mainly on agreement/acceptance with Alex, which measures imitation rather than business benefit or safety.",
    impact:
      "The same person can enter multiple arms, delivery/edit behavior can bias results, immature cohorts can look superior, and a high-agreement model can receive send authority despite no demonstrated outcome value.",
    correction: [
      "Randomize once per normalized person for each campaign/policy and persist eligibility, assignment, attempt, delivery, exact payload/edit, and `outcomeMatureAt`.",
      "Predeclare primary metric, horizon, minimum detectable effect, exclusions, stopping date, and multiplicity handling; analyze intent-to-treat.",
      "Keep agreement/acceptance for imitation UX only. Require prospective safety plus mature outcome evidence for each segment × action × channel autonomy grant.",
      "Keep holdouts out of retrieval, score fitting, and playbook mining. Evaluate Phase 4 with randomized assisted-champion versus autonomous-challenger traffic, not a sequential before/after rollout.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · evaluation tiers",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 345,
        endLine: 351,
        detail:
          "The causal tier names metrics and horizons but not the assignment, exposure, censoring, or analysis contract.",
      },
      {
        kind: "local",
        label: "Architecture · graduation metrics",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 426,
        endLine: 428,
        detail:
          "Rolling agreement and acceptance are central autonomy gates.",
      },
      {
        kind: "local",
        label: "Architecture · assisted and autonomous phases",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 510,
        endLine: 519,
        detail:
          "Experiments authorize playbook promotion and then bounded autonomy without a complete causal protocol.",
      },
      {
        kind: "web",
        label: "scikit-learn · grouped cross-validation",
        url: "https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators-for-grouped-data",
        detail:
          "Dependent samples require grouped evaluation so the same group does not leak across comparisons.",
      },
    ],
  },
  {
    id: "F11",
    severity: "Critical",
    severityNote: "gate before autonomous tools",
    categories: ["Agent security", "Retrieval", "Privacy"],
    title: "Untrusted CRM content is connected to retrieval and future tools without a trust boundary",
    conclusion:
      "Lead messages, transcripts, files, and tool results are attacker-controlled content. The design retrieves across the tenant corpus, later grants spend authority, and eventually exposes write-capable MCP tools, but it defines no prompt-injection boundary, within-tenant lead isolation, output DLP, link policy, or deterministic tool validation.",
    impact:
      "A malicious lead or document can instruct the model to leak another lead's PII, poison the playbook, generate malicious links, or trigger unauthorized send/spend actions. Tenant scoping alone does not prevent cross-lead disclosure.",
    correction: [
      "Create two retrieval domains: the current lead/thread and a separately approved, de-identified exemplar library. Never retrieve arbitrary other-lead raw threads into a live response.",
      "Treat all CRM, file, retrieval, and tool text as untrusted data, never as system/developer instructions.",
      "Give the recommender no secrets or write tools. Require typed outputs, least-privilege capabilities, deterministic validators, explicit side-effect approval, output DLP/link allowlists, and prompt-injection eval fixtures before autonomous sends, spend, or write-capable MCP.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · tenant-scoped retrieval",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 434,
        endLine: 446,
        detail:
          "Retrieval is scoped only by agency; raw threads remain available across leads within the same tenant.",
      },
      {
        kind: "local",
        label: "Architecture · retrieval, spend, and write tools",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 504,
        endLine: 525,
        detail:
          "Corpus retrieval is followed by spend authority and eventually write-scoped MCP tools, with no hostile-content design.",
      },
      {
        kind: "web",
        label: "OpenAI · agent safety",
        url: "https://developers.openai.com/api/docs/guides/agent-builder-safety",
        detail:
          "OpenAI warns that prompt injection can exfiltrate private data or cause misaligned tool calls and recommends keeping untrusted data from directly driving agent behavior.",
      },
      {
        kind: "web",
        label: "Anthropic · mitigate jailbreaks",
        url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks",
        detail:
          "Anthropic recommends explicit untrusted-content handling, least privilege, screening, and sandboxing for third-party content and tool results.",
      },
    ],
  },
  {
    id: "F12",
    severity: "High",
    categories: ["Repository governance", "Sequencing"],
    title: "The review supersedes decisions on paper, but the repository still marks the old stack as accepted",
    conclusion:
      "Section 11 says ADR-003/005/006/007 and the earlier architecture/strategy must be amended or superseded. None of those dispositions has been applied. The repository therefore contains two authoritative-looking plans: the review's Convex-first, GHL-first, eval-gated roadmap and the older Hermes-first, iMessage-primary, spend-card-first roadmap.",
    impact:
      "An engineer or coding agent following accepted ADRs or the sibling strategy can build the wrong runtime, channel, data vocabulary, and rollout order even while believing it is complying with repository governance.",
    correction: [
      "Before implementation, add supersession banners to the earlier architecture and current-strategy documents and point `founder-intent.md` to this review as the canonical technical plan.",
      "Amend ADR-003/005/006/007 exactly as §11.1 requires; distinguish a Phase 0 human operating budget from Phase 4 autonomous spend.",
      "Create the proposed ledger/provenance, consent, evaluation, and export/retention ADRs—or short stubs that lock the relevant review sections—before writing the Phase 0 schema.",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture review · required dispositions",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 536,
        endLine: 544,
        detail:
          "The review explicitly requires amendments and supersession, but those actions remain unexecuted.",
      },
      {
        kind: "local",
        label: "ADR-003 · spend card",
        path: "docs/decisions/ADR-003-agent-spend-card.md",
        startLine: 13,
        endLine: 18,
        detail:
          "The accepted ADR still makes card provisioning a blocker before serious autonomy without the review's two-budget distinction.",
      },
      {
        kind: "local",
        label: "ADR-006 · iMessage primary",
        path: "docs/decisions/ADR-006-imessage-alex-clone.md",
        startLine: 11,
        endLine: 17,
        detail:
          "The accepted ADR still makes iMessage the primary channel and assumes Hermes/MCP-compatible sending infrastructure.",
      },
      {
        kind: "local",
        label: "Earlier architecture · Hermes stack",
        path: "docs/architecture/agencyos-architecture.md",
        startLine: 129,
        endLine: 152,
        detail:
          "The sibling architecture still prescribes Hermes operations and an iMessage nurture pilot without a supersession banner.",
      },
      {
        kind: "local",
        label: "Current strategy · old rollout",
        path: "docs/founder-context/agencyos-current-strategy.md",
        startLine: 49,
        endLine: 58,
        detail:
          "The strategy still orders card, iMessage, and Hermes dashboard work differently from the reviewed roadmap.",
      },
    ],
  },
  {
    id: "F13",
    severity: "Critical",
    categories: ["Privacy", "Call intelligence", "Sequencing"],
    title: "The call pipeline copies and transcribes recordings before proving processing rights",
    conclusion:
      'The pipeline order is acquire → archive → transcribe, while recording-consent verification is a later audit note qualified with "likely already handled." Phase 1 nevertheless requires every located recording to receive a timestamped transcript. Lawful recording at capture, present ownership/license, participant jurisdiction, and permission for vendor/model processing are separate facts.',
    impact:
      "Downloading, duplicating to R2, disclosing to transcription/model vendors, or mining an uncertified recording can create privacy and wiretap exposure before the architecture reaches its supposed consent check.",
    correction: [
      "Inventory metadata without copying media, and quarantine every recording by default.",
      "Require a per-call rights manifest—source/owner, participant jurisdictions, notice/consent evidence, permitted purposes, processor permissions, retention class—before download, archive, transcription, retrieval, or model use.",
      "Change the Phase 1 exit criterion from “every located recording transcribed” to “every rights-cleared recording transcribed; unresolved recordings counted and quarantined.”",
    ],
    evidence: [
      {
        kind: "local",
        label: "Architecture · call pipeline",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 383,
        endLine: 400,
        detail:
          "Acquisition, R2 archival, and vendor transcription precede the consent/processing-rights check.",
      },
      {
        kind: "local",
        label: "Architecture · Phase 1 exit",
        path: "docs/architecture/agencyos-architecture-review-2026-08-08.md",
        startLine: 498,
        endLine: 501,
        detail:
          "The phase requires a transcript for every located recording, with no rights-cleared qualifier.",
      },
      {
        kind: "web",
        label: "Federal law · 18 U.S.C. §2511",
        url: "https://uscode.house.gov/view.xhtml?req=%28title%3A18%20section%3A2511%20edition%3Aprelim%29",
        detail:
          "Federal law provides a one-party baseline in specified circumstances; stricter state rules can control.",
      },
      {
        kind: "web",
        label: "California · Penal Code §632",
        url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632",
        detail:
          "California requires all-party consent for covered confidential communications.",
      },
      {
        kind: "web",
        label: "Florida · §934.03",
        url: "https://flsenate.gov/Laws/Statutes/2025/934.03",
        detail:
          "Florida law illustrates another all-party-consent jurisdiction relevant to a per-call rights manifest.",
      },
    ],
  },
];

const retainedDecisions = [
  "Keep GHL as the operational CRM/system of engagement rather than rebuilding it.",
  "Use a separate canonical/provenance layer and object evidence store; the split is proportionate at this scale if the durability contract is corrected.",
  "Keep raw evidence, human action, AI interpretation, recommendation, and outcome as distinct classes.",
  "Defer custom training until there is a measured prompted-model gap and leak-resistant evaluation.",
  "Use human review, prospective experiments, scoped autonomy, and a kill switch.",
  "Defer unrestricted iMessage and autonomous spend until consent, provider, and safety evidence exists.",
  "Treat the repository as documentation-only; the architecture accurately does not claim existing implementation.",
];

const correctionOrder = [
  {
    stage: "0",
    title: "Close factual and operating prerequisites",
    detail:
      "Reconcile superseded docs/ADRs, budget/card boundary, VSL/AOV discovery, representative GHL payloads, consent evidence sample, and call-rights manifests.",
  },
  {
    stage: "1",
    title: "Specify enforceable boundaries",
    detail:
      "Auth/membership, person/contact identity, consent events, retention/access matrix, event transport matrix, webhook verification.",
  },
  {
    stage: "2",
    title: "Build durable observation",
    detail:
      "Inbox/outbox, object-per-event archive, deterministic IDs, reconciliation, failure injection, restore/export manifest.",
  },
  {
    stage: "3",
    title: "Build a sealed learning system",
    detail:
      "Event-time snapshots, grouped/time splits, retrieval exclusions, assistance lineage, factual-only shadow outcomes.",
  },
  {
    stage: "4",
    title: "Earn causal and agent authority",
    detail:
      "Persistent person-level assignment, mature intent-to-treat outcomes, injection tests, typed tools, per-scope autonomy evidence.",
  },
];

function SeverityMark({
  severity,
  note,
}: {
  severity: Severity;
  note?: string;
}) {
  const theme = useHostTheme();
  const color = severity === "Critical" ? theme.category.red : theme.category.orange;
  return (
    <Row gap={7} align="center">
      <Swatch color={severity === "Critical" ? "red" : "orange"} />
      <Text
        as="span"
        size="small"
        weight="semibold"
        style={{ color, whiteSpace: "nowrap" }}
      >
        {severity}
        {note ? ` · ${note}` : ""}
      </Text>
    </Row>
  );
}

function EvidenceItem({ source }: { source: Evidence }) {
  const dispatch = useCanvasAction();
  const theme = useHostTheme();

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: `1px solid ${theme.stroke.tertiary}`,
      }}
    >
      <Stack gap={5}>
        {source.kind === "local" ? (
          <Row gap={8} align="center" wrap>
            <Button
              variant="ghost"
              style={{ padding: "2px 8px" }}
              onClick={() =>
                dispatch({
                  type: "openFile",
                  path: source.path,
                  selection: {
                    startLineNumber: source.startLine,
                    startColumn: 1,
                    endLineNumber: source.endLine,
                    endColumn: 1,
                  },
                })
              }
            >
              {source.label}
            </Button>
            <Text as="span" size="small" tone="tertiary">
              L{source.startLine}–{source.endLine}
            </Text>
          </Row>
        ) : (
          <Link href={source.url}>{source.label}</Link>
        )}
        <Text size="small" tone="secondary">
          {source.detail}
        </Text>
      </Stack>
    </div>
  );
}

function FindingSection({ finding }: { finding: Finding }) {
  const theme = useHostTheme();

  return (
    <CollapsibleSection
      title={`${finding.id} — ${finding.title}`}
      leading={
        <Swatch color={finding.severity === "Critical" ? "red" : "orange"} />
      }
      trailing={
        <Text
          as="span"
          size="small"
          weight="semibold"
          style={{
            color:
              finding.severity === "Critical"
                ? theme.category.red
                : theme.category.orange,
          }}
        >
          {finding.severity}
        </Text>
      }
      defaultOpen={finding.severity === "Critical"}
      style={{ borderBottom: `1px solid ${theme.stroke.tertiary}` }}
    >
      <Stack gap={14} style={{ padding: "8px 0 18px" }}>
        <Row gap={7} wrap>
          {finding.categories.map((category) => (
            <Pill key={category} size="sm">
              {category}
            </Pill>
          ))}
          {finding.severityNote ? (
            <Pill size="sm">{finding.severityNote}</Pill>
          ) : null}
        </Row>

        <Text>{finding.conclusion}</Text>

        <Callout tone="warning" title="Why it matters">
          {finding.impact}
        </Callout>

        <div>
          <H3>Smallest correction</H3>
          <Stack gap={7}>
            {finding.correction.map((item, index) => (
              <Row key={item} gap={9} align="start">
                <Text
                  as="span"
                  size="small"
                  weight="semibold"
                  style={{
                    color: theme.accent.primary,
                    minWidth: 18,
                    paddingTop: 1,
                  }}
                >
                  {index + 1}.
                </Text>
                <Text size="small">{item}</Text>
              </Row>
            ))}
          </Stack>
        </div>

        <CollapsibleSection
          title="Evidence"
          count={finding.evidence.length}
          defaultOpen={finding.severity === "Critical"}
        >
          <Stack gap={0}>
            {finding.evidence.map((source) => (
              <EvidenceItem
                key={
                  source.kind === "local"
                    ? `${source.path}:${source.startLine}`
                    : source.url
                }
                source={source}
              />
            ))}
          </Stack>
        </CollapsibleSection>
      </Stack>
    </CollapsibleSection>
  );
}

export default function AgencyOSArchitectureAudit() {
  const theme = useHostTheme();
  const [filter, setFilter] = useCanvasState<Filter>("finding-filter", "all");
  const visible = findings.filter((finding) => {
    if (filter === "critical") return finding.severity === "Critical";
    if (filter === "high") return finding.severity === "High";
    return true;
  });
  const criticalCount = findings.filter(
    (finding) => finding.severity === "Critical",
  ).length;
  const highCount = findings.length - criticalCount;

  return (
    <Stack
      gap={28}
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "32px 28px 48px",
        color: theme.text.primary,
      }}
    >
      <Stack gap={12}>
        <Row gap={10} align="center" wrap>
          <Pill active size="sm">
            Independent audit
          </Pill>
          <Text as="span" size="small" tone="tertiary">
            Evidence checked 8 Aug 2026
          </Text>
        </Row>
        <H1>AgencyOS architecture audit</H1>
        <Text tone="secondary">
          Complete founder transcripts, the current documentation-only
          repository, and material first-party technical documentation were
          checked. This audit preserves sound decisions and isolates only
          consequential defects.
        </Text>
      </Stack>

      <Callout
        tone="warning"
        title={`Verdict: retain the shape, block execution at ${criticalCount} gates`}
      >
        GHL as engagement layer, Convex as canonical core, R2/S3 as evidence
        storage, human review, and deferred fine-tuning are reasonable. Do not
        begin outbound, process uncertified calls, claim multi-tenant isolation,
        trust offline lift, or grant autonomous tools until the corresponding
        critical findings below are corrected.
      </Callout>

      <Grid columns="repeat(auto-fit, minmax(190px, 1fr))" gap={12}>
        <Stat value={findings.length} label="Consequential findings" />
        <Stat value={criticalCount} label="Critical gates" tone="danger" />
        <Stat value={highCount} label="High-priority corrections" tone="warning" />
        <Stat value="0" label="Implementation files present" tone="info" />
      </Grid>

      <Card>
        <CardHeader trailing={<SeverityMark severity="Critical" />}>
          Repository reality
        </CardHeader>
        <CardBody>
          <Text>
            The repository has no commit and no application source, schema,
            tests, package manifest, deployment configuration, or CI. The
            architecture accurately describes proposals rather than existing
            controls; none of its security, reliability, or isolation claims
            can yet be credited as implemented.
          </Text>
        </CardBody>
      </Card>

      <Stack gap={14}>
        <Row gap={12} align="center" justify="space-between" wrap>
          <div>
            <H2>Findings</H2>
            <Text size="small" tone="tertiary">
              Critical findings open by default. Local citations jump to the
              cited lines.
            </Text>
          </div>
          <Row gap={7} wrap>
            <Pill
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All {findings.length}
            </Pill>
            <Pill
              active={filter === "critical"}
              onClick={() => setFilter("critical")}
            >
              Critical {criticalCount}
            </Pill>
            <Pill
              active={filter === "high"}
              onClick={() => setFilter("high")}
            >
              High {highCount}
            </Pill>
          </Row>
        </Row>

        <Stack gap={0}>
          {visible.map((finding) => (
            <FindingSection key={finding.id} finding={finding} />
          ))}
        </Stack>
      </Stack>

      <Divider />

      <Stack gap={14}>
        <H2>Minimum correction order</H2>
        <Text tone="secondary">
          This is a patch sequence, not a replacement architecture.
        </Text>
        <Grid columns="repeat(auto-fit, minmax(280px, 1fr))" gap={12}>
          {correctionOrder.map((item) => (
            <Card key={item.stage}>
              <CardHeader trailing={`Gate ${item.stage}`}>
                {item.title}
              </CardHeader>
              <CardBody>
                <Text size="small" tone="secondary">
                  {item.detail}
                </Text>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>

      <Stack gap={14}>
        <H2>Decisions that survived the audit</H2>
        <Callout tone="success" title="No rewrite is warranted">
          The architecture's core decomposition is defensible. These decisions
          should remain unless new evidence changes them.
        </Callout>
        <Stack gap={8}>
          {retainedDecisions.map((decision) => (
            <Row key={decision} gap={10} align="start">
              <Swatch color="green" />
              <Text size="small">{decision}</Text>
            </Row>
          ))}
        </Stack>
      </Stack>

      <Divider />

      <CollapsibleSection title="Audit scope and limitations" defaultOpen>
        <Stack gap={9} style={{ paddingTop: 8 }}>
          <Text size="small">
            Founder evidence includes both complete raw transcripts and their
            timestamped segment files, not only the curated summaries. Technical
            claims use current first-party GHL, Convex, Cloudflare, FCC/FTC,
            OpenAI, Anthropic, and scikit-learn documentation where material.
          </Text>
          <Text size="small" tone="secondary">
            Legal references identify architecture requirements and unresolved
            risk; they are not a substitute for counsel reviewing the actual
            consent language, number provenance, recording jurisdictions,
            processor agreements, and campaign facts.
          </Text>
          <Text size="small" tone="secondary">
            Unverified business facts—actual GHL payload coverage, consent
            evidence, payment joins, call location, provider idempotency, and
            processor chain—remain discovery gates, not assumed defects.
          </Text>
        </Stack>
      </CollapsibleSection>
    </Stack>
  );
}
