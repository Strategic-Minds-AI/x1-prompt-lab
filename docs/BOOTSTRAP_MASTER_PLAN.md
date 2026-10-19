# Strategic Minds AI — Master Bootstrap, Business and Operating Plan
**Version:** 1.0.0-draft  
**Status:** Strategy baseline; not a production-readiness certification  
**Owner:** Strategic Minds AI  
**Canonical starting repository:** `Strategic-Minds-AI/x1-prompt-lab`

## 1. Executive decision

Use X1 Prompt Lab as the **prompt engineering, evaluation, operator workbench, and workflow-specification layer**—not as the sole runtime, database, scheduler, security authority, or source of truth for every system. Bootstrap the wider platform around one versioned execution contract and one authoritative task/control plane. Keep working services; inventory before migrating; do not rebuild all repositories.

The immediate business goal is to stabilize and launch StrategicMindsAI.com and deliver existing client commitments. The immediate technical goal is to prove one synthetic staging task end-to-end before scaling any batch workload.

## 2. Vision and product portfolio

Strategic Minds AI is intended to combine:
- AI software development, integration, and consulting.
- A Prompt Lab for prompt design, versioning, test fixtures, evaluations, chains, and safe orchestration.
- Data discovery, research, ingestion, parsing, normalization, entity resolution, validation, enrichment, provenance, and permitted monetization.
- Digital Dominance: website and app generation, client/admin portals, CRM and workflow automation, content/media production, analytics, SEO, and conversion optimization.
- Communications: approved email, calendar, SMS/MMS, voice, WhatsApp, and social integrations through official APIs and explicit customer authorization.
- Intelligence products such as lawful property, heir-location, lead, and distressed-property research, with source provenance, purpose limitation, access controls, and human review where required.
- Local inference using Ollama and suitable open-source models, with cloud models used only when justified by quality, capability, latency, or cost.

## 3. Operating principles

1. Inspect before modifying; preserve working behavior.
2. Keep one canonical owner per responsibility.
3. Version schemas and integration contracts.
4. Prefer deterministic code for permissions, state transitions, validation, retries, routing, and calculations; use LLMs for bounded judgment and generation.
5. Never treat a model answer, build success, generated database row, or successful API response as proof of end-to-end correctness.
6. Every consequential job has an ID, owner, state, attempt count, idempotency key, timestamps, cost budget, evidence, and receipt.
7. Retries are bounded; repeated failures go to a dead-letter queue.
8. Run changes in branches and staging; preserve rollback.
9. Self-repair is limited to pre-authorized, reversible, testable changes. Production, data deletion, secrets, permissions, billing, domains, and customer-facing publication require the configured approval gate.
10. Record unknowns as UNKNOWN; never invent access, test results, ranking outcomes, source records, or completion.
11. Use synthetic test data by default.
12. Keep private, sensitive, regulated, or licensed data within approved purposes, sources, retention windows, and access boundaries.

## 4. Architecture and responsibility map

### Prompt Lab
Owns prompt registry, prompt versions, templates, evaluations, test cases, prompt chains, model selection policies, task specifications, and operator-facing workflow visibility. It may submit jobs to the control plane but must not bypass it.

### Control plane
Proposed canonical candidate: `Strategic-Minds-AI/x1-ai-hub-control-plane`. Must be verified as runnable and deployed before being declared authoritative. Owns task intake, authorization decisions, policy checks, approvals, queue/lease state, idempotency, cancellation, retries, and canonical receipts.

### Swarm runtime
Candidate: `Strategic-Minds-AI/x1-ai-hub-swarm-runtime`. Executes leased tasks only under the control plane contract. Owns worker lifecycle, timeouts, bounded retries, worker health, and dead-letter handling—not policy authority.

