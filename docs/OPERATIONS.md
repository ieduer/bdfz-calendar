# 校历 operations

Last normalized: 2026-08-31 PDT
Owner: suen
Lifecycle: active
Data class: anonymous_aggregate
Documentation status: generated from local source, Git/GitHub audit, project catalog, and live Cloudflare inventory; unresolved facts remain fail-closed.

## Quick start

- Canonical local path: `/Users/ylsuen/CF/sites/tools/calendar` (`/Users/ylsuen/CF/calendar` remains a compatibility symlink)
- Git authority: `ieduer/bdfz-calendar`
- Current production source: `main` / `f6d299379e0dfd4578735a4d8034f04a7c079a5a`
- Runtime config: `calendar/wrangler.toml` (name `bdfz-calendar`)
- Current state: [PROJECT_STATE.md](../PROJECT_STATE.md)
- Workspace resource routing: [project resource index](../../reports/operations/project_resource_index.md)
- Documentation standard: [project operations standard](../../runbooks/project_operations_documentation_standard.md)
- Production mutation is forbidden until exact owner, target, bindings, backup, verification, and rollback have fresh readback.

## Existing project documentation relationship

This `docs/OPERATIONS.md` is the single project-local operations entrypoint.
Existing detailed manuals remain authoritative annexes for their exact scope;
historical handovers and ledgers are evidence, not current state.

- [docs/MAINTENANCE_MANUAL.md](MAINTENANCE_MANUAL.md)

## Project and runtime inventory

| Project ID | Runtime type | Resource | Domains |
| --- | --- | --- | --- |
| `cal-bdfz-net` | `pages` | `bdfz-calendar` | cal.bdfz.net |

Live Cloudflare matching is metadata-only and does not prove application health:

| Resource | Live type | Readback | Detail |
| --- | --- | --- | --- |
| `bdfz-calendar` | Pages | verified 2026-08-31 | production branch `main`; canonical deployment `2c6c2d44-fb10-48ab-896f-c3a752af3a63`; source `f6d2993` |

## Authority and dependencies

- Project names: 校历
- Catalog owner: suen
- Data classes: anonymous_aggregate
- Identity modes: anonymous
- User Center required: false
- Pulse measurement: zone_host
- Runtime bindings: 0 names cataloged; names are intentionally omitted from this general handbook. Inspect the exact project config and live binding types under task-scoped authority.
- Shared User Center, APIS, nav, image, Pulse, App, clone-family, and VPS effects must be checked through workspace topic runbooks; this file does not weaken those gates.

## Resource location and restore

- Source authority: `/Users/ylsuen/CF/calendar`; Git/GitHub authority above.
- External/local build inputs, archived paths, receipts, retention, and hydrate commands not stated below are `review_required` and block deletion.

Catalog backup evidence:
- Cloudflare immutable Pages deployments: current=2c6c2d44-fb10-48ab-896f-c3a752af3a63, previous accepted=82770eea-a79a-4d18-9b0e-ca5cb61b1044

Catalog restore evidence:
- restore code/assets by promoting production deployment `82770eea-a79a-4d18-9b0e-ca5cb61b1044`, then verify the custom domain and prior feed

Before deleting any local resource, satisfy the workspace path-preserving archive, remote readback, isolated restore, receipt, handbook, and project-state gates.

## Preflight and AI ownership

1. Read `/Users/ylsuen/CF/AGENTS.md`, this file, `PROJECT_STATE.md`, and linked annexes.
2. Inspect `git -C "/Users/ylsuen/CF/calendar" status --short` when Git-backed.
3. Inspect recent `reports/agent_action_log.jsonl` ownership.
4. Resolve the exact source, Worker/Pages/VPS/App target, domains, bindings, data, and rollback live.
5. Append a scoped `start` row before the first mutation.
6. Preserve unrelated dirty work; never reset, clean, broad-checkout, or stash another task's changes.

## Build, test, and local verification entrypoints

Detected package entrypoints (presence is not proof they currently pass):

- `npm --prefix "/Users/ylsuen/CF/calendar" run build`
- `npm --prefix "/Users/ylsuen/CF/calendar" run deploy`
- `npm --prefix "/Users/ylsuen/CF/calendar" run dev`
- `npm --prefix "/Users/ylsuen/CF/calendar" run prebuild`
- `npm --prefix "/Users/ylsuen/CF/calendar" run preview`

