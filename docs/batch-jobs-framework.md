# Batch Jobs Framework – Planning Notes

## Problem
The platform already performs several mass operations:

- Recomputing student credit ledgers (UE → EC aggregation).
- Rolling an academic year forward (creating new classes, assigning courses, promoting/re-enrolling students).
- Rebuilding caches or re-locking grades after bulk imports.

Today each workflow would require its own cron endpoint or bespoke script, which quickly becomes:

1. **Hard to use** – admins have to remember which button/cron to run and in which order, with no unified view of progress.
2. **Error-prone** – no standard rollback/preview. If a job crashes midway, we’re left with partially mutated data and no systematic compensation.
3. **Difficult to automate** – future workers/webhooks would need to know dozens of routes and parameters instead of a single entry point.

## Proposed Solution
Introduce a **Batch Jobs Framework** consisting of:

1. A shared data model for jobs + steps (`batch_jobs`, `batch_job_steps`, `batch_job_logs`).
2. A TRPC/HTTP API to create, preview, run, and rollback jobs.
3. Standard frontend components (admin UI) to preview effects, launch jobs, and inspect history.
4. Workers/cron triggers that enqueue jobs through the same API.

The framework covers both **dry-run previews** and **compensating transactions** (rollback) by storing step metadata and providing a uniform execution pipeline.

### Data Model (high-level)
```
batch_jobs (
  id UUID PK,
  type text,                -- e.g. "studentCreditLedger.recompute"
  status text,              -- pending / running / completed / failed / rolled_back
  params jsonb,             -- user-supplied payload (academicYearId, etc.)
  initiated_by_profile UUID REFERENCES domain_users,
  preview jsonb,            -- optional snapshot from the preview stage
  created_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  rollback_job_id UUID NULL -- if we create a rollback job referencing the original
)

batch_job_steps (
  id UUID PK,
  job_id UUID REFERENCES batch_jobs(id),
  order_index integer,
  name text,                -- e.g. "CreateNextYearClasses"
  status text,              -- pending / succeeded / failed / compensated
  context jsonb,            -- data needed for compensation (snapshots, IDs, etc.)
  started_at timestamptz,
  finished_at timestamptz,
  error text
)

batch_job_logs (
  id UUID PK,
  job_id UUID REFERENCES batch_jobs(id),
  level text,               -- info / warn / error
  message text,
  payload jsonb,
  created_at timestamptz
)
```

### Job Lifecycle
1. **Preview** (`POST /jobs/preview`) – Validates parameters and returns a lightweight summary of affected entities (“456 students will be recalculated”, “12 classes to create”). Result is cached into `batch_jobs.preview`.
2. **Run** (`POST /jobs/run`) – Creates a job row (`pending`), enqueues it (worker/cron or synchronous runner), and transitions to `running`.
   - Each job type defines an ordered array of steps:
     ```ts
     const steps = [
       createNextYearClassesStep(),
       assignCoursesStep(),
       promoteStudentsStep(),
       ...
     ];
     ```
   - Each step implements `apply(context) → { dataForCompensation }` and `compensate(context, storedData)`.
   - We store `dataForCompensation` in `batch_job_steps.context`.
   - Steps run sequentially; if one fails, we mark the job as `failed` and automatically start rollback (see below) unless the operator chooses to inspect first.
3. **Rollback** (`POST /jobs/:id/rollback`) – Reads the finished/failed job, and for each succeeded step runs `compensate` in reverse order. Creates a new job entry (type `rollback`, `rollback_job_id` referencing the original) for traceability.
4. **Status/Logs** – `GET /jobs`, `GET /jobs/:id` to fetch progress, steps, preview, logs. The admin UI uses these to show history, errors, and allow manual retries.

### Preview Requirements
Every job type must expose a `preview(params)` function used by both UI and workers. The function:
- Runs fast (no long transactions).
- Identifies target counts/entities.
- Returns a structured summary used in the UI (e.g. arrays, counts, possible warnings).

The preview result is stored in `batch_jobs.preview` when the user confirms, so the actual job runs against the same dataset the administrator saw (reducing “surprise” mutations). If parameters change, a new preview must be generated.

### Compensation Strategy
- Steps are designed to be **idempotent** and reversible. They store the minimum data required for compensation in `batch_job_steps.context` (e.g. created entity IDs, previous field values).
- Compensation runs via the same service layer (e.g. calling `classService.deleteClass`), ensuring hooks/triggers run consistently.
- Some jobs may opt for “snapshot & restore” (e.g. a table copy) when dealing with extremely large diffs. In that case `context` stores the snapshot location.
- Rollback is accessible both automatically (on step failure) and manually (admin clicks “Rollback job”).

### Worker/Cron Integration
- External workers or crons never call job-specific endpoints. They only call `POST /jobs/run` with `{ type, params, trigger: "cron" }`.
- For monitoring, we expose `GET /jobs?type=...&status=...`.
- Future background workers can poll a queue (e.g. Bun queue / Bull) and process jobs sequentially, but they all follow the same interface.

### UI Expectations
- **Admin Jobs Dashboard**: shows list of jobs, status, trigger (manual/cron), preview link, view logs, retry, rollback.
- **Preview Modal**: generated by `jobs.preview` endpoint, showing counts, warnings, and requiring confirmation before run.
- **Job Detail Page**: timeline of steps, statuses, ability to download logs, trigger rollback, see metrics.

### Implementation Roadmap
1. Schema + repositories for jobs/steps/logs.
2. Core job runner module (step orchestration, preview caching, compensation).
3. Initial job types (e.g. `studentCreditLedger.recompute`, `academicYear.advance`).
4. Admin UI (jobs list/detail, preview modal, run/rollback buttons).
5. Worker integration (simple queue/cron script hitting the run endpoint).

Once in place, every new batch flow (even outside grades) plugs into this framework instead of crafting bespoke crons. It standardizes previews, logging, retries, and rollbacks for the whole platform.