### Protocol, catalog and gateway
- `x1-ai-hub-protocol`: versioned WorkPacket, task result, approval, capability, and receipt schemas.
- `x1-ai-hub-catalog`: canonical tool/model/capability registry.
- `x1-ai-hub-mcp-gateway`: governed access to tools; tenant scope and capability allowlists enforced server-side.
- `x1-ai-hub-evals`: evaluation fixtures and release gates.
These responsibilities must be confirmed against code and actual deployments.

### Product and launch
- `X1-OPERATING-SYSTEMS`: primary product/admin/customer experience candidate.
- `x1-launch-engine`: website factory and Launch Studio candidate.
- `x1-auto-buiilder` and other builder/template repositories: preserve until capability mapping and parity tests support migration or retirement.
- Digital Dominance: prioritize one real, high-quality client canary before bulk generation.

### Data plane
Use the existing Supabase projects only after each application is mapped to the correct staging/production project. Define schemas, migrations, RLS, tenant isolation, retention, backups, and recovery. Never infer that a project is staging because of its name alone.

### Inference
Use Ollama for suitable local models, with explicit model/version configuration, resource limits, timeouts, structured-output validation, and fallback policy. Local inference does not remove the need for tests, permissions, logging, or quality evaluation.

### External execution
Vercel/Railway/local computer/browser/communications integrations are adapters behind approved capability interfaces. They must not independently invent policy or task authority.

## 5. Deterministic job lifecycle

Canonical state machine:
`DRAFT → VALIDATED → QUEUED → LEASED → RUNNING → RESULT_STAGED → VALIDATING → SUCCEEDED`
Exceptional states: `AWAITING_APPROVAL`, `RETRY_WAIT`, `FAILED`, `CANCELLED`, `DEAD_LETTERED`.

Required invariants:
- A job has a unique ID and stable idempotency key.
- A lease has an expiry, worker identity, heartbeat, and fencing token.
- A stale worker cannot overwrite a newer lease's result.
- Retries do not duplicate non-idempotent effects.
- External mutations are capability-checked immediately before execution.
- Result data is staged, schema-validated, and independently checked before being accepted.
- Receipts include source revision, environment, task/worker IDs, timestamps, attempt count, test/evaluation outcomes, artifact references, sanitized errors, and approval references.
- Authorization or security failures are not blindly retried.
- Queue pressure, worker health, cost limits, and dead-letter rates are observable.

## 6. Bootstrap sequence and exit criteria

### Phase 0 — Protect and inventory
- Pin current default branches and commit SHAs.
- Inventory open PRs, CI, app roots, environment mappings, deployments, database projects, current instructions, and existing queues.
- Export/verify backups for any system about to be modified.
- Create a read-only capability matrix.
**Exit:** inventory has evidence and every critical service has a named canonical candidate.

### Phase 1 — Source of truth
- Confirm one control-plane implementation and its actual runnable entrypoint/deployment.
- Confirm the runtime and protocol versions it consumes.
- Resolve duplicate control-plane and builder implementations by evidence, not repository name.
- Define versioned task, lease, approval, capability, result, and receipt schemas.
**Exit:** compatibility tests pass across producer, control plane, worker, and receipt validator.

### Phase 2 — Prompt Lab foundation
- Create versioned prompt registry with owner, purpose, input schema, output schema, allowed tools, model/version, evaluation set, risk class, and rollback version.
- Add test cases for normal, edge, adversarial, missing-data, and tool-failure cases.
- Separate deterministic steps from LLM judgment.
- Require structured output and schema validation.
**Exit:** core prompts pass evaluation thresholds and can be rolled back to a prior version.

### Phase 3 — Staging queue canary
- Use synthetic data and a nonproduction environment.
- Submit one low-risk task from Prompt Lab.
- Verify authorization, lease, worker execution, persistence, and independent receipt.
- Test timeout, duplicate submission, wrong tenant, expired lease, unavailable model, and malformed output.
**Exit:** success and failure paths pass; no production mutation occurred.