Run only commands supported by the current project toolchain and verify expected outputs in the project before using them as release evidence.

## Health and business-path verification

Catalog health probes:
- curl -sS -o /dev/null -w '%{http_code}\n' https://cal.bdfz.net/ # expected 2xx/3xx

Catalog contract checks:
- jq '.projects[] | select(.project_id=="cal-bdfz-net")' platform/project_verification_evidence.json

Also verify authentication boundaries, data read/write behavior, browser/device path, monitoring, clone-family and shared-hub regressions as applicable. HTTP 200 or a build alone is insufficient.

## Preview, deployment, and rollback

Catalog deploy commands (not authorization; fresh preflight remains mandatory):
- npm --prefix "/Users/ylsuen/CF/calendar" run deploy

Rollback/failback authorities:
- Cloudflare Pages deployment `82770eea-a79a-4d18-9b0e-ca5cb61b1044` is the immediate immutable rollback anchor. Use the authenticated Pages rollback/promotion workflow; never put credentials in this file.

For data-backed projects, immutable code rollback does not restore D1/KV/R2/DO/Queue state. Use backup/restore or backward-compatible forward-fix procedures verified for the exact resource.

## Monitoring, privacy, cost, and incidents

- Monitoring coverage: required
- Measurement: zone_host
- Never record secret values, cookies, sessions, private keys, raw student content, or sensitive payloads.
- Verify current logs, errors, cost/usage, limits, owner, stop condition, and incident runbook before representing runtime health.

## Verification standard

1. Source of truth: local/Git/GitHub authority above, refreshed before mutation.
2. Health probe: catalog probes above plus expected response semantics.
3. Contract/business path: catalog checks plus auth/data/UI/device behavior.
4. Deploy and forbidden actions: catalog command above; no deploy from dirty, duplicate, reconstruction, archive, or unverified source.
5. Dependency regression: matrix fan-out, shared hubs, clone family, App/VPS as applicable.
6. Backup/restore: catalog evidence above; missing exact evidence is blocking for writes/deletion.
7. Rollback/failback: catalog authority above, refreshed live before release.
8. Last verified: 2026-08-31 PDT against `https://cal.bdfz.net/` and `https://cal.bdfz.net/feeds/2026-2027-high-all.ics` in desktop 1728px and mobile 390px browser views.

## 2026-2027 first-semester release receipt

- Data source: authenticated Yuque lakesheet draft 71, sheet `26-27学年（高中部）`; private raw response was not persisted.
- Data scope: 34 dated important events, 91 cycle days, and 3 official undated notices; other divisions and the second semester remain absent rather than inferred.
- Data audit: 5 calendars, 511 events, 0 errors, 7 expected warnings.
- UI acceptance: fixed category palette with text labels; every white-on-category color pair is at least 5.37:1; no desktop or 390px horizontal overflow; mobile date sheet opens; browser console has no errors.
- Feed acceptance: new `2026-2027-high-all.ics` returns `200 text/calendar` and contains the 2026-09-01 opening and 2027-01-25 winter-vacation anchors.
- Capability fit: `no-new-capability`. The site remains a static Vite/React Pages direct upload with no new Cloudflare runtime, binding, data store, identity surface, shared-hub contract, or cost class.
- Fan-out: leaf-only; User Center, APIS, nav, Pulse, DNS, Companion, VPS, and other sites are `verified_no_change` by scope and source diff.
- Source/resource disposition: Git-tracked source and public source notes are `retain_hot`; no private Yuque raw extract was created; task-local build and browser-validation derivatives are `remove` at closeout.

## Synchronized documentation and handoff

Any change to source authority, architecture, dependencies, runtime resources,
deployment, data, backup/restore, verification, monitoring, incidents, rollback,
or ownership must update this manual in the same task. Accepted version,
objective, blockers, deployment state, rollback anchor, and next action must
update `PROJECT_STATE.md` in the same task.

Every AI closeout must record changed files, generated artifacts, tests, live
version/deployment, rollback, dirty-tree state, unresolved follow-ups, and the
manual/state updates in `reports/agent_action_log.jsonl`. Chat is not a durable handoff.
