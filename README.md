# WestminsterSim

A mobile-first political life simulator. You are a newly-elected UK MP: survive the
whips, climb (or refuse) the ministerial ladder, fight elections, and maybe —
eventually — walk through the door of Number 10.

Entirely fictional people; real parties and real starting parliaments.

## Play

```bash
npm install
npm run dev        # http://localhost:5173 — designed for a ~380px phone viewport
```

Append `?debug` to the URL for the dev panel (advance time, force elections,
reshuffles, leadership vacancies, max stats).

## How it works

- **Chambers** — a career begins in the House of Commons, the Scottish Parliament,
  the Senedd or the Northern Ireland Assembly, and can move between Westminster
  and its own nation's parliament in either direction by resigning one seat to
  stand for the other. Holyrood and the pre-2026 Senedd are elected by the
  Additional Member System (constituencies plus regional lists allocated by
  d'Hondt, so nobody wins a majority twice); the Senedd becomes a 96-member
  closed-list chamber at the 2026 election. Stormont's eighteen five-member
  constituencies (six until 2017) are counted by d'Hondt as the first cut of STV,
  and its Executive forms by right: the First Minister from the largest party, the
  deputy First Minister from the largest party of the other community, the
  ministries shared out by d'Hondt, and an Executive that can fall when a head
  party walks out and stand empty, under the Secretary of State's clock, until a
  deal or an extraordinary election. Devolved terms are fixed, the ladder runs
  Minister to Cabinet Secretary to First Minister (one rung of Minister at
  Stormont, with a spokesperson rung for the parties outside), and the UK parties
  are the same parties in every chamber under their Scottish and Welsh names;
  Northern Ireland has its own (DUP, Sinn Féin, UUP, SDLP, Alliance, TUV, the
  Greens, People Before Profit). See `docs/devolved-chambers.md`.
- **Out of the chamber** — an MP in a region with a directly elected metro mayor
  (London and the English combined authorities) can be asked to run for it, leave
  the Commons for the term, face re-election, and come back at a general election
  with the seniority a full term earns; a long-serving mayor with a national name
  may, very rarely, be asked to lead an opposition party from City Hall, with a
  deputy at the despatch box and one general election to win a seat or lose the
  job.
- **Start dates** — first day of the 2010, 2015, 2017, 2019 or 2024 parliaments at
  Westminster (DUP, UUP, SDLP and Alliance careers sit for the eighteen Northern
  Ireland seats); the 2011, 2016 or 2021 elections at Holyrood or in the Senedd;
  the 2011, 2016, 2017 or 2022 Assemblies at Stormont, the last two opening with
  no Executive, as they did. Seat compositions are exact and the figures are
  verified against the official returns; history diverges procedurally from day
  one.
- **The loop** — each ordinary decision advances the clock one or two months. A
  scheduler interleaves forced sequences (reshuffles, dismissals, leadership
  ballots, election campaigns), calendar events (Budget, conference, locals,
  recess) and a weighted card draw with cooldowns and token templating. Stats
  follow diminishing returns — easy to build, hard to max — and genuinely gate
  promotion.
- **Career** — eligibility for office is scored from competence, leader/whip
  relationships, standing, profile, rebellions and your background. The early
  ladder (PPS, minister) comes quickly to strong performers; the top stays hard.
  Mirrored shadow roles in opposition; sideways moves, emergency reshuffles, and
  — as leader — interactive reshuffles of your own cabinet (and a Cabinet-tab
  "Sack" button). You can resign any office at will (as leader, an NPC succeeds
  you) and your career remembers its peak, so a principled resignation doesn't
  send you back to the bottom. Leadership contests are six-stage affairs against
  3–6 named rivals (declaration → two ballots → hustings → endorsement → final
  head-to-head), and losing carries a real cost. You can also cross the floor to
  another party, at a price the voters will name. As PM or LO, general elections
  become a seven-stage make-or-break campaign that genuinely moves the polls; a
  living opposition reshuffles itself and changes its own leaders between
  elections, and NPC PMs call late-term or snap elections and occasionally resign.
- **Elections** — 650 synthetic constituencies generated to match the real
  starting parliament, swung by a regional-sensitivity model from national
  polling (random walk + mean reversion + cost-of-governing drag + event
  shocks). Your seat gets a personal vote from constituency approval.
- **Saves** — one career auto-saves to localStorage after every decision.

## Commands

| | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | engine test suite (data integrity, election calibration, balance sims) |
| `npm run build` | production build |

## Stack

React 18 + TypeScript + Vite, Zustand (persisted), plain CSS, hand-rolled
seeded PRNG (a save fully determines the future). No backend.