### Phase 4 — Stabilize StrategicMindsAI.com
- Verify production source SHA, build root, domains, environment variables by metadata only, analytics, monitoring, backups, and rollback.
- Fix only high-priority release blockers.
- Run smoke, accessibility, mobile, performance, metadata, structured-data, sitemap, robots, canonical, and broken-link tests.
**Exit:** release candidate passes acceptance tests and rollback is documented.

### Phase 5 — Digital Dominance canary
- Choose one authorized client/project and one template.
- Generate one site with original, fact-checked, helpful content.
- Validate page rendering, forms, analytics, indexability, schema, sitemap, security, and owner approval.
- Keep bulk publishing disabled until the canary and rollback pass.
**Exit:** a verified website can be generated, previewed, approved, published, and monitored.

### Phase 6 — Client delivery package
- Strategy and discovery report.
- Brand/logo concepts and mockups.
- Website concepts and preview.
- 30-day content calendar and a bounded set of approved media assets.
- Digital business card and flyer.
- CRM, intake, quote/invoice, scheduling, and communications setup only where integrations and permissions are confirmed.
- Client review and explicit approval gates.
**Exit:** a client can review, request changes, approve, and receive a documented deliverable package.

### Phase 7 — Scale and operate
- Expand by workload and template only after metrics remain healthy.
- Use canary batches, rate limits, cost caps, duplicate-content checks, quality thresholds, and automatic pause conditions.
- Add scheduled monitoring only through a verified persistent scheduler/worker.
**Exit:** operations have alerts, recovery runbooks, cost controls, ownership, and tested continuity.

## 7. Prompt Lab prompt record specification

Each prompt should store:
- `prompt_id`, name, version, owner, status, purpose, risk class.
- Input JSON Schema and output JSON Schema.
- System/developer/task text and approved examples.
- Allowed tools and denied capabilities.
- Model/provider and exact version where available.
- Temperature/seed or other reproducibility settings where supported.
- Evaluation dataset version and pass thresholds.
- Timeout, token/cost budget, retry policy.
- Required approvals and data classification.
- Test results, change notes, release SHA, rollback target.
- Provenance and evidence links.

A prompt is not production-ready until its tests pass and its version is pinned. A prompt is not a substitute for server-side authorization.

## 8. Business strategy

### Initial offer
Lead with a productized, measurable AI operations and digital-growth engagement rather than promising guaranteed search rankings or a fully autonomous company before the system is validated.

Suggested initial packages (planning prices, to validate with customer demand):
- **AI/Website Audit:** $500–$1,500 fixed scope.
- **Launch Foundation:** $2,500–$7,500 for site/brand/content/workflow setup.
- **Managed Growth & Automation:** $750–$3,000 per month, depending on content volume, support, integrations, and reporting.
- **Custom AI/workflow consulting:** fixed discovery fee followed by milestone-based implementation.
- **Data research/intelligence:** scoped per project with documented lawful source access, provenance, accuracy limits, and permitted use.

Existing signed agreements, client promises, and the proposed $1,200-per-qualified-lead opportunity must be validated against the actual contract, qualification definition, acceptance window, exclusivity, permitted sourcing, and compliance requirements before being included as committed revenue.

### Initial go-to-market
1. Finish StrategicMindsAI.com and one demonstrable case study.
2. Deliver the highest-confidence client commitments first.
3. Sell a bounded paid audit or pilot that converts into a monthly service.
4. Reuse validated templates, not unreviewed cloned pages.
5. Track qualified opportunities, close rate, delivery hours, gross margin, retention, and referrals.
6. Turn verified outcomes into case studies with client permission.

### Positioning
Differentiate through auditable execution, fast deployment, workflow automation, useful data research, strong client control, and measurable outcomes—not claims that no competitor can match or that ranking is guaranteed.

## 9. Financial plan and cost controls

Use actual provider invoices and measured workload data before committing to fixed forecasts. Maintain separate budgets for:
- Hosting/compute and background workers.
- Database, backups, storage, egress and logs.
- Domains, email, phone/SMS/voice, WhatsApp, and social APIs.
- Model inference (local hardware, electricity, or cloud tokens).
- Data licensing, records, and research subscriptions.
- Monitoring, security, and transactional services.
- Human QA, support, and client onboarding.

