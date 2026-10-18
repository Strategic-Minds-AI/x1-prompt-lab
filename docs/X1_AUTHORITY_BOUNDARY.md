# Prompt Lab — Official X1 Authority Boundary

**Status:** Proposed on branch; not active until reviewed and merged/published.

## Prompt Lab owns
- Prompt authoring, refinement, versioning, evaluation and simulation.
- Prompt libraries, prompt chains and prompt-related specialist coordination.
- Structured proposals and test evidence for work that may later be admitted by X1.

## Prompt Lab does not own
- The canonical X1 queue, task leases, task state, authorization, tenant access, approval ledger, budgets, dispatch, production release, or execution receipts.
- The company-wide infrastructure bootstrap roadmap.
- Direct production shell execution, deployment, DNS mutation, paid provisioning, destructive browser actions, or customer communications.

## Required handoff
A cross-system request must be represented as a structured proposal with tenant/context, actor, requested capability, acceptance criteria, source/version pins, budget/deadline, idempotency requirement, approval requirements and expected evidence. The native X1 control-plane contract must validate and admit it before any worker executes it. If the endpoint/contract is unavailable or unverified, status is BLOCKED; do not create an alternate scheduler or dispatch route.

## Current implementation truth
- Prompt Lab's current source is Base44-bound (@base44/sdk, Base44 functions/entities).
- The default-branch autonomous_agent previously described itself as the autonomous operator of the entire platform and had access to BootstrapTask, bridgeCommand, bridgeProxy, and sendWhatsApp. This branch changes the agent instructions and removes those tools from that agent's declared tool configuration.
- This is not a security boundary for the underlying Base44 functions. The legacy bridgeCommand function still accepts a command string into a LocalCommand entity, and bridgePoll returns it to a registered bridge. Privileged use must remain blocked until the server-side bridge is replaced with authenticated, typed, allowlisted X1 work packets and independently tested.
- The dedicated x1-ai-hub-control-plane repository's inspected default-branch tree exposed only a README at the inspected ref. Its intended authority is not proof of an operational endpoint.
- The native X1 Operating Systems code has a staging-only queue facade using x1_enqueue_work and x1_work_queue; preview binding/authenticated behavior remains a release gate. The swarm runtime calls x1_lease_next_work and x1_finish_work, and expects an authorization endpoint at X1_CONTROL_PLANE_URL/api/authorize. Compatibility with a deployed endpoint has not been proven. Worker mutation handling must remain disabled.

## Release gates
1. Implement and version one authorization/enqueue/lease/finish/approval/receipt contract.
2. Choose one implementation owner and one deployed authorization endpoint; no duplicate queues or schedulers.
3. Fix staging binding and pass authenticated API tests with staging-only credentials.
4. Add contract tests between native X1 API and swarm runtime.
5. Replace/disable privileged legacy bridge execution server-side; removing tools from an agent config alone is insufficient.
6. Independent validation of tenant isolation, authorization failure, idempotency, lease concurrency, cancellation, budgets, audit receipts and rollback.
7. Keep production mutation and customer communications disabled until explicitly authorized and validated.

Do not describe this proposal as a production deployment or a live runtime change.
