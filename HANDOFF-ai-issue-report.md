# Handoff: "Report an AI issue" feature (Ayu 1b + 1d)

Paste everything below this line into a fresh Claude Code session on the new machine to resume exactly
where this one left off.

---

I'm continuing a feature I started on another machine. Read this whole handoff before doing anything.

## What this is

Doctors using the AI-assisted ("Ayu") suggestions in the Intelehealth doctor portal have no way to flag
a suggestion that's wrong, unsafe, or irrelevant. A mockup ("AI Issue Reporting Mockups", 4 candidate
patterns 1a-1d) was shared; I'm implementing the two that were picked:

- **1b** — a warning-icon on the whole "AI-Suggested Diagnosis" panel header opens a **modal** covering
  that panel's suggestion set as a whole (`suggestion_ref: null` in the payload).
- **1d** — a per-item flag icon on each "AI-Suggested Medication" chip opens a small **popover**
  (Angular Material `mat-menu`, not a full dialog) anchored to that one suggestion.

Full approved plan (read this in full before writing any code — it has exact file lists, code shapes,
and the reasoning behind every decision): **`/Users/indian/.claude/plans/swirling-growing-otter.md`**.
That file only exists on the original machine — if it's not present here, ask the user to copy it over,
or reconstruct from the "Key facts and decisions" section below (it's a full duplicate of the essentials).

## Repos and branches

Two repos, both need `origin` (Intelehealth) + `fork` (zeescriptdev) remotes:

| Repo | Path (adjust if different on this machine) | Branch |
|---|---|---|
| `intelehealth-doctor-webapp` | `~/work/ih/intelehealth-doctor-webapp` | `feature/ai-issue-report` |
| `backend-services` (the `portal` service inside it) | `~/work/ih/backend-services` | `feature/ai-issue-report` |

Setup on this machine:

```bash
# backend — PR1 is done and pushed, pull it
cd backend-services
git remote add fork https://github.com/zeescriptdev/intelehealth-backend-service.git   # if not already added
git fetch fork
git checkout -b feature/ai-issue-report fork/feature/ai-issue-report

# frontend — branch not pushed yet (zero commits on it so far), recreate from current upstream
cd intelehealth-doctor-webapp
git remote add fork https://github.com/zeescriptdev/intelehealth-doctor-webapp.git     # if not already added
git fetch origin
git checkout -b feature/ai-issue-report origin/development_master
```

**Git identity**: commits must be authored as `zeescriptdev` for attribution to land correctly (push
credentials alone don't determine this — GitHub credits whichever account owns the commit's *author
email*). Set this per-repo:

```bash
git config user.name "zeescriptdev"
git config user.email "26131219+zeescriptdev@users.noreply.github.com"
```

`gh auth switch --user zeescriptdev` may also be needed before any `git push` to a `zeescriptdev/*` fork
— pushes have failed with "permission denied" on this project whenever the active `gh` account was
`zeeshan-IH` instead, even though the git credential helper otherwise looked fine.

**Standing rules for this project** (from user memory, apply throughout):
- Never commit without the user's explicit review of the diff first.
- Commit messages are one line, no body, no `Co-Authored-By` trailer, ever.
- **Test before committing** — for this feature specifically, that means actually running the affected
  service/app and exercising the change, not just a syntax check. See "How PR1 was verified" below for
  the bar to match.

## Status: PR1 done and verified, PR2-5 not started

The plan sequences this as 5 PRs. **Only PR1 is complete.**

| # | Scope | Repo | Status |
|---|---|---|---|
| 1 | `ai_issue_reports` schema + create/list API + admin-role gate | backend-services/portal | **Done, committed (`511f9bb`), pushed to fork, verified live** |
| 2 | 1b: diagnosis-panel modal + shared form component | intelehealth-doctor-webapp | Not started |
| 3 | 1d: medication-chip popover | intelehealth-doctor-webapp | Not started |
| 4 | Admin "AI Issue Reports" tab | intelehealth-doctor-webapp | Not started |
| 5 | Slack notification on new report | backend-services/portal | Not started |

**Next step: PR2.** Read the plan file's "PR2" section in full before starting — it has exact file
paths, the shared `AiIssueReportFormComponent` shape, the exact `doctor-note.component.html` header
markup change (with a subtlety: `.vs2-ai-dx-title` needs its icon+text wrapped in one inner span before
`justify-content: space-between` will correctly push a new button to the right instead of separating the
existing icon from its own text), and which existing files (`raise-ticket.component.ts`, `core.service.ts`
`openRaiseTicketModal()`) to clone the shape of.

## Key facts and decisions already made — do not re-litigate

- `doctor_uuid` is **client-supplied** in the payload, not derived server-side from the auth token
  (deliberate tradeoff, decided with the user).
- Every report also stores `patient_uuid` and `visit_uuid`.
- **No** dual-write into the existing generic `insight_events` analytics table — this is a separate,
  actionable data path.
- Feature targets the **v2** doctor-note component only (`doctor-note.component.html/.ts`), not the
  legacy v1 `diagnosis.component`.
- **The JWT this app issues carries only `{ sessionId, userId, name }`** — no role/privilege claims
  (confirmed by reading `auth-gateway/controller/auth.controller.js:46`, the actual signing code). The
  Angular app's `user.roles`/`user.privileges` come from a separate OpenMRS session-fetch response, never
  embedded in the token. This is why the new admin-gate middleware (`middleware/is-admin.js`) doesn't
  decode the token for role info — it calls the **already-existing**
  `SupportService.checkIfSystemAdmin(uuid)` (a raw-SQL role lookup against OpenMRS's own DB, the same
  function `support.controller.js` already relies on), passing `req.user.data.userId`. Reuse this
  pattern for anything else needing an admin check in this backend.
- 1d attaches to the **AI-suggestion chip** (`aiMedicationSuggestions`, has `name`/`likelihood`/`reasons`)
  — not the later `selectedMedicines` "added" card, which has no rationale data at all.
- Popover mechanism for 1d is Angular Material `mat-menu` (confirmed v12.2.13, fully supports arbitrary
  form content) — there's real precedent already in this codebase
  (`completed-visits.component.html:21-97`, a full reactive form with datepickers and buttons inside a
  `mat-menu`, no `mat-menu-item` directives, manual `(click)="$event.stopPropagation()"` on every
  interactive wrapper div to stop premature auto-close). Not a novel pattern — copy that structure.
- Both new click handlers (1b's warning icon, 1d's flag icon) **must** call `event.stopPropagation()`
  first, exactly like the existing `toggleWhy`/`toggleMedicationWhy` methods do — otherwise the click
  bubbles to the chip's own `(click)="toggleAiSuggestion(s)"`/`toggleAiMedication(s)` and incorrectly
  (de)selects that suggestion. Real regression risk, called out explicitly in the plan.
- `SharedModule` (`src/app/shared.module.ts`) currently imports only `CommonModule`/`TranslateModule` —
  verified directly, **not** already carrying `ReactiveFormsModule`/`MatButtonModule`/`MatIconModule`.
  PR2 needs to add all three before the shared `AiIssueReportFormComponent` will compile.
- No admin tab generic/reusable table component exists in this codebase — each admin tab (see
  `WebrtcLogComponent`) owns its own `MatTableDataSource` + hardcoded columns + `MatPaginator`/`MatSort`.
  Follow that blueprint for PR4, don't invent a shared table abstraction.
- Backend has **zero test infrastructure** (no test script, no Jest/Mocha anywhere) and the frontend's
  existing specs are 100% unmodified `ng generate` boilerplate (`TestBed` + "should create", no real
  assertions anywhere in the repo). Match that bar — generate boilerplate specs via Angular CLI, don't
  hand-write deep test suites that would be the only real coverage in the whole codebase. Real
  verification is the manual pass described below, done for real, every time.

## How PR1 was verified — match this bar for every subsequent PR

Nothing in PR1 was accepted as "should work" — every claim was proven against a live server and a real
local MySQL database (`mindmap_server` on `127.0.0.1:3306`, root/no password; a separate empty `openmrs`
DB also exists locally but has **no schema loaded** — no `users` table — so OpenMRS-role-dependent checks
can only be verified for their fail-closed behavior locally, not their true/false branches; that needs a
real OpenMRS-connected environment).

Concretely, for PR1: ran the migration for real (`npx sequelize-cli db:migrate`), confirmed the table
and all 3 indexes via `DESCRIBE`/`SHOW INDEX`, started the actual server (`node bin/www` — **not**
`node app.js` directly, which skips the `dotenv.config()` call that lives in `bin/www` and crashes on a
`FIREBASE_SERVICE_ACCOUNT_KEY` env var that's genuinely set in `.env` but never gets loaded — this bit me
once, don't repeat it), minted a real signed JWT locally (the RS256 key pair used to sign/verify tokens
lives at `backend-services/portal/.pem/private_key.pem` + `public_key.pem` — mint a token with
`jsonwebtoken` matching the exact shape `auth-gateway/handlers/checkAuth.js`'s `getToken()` uses:
`{ exp, data: { sessionId, userId, name } }`, signed RS256), then `curl`'d the real endpoints: `401` with
no token, `201` for both 1b-shaped and 1d-shaped payloads with correct `suggestion_ref` behavior in each,
`400` on missing fields, `500`/fail-closed on the admin-gated `GET` (since no OpenMRS schema exists
locally to resolve true/false), and confirmed the oversized-`raw_suggestion` truncation path actually
truncates rather than rejects. Test rows were deleted from the DB afterward; the server process was
stopped.

**For PR2/3 (frontend), the equivalent bar is**: `ng serve`, open the actual visit-summary-v2 doctor-note
view in a browser, click the new icons for real, confirm the modal/popover renders and is styled
correctly (not just "compiles"), confirm the network tab shows a real POST to
`/api/ai-issue-reports` with the right `ai_surface`/`suggestion_ref`/`raw_suggestion` shape, confirm the
toast appears, confirm the chip's own selection state does NOT change when the new icon is clicked
(the `stopPropagation` regression check). Don't report a UI change complete without having actually
looked at it running.

## Local environment notes specific to this bug-free-continuation

- Backend `node_modules` had to be installed fresh (`npm install` in `backend-services/portal`) — wasn't
  present initially on the original machine either, may or may not already be set up here.
- `backend-services/portal/.env` already has real credentials in it (including a live Firebase service
  account private key) — it's gitignored, confirmed. Never echo its full contents into any output that
  might get logged or shared; read specific keys with `grep '^KEY_NAME=' .env` rather than `cat .env`.
- If continuing to test the backend locally: start it with `PORT=<something-free> node bin/www` from
  inside `backend-services/portal`, not the default port if something else on this machine already uses
  it, and remember to load `.env` via `bin/www`, not `app.js` directly.

## First thing to do in the new session

1. Read `/Users/indian/.claude/plans/swirling-growing-otter.md` in full (or this handoff's "Key facts and
   decisions" section if that file isn't present here).
2. Set up both repos per the "Repos and branches" section above.
3. Confirm PR1 still applies cleanly and (optionally) re-verify it locally if this machine has its own
   MySQL instance, since "verified on machine A" isn't the same as "verified here."
4. Start PR2: the shared `AiIssueReportFormComponent`, then the `ReportAiIssueComponent` modal, then the
   `doctor-note.component.html`/`.ts` wiring for the diagnosis panel's warning icon.
5. Test it running in a real browser before proposing any commit, per the standing rule.
