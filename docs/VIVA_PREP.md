# Placement Portal — Project Defense & Viva Voce Guide

> **Placement Portal** — a full-stack, role-based College Placement Management System.
> Live stack: React 19 + TypeScript + Tailwind CSS + Convex (reactive database & server
> functions) — the codebase also documents the equivalent Next.js App Router + Prisma
> deployment shape (see `docs/ARCHITECTURE.md`).
>
> Use this guide in three passes: memorize the **pitch**, rehearse the **Q&A**, and
> time-box the **demo** until it fits five minutes without a single dead click.

---

## Table of Contents

1. [Elevator Pitch (90 seconds)](#1-elevator-pitch-90-seconds)
2. [Problem Statement](#2-problem-statement)
3. [Technical Architecture Q&A](#3-technical-architecture-qa)
4. [Anticipated Follow-up Questions](#4-anticipated-follow-up-questions)
5. [Live Demonstration Script (5 minutes)](#5-live-demonstration-script-5-minutes)
6. [Demo Contingency Kit](#6-demo-contingency-kit)
7. [One-Line Soundbites](#7-one-line-soundbites)

---

## 1. Elevator Pitch (90 seconds)

> Rehearse this out loud until it lands in 80–90 seconds naturally.

"Every placement season, a college's Training & Placement cell coordinates **hundreds of
students, dozens of companies, and thousands of application status changes** — and most
of it still runs on WhatsApp groups, email chains, and spreadsheets. Students miss
deadlines because announcements live in five places at once. The TPO manually verifies
every CGPA, manually forwards every resume to recruiters, and manually reconciles
everyone's status in a giant Excel sheet. Recruiters receive resumes as email
attachments with no way to rank them or schedule interviews without a week of
back-and-forth.

**Placement Portal replaces all of that with one unified, role-based platform.**

Three personas, one system. **Students** get a live dashboard — eligible drives
filtered automatically against their verified CGPA and backlogs, a one-click apply, a
visual pipeline tracker showing exactly which round they're in, and direct message
threads with recruiters. The **TPO** gets an analytics command center — placement
percentages and CTC distributions computed live, drive publishing with eligibility
rules enforced by the system rather than by hand, one-click NAAC/NBA-ready audit
reports, and an immutable audit trail of every administrative override. **Recruiters**
get an AI-ranked candidate matches view, bulk shortlisting, and an interview scheduler
that auto-generates Google Meet links and calendar invites.

The two things I want you to remember: **eligibility is computed, never hand-checked** —
the same rules engine runs in the UI for instant feedback and on the server as the final
authority — and **every privileged action is logged**, so the placement record a degree
depends on is verifiable end to end."

**Delivery tips:**
- Pause after "…five places at once" — let the pain register.
- Emphasize the two closing sentences; that's the thesis of the whole project.

---

## 2. Problem Statement

Frame it as three broken information flows the system repairs:

| # | Broken flow today | Cost | Portal's fix |
|---|---|---|---|
| 1 | **Eligibility by eyeball** — TPO manually checks CGPA/backlogs/branch against each drive | Errors let ineligible students into drives; eligible students wrongly excluded | `checkPlacementRules` — a single pure engine enforcing cutoffs, backlog caps, branch filters, and the tiered One Job Policy (T1→T2→T3 upgrades only; Super Dream offer = `PLACED_LOCKED`) |
| 2 | **Status by broadcast** — results travel through forwards; no single source of truth | Students learn of shortlists late or never; TPO drowns in "did I get in?" messages | Reactive applications table — every stage change propagates instantly to student pipeline, notifications, and TPO boards |
| 3 | **Records by spreadsheet** — placement data assembled at accreditation time from stale sheets | Days of reconciliation; no tamper evidence | Live aggregation for reports (placement %, CTC median/distribution, department rates) + append-only audit ledger with actor/IP/diff capture |

---

## 3. Technical Architecture Q&A

> Answers are ordered: **claim → mechanism → evidence** (what to show if asked to prove it).

### Q1. "Why Next.js App Router over a separate React + Express backend?"

**Claim:** We wanted one deployable, one type system, and server-authoritative mutations
without maintaining a second service.

**Mechanism:**
- **Colocation** — UI, server actions, and data queries live in one repo and one deploy;
  no CORS, no versioned REST contracts, no second CI pipeline.
- **Server Components** cut client JS: dashboards render server-side and ship no fetch
  waterfalls — the page arrives with data. Server Actions give typed RPC to mutations
  with no API layer to design.
- **One type system end-to-end** — Zod schemas are the single source of truth: the same
  `createDriveSchema` validates the form client-side (instant feedback) and re-validates
  inside the mutation server-side (safety). Types are *inferred* from the schemas, so a
  schema change breaks compile at every call site rather than failing at runtime.

**Honest trade-off to volunteer** (examiners reward this): a colocated monolith couples
frontend deploys to backend deploys, and the Next.js server is a poor fit for
long-running background jobs — we'd extract a worker service for heavy PDF pipelines or
bulk emails at scale.

**Evidence in the codebase:** the live implementation runs on Convex, which pushes this
even further — queries are *reactive* (the client subscribes; the server pushes updates
— no polling), and every mutation is ACID. Same architectural intent: server authority,
no hand-rolled API layer.

---

### Q2. "How is concurrency handled when hundreds of students apply simultaneously?"

**Claim:** Correctness comes from making the database the serialization point, not the
application server.

**Mechanism:**
- **Atomic transactions** — each application is a single insert guarded by a unique
  constraint on `(driveId, studentId)`. Two racing applies: one commits, the other hits
  the constraint and gets a clean "already applied" error. There is no check-then-insert
  race window because the constraint *is* the check.
- **No lost updates on counts** — applicant counts are recomputed by query (or patched
  within the same transaction), never incremented client-side.
- **Stateless app tier** — the web/server layer holds no in-memory session or queue
  state, so horizontal scaling is just more instances behind the load balancer.
- **Slot booking is the hard case** and we handle it the same way: assigning a candidate
  is a transaction that re-checks the conflict invariant (one candidate, one active
  slot) at write time — the UI check is UX, the transaction is the guarantee. This is
  covered by integration tests (`__tests__/drives.test.ts`).

**Evidence:** `@@unique([driveId, studentId])` in the Prisma schema / the duplicate
guard inside `applyToDrive`; test "blocks double-booking the same candidate".

---

### Q3. "How do you ensure students cannot tamper with their CGPA, or apply to drives they aren't eligible for?"

**Claim:** Three independent layers; the browser is never trusted.

**Mechanism:**
1. **Academic lock** — verified CGPA/backlogs are read-only in the student profile
   (locked fields with TPO-verified badges). Only the TPO can change them, and *that*
   action is recorded in the audit ledger with actor, IP, before/after diff, and a
   `CGPA_OVERRIDE` severity flag.
2. **Server-side rule enforcement** — eligibility is re-evaluated *inside the mutation*,
   from database values, not from anything the client posted. A modified client that
   hides the "Apply" button or forges a request still hits `checkPlacementRules` on the
   server and is rejected with a structured failure code. Client-side checks exist only
   for instant UI feedback.
3. **Tamper-evident documents** — vault uploads and offer letters are hashed (SHA-256);
   offer acceptance records a signature hash over the canonical terms. Anything altered
   after issuance fails verification.

**Kill-shot demo if pressed:** open DevTools, show there's no client flag that unlocks
the apply button — eligibility comes from the rules engine result, and the server
recomputes it regardless.

---

### Q4. "How does your database maintain referential integrity on withdrawal or drive deletion?"

**Claim:** Integrity is declared in the schema, not enforced by hopeful application code.

**Mechanism:**
- **Cascade semantics chosen per relation, not globally** — deleting a `User` cascades
  to their `StudentProfile` and, through it, their `Application` rows; deleting a
  `CompanyDrive` cascades to its applications. An orphaned application row is
  *structurally impossible*.
- **Withdrawal ≠ deletion** — a student opting out flips `placementStatus: opted_out`
  and is blocked from new applications by the rules engine; history is preserved for
  accreditation reporting rather than destroyed.
- **Drive closure ≠ deletion** — drives close to `completed`/`cancelled`, keeping every
  application row intact for audit; only the TPO archive path ever deletes, and it
  cascades cleanly.
- **Application side-effects are transactional** — marking an offer marks the student
  `placed` and closes the drive *in the same transaction*; an offered→rejected revert
  restores `not_placed` in the same write. A crash between the two writes cannot happen.

**Evidence:** the `onDelete: Cascade` graph in `prisma/schema.prisma` (ERD in
`docs/ARCHITECTURE.md`), and the side-effect block in `updateApplicationStatus`.

---

## 4. Anticipated Follow-up Questions

**Q: "Why is the same eligibility logic in two places?"**
It isn't. There is *one* pure function (`checkPlacementRules`) imported by both the UI
(to disable buttons with reasons) and the server (to reject mutations). Single
implementation, two enforcement points — that's the design, and it's why the unit tests
can cover both layers at once.

**Q: "How do you prevent a student from seeing another student's data?"**
Every query/mutation resolves the actor server-side (`requireStudent`/`requireTpo`) and
scopes reads to the actor's own records. Role routing middleware additionally bounces
wrong-role deep links (a student at `/tpo/*` redirects to their dashboard).

**Q: "What happens if two TPOs edit the same drive?"**
Last-write-wins on field patches within transactions — the risky case (concurrent
status flips with side-effects) goes through single mutations where the whole
read-modify-write is one atomic unit.

**Q: "How would you scale to 50,000 students?"**
The hot paths are already indexed (`rollNumber`, `department`, `cgpa`, `status`,
`deadline`); aggregation moves to materialized views; the stateless app tier scales
horizontally; notifications move from the request path to a queue.

**Q: "Why localStorage-backed demo stores in the live build?"**
Sandbox reproducibility for this defense — the service seams (event bus + typed
models) are exactly where the Convex/Prisma functions plug in; swapping the transport
doesn't touch a single component.

**Q: "What did you test?"**
60 Vitest tests across the eligibility engine, the tiered One Job Policy, the drive
creation validation pipeline, the application state machine, and the conflict-free slot
allocator — plus Playwright E2E stubs for the multi-role auth flow
(`__tests__/`, `e2e/`).

---

## 5. Live Demonstration Script (5 minutes)

> Total budget: **300 seconds**. Each scene has a hard time cap — practice with a timer.
> Pre-demo setup: run the demo hydration, sign in as the student, hard-refresh once, and
> close every other tab. Zoom to 100%.

### Scene 0 — Landing & Sign-in (0:00 – 0:30)

- [ ] Land on `/` — point out the role-based product framing, then click the primary CTA.
- [ ] On `/auth`, use the **1-click demo login: Student (Aditya Verma)** — mention that
      manual credentials + role routing also work.
- [ ] **Narrate:** "Session is cookie-backed, so role state survives reloads — watch."

### Scene 1 — Student Journey (0:30 – 2:00)

- [ ] **Dashboard** — CGPA, backlogs, applications, placement status (the aurora/obsidian
      UI is a bonus, don't linger). Point at the upcoming interview card with the
      **countdown** and **Join Google Meet** button.
- [ ] **Drives** — hover two apply buttons: one eligible ("Apply Now"), one showing
      *"Ineligible: Requires Min 8.0 CGPA"* tooltip. Click a policy-locked tag → the
      **One Job Policy modal** with the tier ladder (Held/Open/Blocked).
      **Narrate:** "This is the rules engine — computed, not hand-checked."
- [ ] **Apply** to an open drive → instant optimistic flip to "Applied".
- [ ] **Applications** — open the pipeline stepper: emerald cleared rounds, pulsing
      active round, expandable card with round dates and the Meet link.
- [ ] **Notifications** — one deadline alert with unread accent bar; mark read.

### Scene 2 — TPO Controls (2:00 – 3:30)

- [ ] Use the **floating Demo Switcher → TPO (Dr. K. Srinivas Rao)**.
      **Narrate:** "One click, role swap, redirected to their own home."
- [ ] **Dashboard** — placement %, CTC distribution, branch-wise chart (all live-computed).
- [ ] **Drives → Create** — set cutoff 8.0, one branch, three rounds → publish → toast.
- [ ] **Students** — toggle one verification badge → point out the **academic lock** and
      the audit toast.
- [ ] **Applicants (any drive)** — change a candidate's stage via the dropdown → toast;
      select two candidates → bulk shortlist.
- [ ] **Audit Trail** — show the just-created entries: actor, IP, **before → after diff**.
      Click **Export CSV**.
- [ ] **Reports** — preview the departmental table → **Export PDF** (print dialog is
      fine — "…institutional PDF, NAAC-ready").

### Scene 3 — Recruiter Screening (3:30 – 4:20)

- [ ] **Demo Switcher → Recruiter (Google Cloud)**.
- [ ] **AI Matches** — ranked candidates with compatibility scores; gold top-candidate
      badges; shortlist one → audit logged.
- [ ] **Scheduler** — show the 30-minute slot grid, assign a candidate → Meet link
      generated, notification dispatched to the student.

### Scene 4 — Close the Loop: Interview (4:20 – 5:00)

- [ ] **Demo Switcher → Student** → **Notifications**: the slot-assignment alert has
      arrived.
- [ ] **Interviews card → Join Google Meet** — open the link in a new tab (show it's a
      real Meet URL), close it.
- [ ] **Messages** — open the Google Cloud thread, send one message (show the read
      receipt), open the **offer negotiation card**, type your name as the digital
      signature → accepted offer with the SHA-256 verification block.
- [ ] **Close:** "One student, one TPO, one recruiter — one system, zero spreadsheets."

---

## 6. Demo Contingency Kit

| Failure | Recovery |
|---|---|
| Dev server cold/slow | Pre-warm before examiners enter; the Playwright config also documents the exact boot command. |
| A live export (PDF/Excel/CSV) misbehaves | The Reports **preview table** shows identical data — narrate from the preview, offer the file afterward. |
| Demo switcher missing | `/auth` 1-click logins hit the same code path. |
| Optimistic apply seems to hang | The snapshot-rollback pattern reverts on failure *and* shows a retry toast — that's a feature; say so. |
| Asked something you don't know | "I'd check the audit log / write a test for that first" — points you back at your strongest material. |

**Pre-flight (do 10 minutes before):**
- [ ] `bun run test` green (60/60) — say "the business logic is under test" if asked.
- [ ] Demo data hydrated, signed in as student, zoom 100%, do-not-disturb on.
- [ ] `docs/ARCHITECTURE.md` open in a second tab for the ERD question.

---

## 7. One-Line Soundbites

Drop these when the moment fits:

- "The browser is a rendering layer, never an authority."
- "Eligibility is computed by one rules engine — the UI shows it, the server enforces it."
- "Every privileged action writes an audit row: who, from where, what changed."
- "Cascade deletes are declared in the schema, not hoped for in application code."
- "60 tests cover the two things a degree depends on: who's eligible, and who got placed."
- "Convex makes the database reactive — the client subscribes, the server pushes."
