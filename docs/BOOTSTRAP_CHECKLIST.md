# Strategic Minds AI — Bootstrap Checklist
**Version:** 1.0.0-draft

Status key: `NOT STARTED`, `IN PROGRESS`, `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`. A checkbox is not evidence of execution.

## Phase 0 — Baseline and protect
- [ ] B0-001 Inventory canonical repos, default branches, and current commit SHAs.
- [ ] B0-002 Inventory open PRs, CI runs, release locks, and unreviewed changes.
- [ ] B0-003 Inventory connected deployments and map exact repository/branch/SHA/build root.
- [ ] B0-004 Map each app to the correct Supabase project and environment; verify RLS and tenant boundaries.
- [ ] B0-005 Inventory existing queue, scheduler, worker, control plane, local bridge, Ollama, and receipts.
- [ ] B0-006 Capture a recoverable baseline and document rollback before any mutation.

## Phase 1 — Authority and contracts
- [ ] B1-001 Choose the authoritative control-plane implementation based on runnable code and deployment evidence.
- [ ] B1-002 Verify the control plane has an entrypoint, scripts, tests, health check, and deployment target.
- [ ] B1-003 Version WorkPacket, authorization, lease, approval, capability, result, and receipt schemas.
- [ ] B1-004 Confirm runtime and gateway enforce those schemas and tenant scope.
- [ ] B1-005 Identify duplicate implementations and document keep/migrate/retire decisions.

## Phase 2 — Prompt Lab
- [ ] B2-001 Register prompt IDs, versions, owners, schemas, tools, model versions, and rollback versions.
- [ ] B2-002 Add evaluation fixtures for normal, edge, malformed, adversarial, and failure inputs.
- [ ] B2-003 Separate deterministic steps from LLM-generated content.
- [ ] B2-004 Add structured-output validation, cost limits, deadlines, and bounded retries.
- [ ] B2-005 Verify Ollama/local bridge and fallback behavior without exposing secrets.

## Phase 3 — Queue canary
- [ ] B3-001 Submit a synthetic staging task from Prompt Lab.
- [ ] B3-002 Verify control-plane authorization and task lease.
- [ ] B3-003 Verify authorized worker execution.
- [ ] B3-004 Verify persisted output and independent receipt.
- [ ] B3-005 Test duplicate submission, lease expiry, worker restart, timeout, and dead-letter handling.
- [ ] B3-006 Test wrong-tenant and unauthorized-tool attempts fail closed.
- [ ] B3-007 Confirm no production mutation occurred.

## Phase 4 — Company website
- [ ] B4-001 Verify production source SHA, build root, domains, and deployment settings.
- [ ] B4-002 Run build, lint, typecheck, unit, integration, and browser smoke tests.
- [ ] B4-003 Verify analytics/Search Console integrations, sitemap, robots, canonicals, metadata, and structured data.
- [ ] B4-004 Check mobile/accessibility/performance and broken links.
- [ ] B4-005 Verify backups, monitoring, alerting, and rollback.

## Phase 5 — Digital Dominance canary
- [ ] B5-001 Select one authorized client/project and one validated template.
- [ ] B5-002 Generate original, fact-checked content that serves a distinct user need.
- [ ] B5-003 Validate rendering, forms, security, analytics, schema, sitemap, and indexability.
- [ ] B5-004 Obtain client approval before production publishing.
- [ ] B5-005 Verify published result and rollback.
- [ ] B5-006 Confirm no doorway pages, fabricated locations, or artificial backlink scheme.

## Phase 6 — Client package
- [ ] B6-001 Strategy/discovery report and approval record.
- [ ] B6-002 Brand/logo concepts and mockups.
- [ ] B6-003 Website mockups, preview, and revision workflow.
- [ ] B6-004 Thirty-day content calendar and approved media assets.
- [ ] B6-005 Business card/flyer artifacts.
- [ ] B6-006 CRM, intake, quotes/invoices, calendar, and communications only with verified integration access.
- [ ] B6-007 Delivery email/report includes artifact links, version, approval, and outstanding items.

## Phase 7 — Production release
- [ ] B7-001 All required CI checks pass on exact release commit.
- [ ] B7-002 No unresolved critical/high security findings.
- [ ] B7-003 Tenant isolation and correct data environment verified.
- [ ] B7-004 Queue retry/idempotency/lease/cancel/dead-letter tests pass.
- [ ] B7-005 Backups and rollback tested.
- [ ] B7-006 Independent validator signs off with evidence.
- [ ] B7-007 Human release approval recorded where required.
- [ ] B7-008 Production smoke test passes and monitoring is active.

## Operating metrics
Track task success rate, retries, dead-letter count, queue age, mean time to recovery, cost per verified job, escaped defects, rollback rate, site quality failures, qualified leads, client conversion, delivery time, gross margin, and retention.

## Stop conditions
Pause the affected workflow if a tenant-boundary test fails, credentials may be exposed, production/staging mapping is ambiguous, costs exceed caps, quality thresholds fail, repeated retries do not improve outcomes, or an external service/permission is not verified.