For each job record `cost_estimate`, `actual_cost`, latency, model/provider, and retry cost. Set per-job, per-client, daily, and monthly caps. Pause low-value loops on budget breaches.

Financial dashboard formulas:
- Revenue = collected setup fees + collected recurring fees + accepted performance fees.
- Gross profit = revenue − direct delivery costs.
- Gross margin = gross profit / revenue.
- Contribution per client = client revenue − attributable compute, data, API, and support costs.
- Break-even clients = fixed monthly costs / average monthly contribution per client.

Do not treat pipeline value, proposed lead pricing, unpaid invoices, or unapproved performance fees as collected revenue.

## 10. SEO and scalable website strategy

No software can guarantee first-page rankings, “100% Google compliance,” or ranking for every AI-related term. Google can ignore or penalize scaled pages created primarily to manipulate rankings. Therefore:
- Generate pages only where each page serves a distinct user need, geography/service offering is real, and content is original and useful.
- Do not mass-publish doorway pages, fabricated locations, copied city substitutions, hidden links, link farms, or automated backlinks.
- Earn links through useful tools, original research, genuine partnerships, client-authorized case studies, and digital PR.
- Use accurate titles, headings, internal links, canonical tags, robots directives, structured data that matches visible content, fast/mobile-accessible UX, and XML sitemaps.
- Connect Search Console and Analytics using authorized official integrations. Submission is not an indexing or ranking guarantee.
- Use controlled experiments and report impressions, clicks, qualified leads, conversion rate, crawl/index coverage, and page quality.
- Do not automatically alter production content solely on noisy traffic signals. Use review thresholds and rollback.

## 11. Data intelligence policy

For data discovery and enrichment, record source URL/provider, retrieval timestamp, collection method, license/terms, permitted purpose, confidence, transformations, retention, and deletion requirements. Prefer public records, licensed datasets, official APIs, and customer-authorized first-party data. Avoid bypassing access controls, evading CAPTCHAs, or collecting sensitive personal data without a lawful basis. Apply purpose limitation, minimization, suppression/opt-out handling, accuracy review, and human review for consequential decisions. Never infer that data is usable for marketing merely because it is accessible.

## 12. Autonomy and safety model

Allowed automatically after tests: read-only audits, lint/typecheck/build/test, synthetic staging tests, draft generation, duplicate checks, local model evaluation, monitoring, and reversible branch-local fixes with regression tests.

Approval required: production deployment, default-branch merge, DNS/domain changes, destructive migrations, bulk publishing, client messages, external outbound campaigns, paid services, permission/secret changes, and irreversible operations.

Self-healing means detect → diagnose → propose/perform bounded reversible repair → test → independently verify → rollback if failed → record receipt. It does not mean unconstrained self-modification or silent policy changes.

## 13. Release acceptance

Do not certify production until:
- Exact release commit and deployment are identified.
- Build, lint, typecheck, unit, integration, and browser tests pass.
- Tenant isolation and database environment mapping are verified.
- Queue duplicate, retry, lease expiry, cancellation, and dead-letter tests pass.
- Security checks have no unresolved critical/high findings.
- Backups and rollback have been tested.
- Client-facing changes have approval and monitoring.
- Independent QA signs off on evidence.
- Known limitations and disabled capabilities are listed.

## 14. First three tasks

1. **P0:** read-only audit and source SHA inventory for Prompt Lab, control plane, swarm runtime, protocol, gateway, evaluations, X1 Operating Systems, and Launch Engine.
2. **P0:** identify actual runnable control-plane entrypoint and deployed staging environment; compare task and receipt schemas.
3. **P0:** run one synthetic staging canary through queue → authorized worker → persisted output → independent receipt.

Do not scale sites, modify production infrastructure, or merge code before these gates pass.
