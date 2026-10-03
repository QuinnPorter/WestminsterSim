# Devolved chambers: porting HillSim's provincial arenas to Holyrood and the Senedd

How HillSim (`QuinnPorter/HillSim`) models a career that moves between the Commons and a
provincial legislature, what of that ports to WestminsterSim unchanged, and where Scottish and
Welsh devolution refuses to be a Canadian province with the nouns swapped.

Written against HillSim at `d8603a9` and WestminsterSim at `5184ce1`. The two repositories share
history up to WestminsterSim's `bd57d44`; WestminsterSim's only engine change since is a 12-line
edit to `career.ts` (the opposition leader answering for a defeat). That matters: HillSim's arena
layer was built on top of *this* engine, so its hooks land on code that still exists here, line
for line in most files.

---

## 1. What HillSim actually built

### 1.1 One live arena, the rest frozen

`GameState` already describes a single House: `seats`, `seatMap`, `government`, `polling`,
`pollHistory`, `parliamentStart`, `nextElectionBy`, `characters`, `pmHistory`, `loHistory`,
`pendingContests`, `calendarDone`. HillSim does **not** nest those under `state.arenas.*`. They
stay at the top level and now mean "whichever chamber the player sits in", so the ~9,000 lines of
`career.ts` and `scheduler.ts` that read them never changed. Alongside them:

```ts
state.arena: ArenaId                              // 'federal' | 'on' | 'qc' | ...
state.dormant: Partial<Record<ArenaId, ArenaSnapshot>>
state.anchorShares: Partial<Record<PartyId, number>>   // this chamber's swing anchor
state.polledParties: PartyId[]                         // this chamber's ballot
```

`freezeArena` lifts the chamber-shaped fields into an `ArenaSnapshot` (plus `frozenDay` and the
player's seat id there); `thawArena` writes them back; a chamber switch is freeze-then-thaw.
`src/engine/arena.ts` (1,072 lines) is the only file that knows the field list.

### 1.2 Everything that differs between chambers is data

`src/data/chambers.ts` holds one `ChamberProfile` per arena: the nouns (`house`, `houseThe`,
`seat` for the building, `member`/`members`, `head`, `headOffice`, `place`, `placeAdjective`),
the `regions` the chamber's seats sit in, `termDays`, the shared `leaderOffice`/`speakerOffice`
ids, and the party roster. The explicit design note: "the alternative, `if (arena === 'federal')`
branches scattered through career.ts, is how this feature would rot."

`src/data/provinces.ts` holds one `LegislatureSnapshot` per real provincial election: polling
day, seats by party, vote shares, the parties actually on *that* ballot, the governing and
opposition parties, and the arrangement. `legislatureAt(arena, day)` returns the most recent
result on or before a day, so a player arriving mid-term walks into the right House.

### 1.3 Parties and offices

Provincial parties are **separate `PartyId`s** (`on_pc`, `qc_caq`, `ab_ucp`) carrying `arena`,
because Canadian provincial parties are genuinely separate organisations. A `COUNTERPART` table
maps a federal party to its natural home in each province, and `counterpartParty` inverts it.
Picking a non-counterpart is a "family switch" the jump charges for.

Offices live in the **same flat `OFFICES` registry**. Only departmental ministries are
namespaced (`on_min_health`, tier 4). The non-departmental rungs (`leader`, `speaker`, `pps`,
`whip`, `chiefWhip`, `leader_house`, `treasury_board`) are **shared ids** because `'leader'` is a
string literal at ~20 sites in `career.ts`; only their *titles* differ, applied at render time
through `officeTitleIn(officeId, inGov, arena, partyId)`. `computeNextOffice` is untouched: it
still reasons in federal ids, and `translateOffice(officeId, arena, pick)` maps its answer onto
the arena's equivalent rung by tier and nearest department (~40 lines instead of touching 500).
`GREAT_OFFICES` and `rank` got per-chamber equivalents so a provincial cabinet has a pecking
order.

### 1.4 The jump, and being asked

`jumpToArena` is a one-way, costly move: resign the seat and any office, freeze the chamber
behind you, thaw (and catch up) or build the destination, choose a party, get handed a seat.
Stats travel whole except `partyStanding` (55 to 62%, floored by carried tier, floor capped at
current + 15 so a collapse cannot be laundered). `mentor` and `journalist` follow; leader, whip,
ally and rival are left behind and a new personal cast is seated. `_peakTier` survives, and an
**incoming seniority** bonus to `eligibilityScore` (tier 5 = +17, decaying after three years)
stops a former first minister arriving as a nobody. A career locks to one province the first time
it sits there (`_homeProvince`); `jumpTargets` is always `['federal', home]` minus the current.

Two rare forced events are the interesting half: **"Ottawa is asking"** (a provincial member of
ministerial rank is recruited to stand federally; the seat offered reflects the party's real
strength in that province) and **"a province wants you to lead"** (a federal cabinet-rank figure
is drafted to lead their province's counterpart party: a three-card approach, campaign and
ballot; winning makes them leader, and whether that is Premier or Leader of the Opposition is
decided by where the party already sits). Both are exempt from the chamber voice because they are
*about* the other chamber.

### 1.5 Dormant chambers catch up lazily

A frozen arena records `frozenDay`. On thaw, `catchUpArena` runs it forward: polling drift, and a
general election on every `nextElectionBy` in the gap, run by the **same `runElection` the player
fights**, against a "ghost player" (`hasSeat: false`, approval exactly 50, `seatId: ''`) so no
seat is perturbed. `installNpcGovernment` then retires losing leaders probabilistically (so a
dormant chamber does not keep the same two faces for forty years), rebuilds both benches, and
emits headlines dated to when they happened. In-flight NPC leadership contests are settled first.

### 1.6 Prose: tokens, gating, voice

`Requirement.arena?: ArenaId[]`; **a card with no `arena` is federal-only**, because every one of
the 379 existing cards mentions the Commons. New tokens from the chamber profile: `{house}`,
`{housefull}`, `{hill}`, `{member}`/`{members}`, `{head}`, `{headoffice}`, `{province}`.

`src/engine/chamberVoice.ts` is a regex substitution pass applied **only to generated text**
(forced events and calendar set-pieces built in code: reshuffles, dismissals, ballots, recess).
Measured over 45,000 provincial cards, 12% carried Commons-only language before it and 0.12%
after. Rule order is load-bearing ("national" to "provincial" must run before any chamber name
is inserted, or the National Assembly becomes the Provincial Assembly), and a `tidy` pass repairs
doubled articles and lost sentence capitals.

### 1.7 Creation, saves, tests

A `Chamber` step precedes `Era` at creation; each chamber offers its own real elections. A
provincial start still builds the Commons behind it (`federalEraFor(day)` picks the parliament
sitting on that day, `catchUpArena` runs it forward), so `startEra` stays a federal era and every
`PARLIAMENTS[startEra]` lookup keeps working. `SAVE_VERSION` bumped once (v10); migration is
additive: `arena = 'federal'`, `dormant = {}`, stamp `arena` on old election results.
`arena.test.ts` is 2,014 lines and ~60 cases: data arithmetic, office translation round trips,
freeze/thaw, catch-up, seniority, the jump, gating, migration, and a regression list.

### 1.8 Size of the thing

| HillSim file | Lines | Nature |
|---|---:|---|
| `engine/arena.ts` | 1,072 | new |
| `engine/chamberVoice.ts` | 125 | new |
| `engine/seats.ts` | 24 | new (House size derived, not 650) |
| `data/chambers.ts` | 254 | new, data |
| `data/provinces.ts` | 449 | new, data |
| `data/provinceRidings.ts` | 201 | new, data |
| `content/cards/provincial.ts` | 937 | new, 42 shared cards |
| `content/cards/provinces/*.ts` | ~1,100 | new, 10 cards per full province |
| `__tests__/arena.test.ts` | 2,014 | new |
| `career.ts` | +535 net | ~60 hook sites, mostly `arena:` stamps and `translateOffice` |
| `scheduler.ts` | +168 net | recruit/draft events, per-chamber fallback pool |
| `election.ts` / `polling.ts` | +67 / +27 | arena-scoped anchor, ballot and result ids |
| `generation/constituency.ts` | +152 | `arena`, `namePool`, `ballot`, `voteShares` options |
| `newGame.ts` / `gameStore.ts` | +39 / +47 | provincial start, `jumpChamber`, v10 migration |
| screens and components | ~+250 | chamber step, jump panel, arena filters, hemicycle size |

Measured diff against WestminsterSim, `career.ts` differs by 1,349 lines in total, but most of
that is Canadianisation (riding, Ottawa, critic) rather than arena work. The arena hooks
themselves are identifiable by grep (`arena`, `chamberOf`, `translateOffice`,
`incomingSeniorityBonus`, `federalRecruit`, `provincialDraft`) and port cleanly.

---

## 2. The mapping, where it is one-to-one

| HillSim | WestminsterSim |
|---|---|
| `ArenaId = 'federal' \| ProvinceArenaId` | `ArenaId = 'uk' \| 'scotland' \| 'wales'` (reuse the two existing `RegionId`s as arena ids, exactly as HillSim reused `'on'`) |
| Province | Nation |
| Premier / the Premier's Office | First Minister / Bute House (Scotland), the First Minister's office at Cathays Park (Wales) |
| Queen's Park, Province House, Victoria | Holyrood, Cardiff Bay |
| the Legislature / the Legislative Assembly of Ontario | the Scottish Parliament / Senedd Cymru |
| MPP, MLA, MNA | MSP; MS (AM before May 2020, see 4.7) |
| Riding | Constituency (and, new, a list region or a six-member constituency; see 4.1) |
| Ottawa | Westminster |
| "Ottawa is asking" | "Westminster is asking" (Anas Sarwar MP to MSP; Stephen Flynn's abandoned dual run is the cautionary tale) |
| "A province wants you to lead" | "Scottish Labour wants you to lead" (Jim Murphy 2014; Douglas Ross 2020; Alex Salmond returning to Holyrood as FM in 2007) |
| Critic | Shadow Cabinet Secretary / spokesperson |
| Parliamentary Assistant | Parliamentary Liaison Officer (Scotland); no formal equivalent in Wales |
| Treasury Board / Government House Leader | Minister for Parliamentary Business (Scotland), Trefnydd (Wales) |
| Speaker | Presiding Officer / Llywydd |
| Deputy Premier | Deputy First Minister (both nations have one) |
| Federal–provincial conflict deck (not yet written in HillSim) | `devolvedScenery.ts` already exists here, flavour-only; becomes real once the FM is a simulated NPC (see 4.14) |
| Territories not built (consensus government) | Northern Ireland not built (STV, mandatory coalition, joint FM/dFM; see 4.16) |

The following engine pieces port **unchanged in mechanism**: freeze/thaw/switch; lazy catch-up
with the ghost player; leader retirement in dormant chambers; incoming seniority and the standing
transfer; `_homeProvince` (rename `_homeNation`) and the two-target `jumpTargets`; the recruit and
draft forced events; `translateOffice`; shared rung ids with per-chamber titles; `Requirement.arena`
with federal-only default; chamber tokens; the voice pass on generated text; the `Chamber` creation
step with per-chamber eras; the v10 additive migration; `seats.ts` replacing the hard-coded
`650 - sfSeats - 1` (six engine sites and three UI sites in this repo, exactly as HillSim found).

---

## 3. Where Scotland and Wales break the mimicry

HillSim's whole bet was "Canada and the UK are both first-past-the-post Westminster systems, so
the engine is system-shaped, not Britain-shaped." That bet held for ten provinces. It does **not**
hold for Holyrood or the Senedd, and the honest list of departures is below, biggest first.

### 3.1 The electoral system (the big one)

Every Canadian legislature is FPTP, so HillSim's provincial arena is the federal seat model with
a one-region matrix. Neither devolved chamber is FPTP:

| Chamber | System | Seats |
|---|---|---|
| Scottish Parliament | Additional Member System: 73 FPTP constituencies + 56 list seats, 7 per each of 8 regions, d'Hondt with constituency seats as the starting divisor | 129 |
| Senedd, 2007 to 2021 | AMS: 40 constituencies + 20 list seats, 4 per each of 5 regions | 60 |
| Senedd, 2026 on | Closed-list PR: 16 constituencies (pairs of the 32 Westminster seats) returning 6 members each by d'Hondt. No FPTP at all. | 96 |

Running Holyrood through the existing FPTP engine would hand the SNP a landslide on 45% and make
the Greens vanish. Since "no majority is normal" is the single most important fact about devolved
politics, this has to be modelled. Proposed shape, kept as small as possible:

```ts
// data/chambers.ts
interface ChamberProfile {
  ...
  seatSystem: 'fptp' | 'ams' | 'listPr';
  /** AMS: the list regions, each with its constituency count and list seats */
  listRegions?: { id: string; name: string; constituencies: number; listSeats: number }[];
  /** listPr: members per constituency */
  districtSize?: number;
}

// types/game.ts
interface SyntheticSeat {
  ...
  kind?: 'constituency' | 'list';   // absent = constituency
  listRegion?: string;              // AMS: which region's list this seat belongs to
}
```

- **Constituency seats** are generated and fought exactly as now (`generateSeatMap` with a
  one-region matrix, `computeSeat` with the per-seat swing), one `regionalClimate` per list region
  so Glasgow and the Highlands differ.
- **List seats** are allocated after the constituency loop: for each list region, the regional
  vote per party is the mean of its constituency shares in that region times a per-party
  `listRatio` (the SNP's list vote runs below its constituency vote, Labour's and the Lib Dems'
  above it), with list-only parties (Scottish Greens, Alba) taking their polled share directly.
  Then d'Hondt, divisor = constituency seats already won + list seats so far + 1. This is
  ~60 lines and fully testable against the 2016 and 2021 regional results.
- **Polling** stays one headline share per party, as now. Holyrood polls publish both votes, but
  the regional vote is the one that decides seats and the one the anchor should be.
- **The player's seat** is a constituency seat by default. The signature Holyrood mechanic falls
  out for free: lose the constituency and, if the party ranks you high enough on the regional
  list (leader = rank 1; cabinet rank and standing decide the rest), you come back as a list MSP
  (Sarwar 2021, Ross 2021). `ConstituencyResult` gains `savedByList?: boolean`, and the election
  night screen gets its best new line.
- **Senedd 2026** is `listPr`: the player's seat is a list rank in a six-member constituency, and
  "holding the seat" means the party won at least `rank` seats there. `constituencyApproval`
  moves the rank the party gives you rather than the vote directly. It is the same code path as
  the AMS list stage with `constituencies: 0` and six seats per district.
- `HUNG_BAND = 16` in `runElection` is Commons-scaled; it must scale with the House (about 2.5%,
  so 3 seats at Holyrood).
- The `Hemicycle` component draws 650 dots; HillSim already made it draw `totalSeats`.

None of this exists in HillSim. It is the one genuinely new engine feature, and the reason the
port is not purely mechanical.

### 3.2 Parties are the same organisations

HillSim widened `PartyId` (`on_lib`) because the Ontario Liberals are not the federal Liberals. In
Britain, Scottish Labour, the Scottish Conservatives and the Scottish Liberal Democrats are
branches of the UK parties with their own leaders; the SNP and Plaid Cymru are the same party in
both chambers; Reform UK is one party. Two options:

1. **Mirror HillSim: widen** (`sco_lab`, `wal_lab`). Keeps `arena.test.ts`'s "no chamber shares a
   party" guard and every `PARTIES[p].arena` lookup. Costs a counterpart table that is 90%
   identity, duplicate colours, and prose that calls your own party a different thing in each
   chamber.
2. **Reuse the UK ids** (`lab`, `con`, `ld`, `snp`, `pc`, `reform`, `ukip`) and add only the
   parties that are genuinely separate: `sgp` (Scottish Greens, a different party from the Green
   Party of England and Wales) and `alba`. The ballot per chamber comes from
   `LegislatureSnapshot.parties`, which HillSim already threads all the way down to seat
   generation, floor-crossing and the poll graph, so `Party.arena` is not needed to decide what a
   chamber polls. `counterpartParty` becomes identity except `green` to `sgp` and back.

**Recommend option 2.** It is more faithful, and it makes a Scottish Labour MP who moves to
Holyrood stay in the Labour Party, which is what happens. Two consequences to carry: the display
name becomes chamber-aware (`lab` renders "Scottish Labour" at Holyrood, "Welsh Labour" in the
Senedd; `con` renders "Scottish Conservatives"), and the "chamber-scoped party systems" test is
replaced by "every party on a chamber's ballot either contests that nation at Westminster or is
devolved-only". The `minorParty` requirement is computed from government and opposition status,
so it is already arena-relative: the SNP is a third party at Westminster and the government at
Holyrood with no change.

The era-specific populist slot already exists here (`populistPartyForEra`): UKIP held seven Senedd
seats in 2016 and polls at Holyrood in 2016; Reform takes the slot from 2021.

### 3.3 Fixed five-year terms and no snap elections

Canadian premiers call early elections and HillSim's NPC-head logic does too (`PM_SNAP_ELECTION`,
the late-term call). Holyrood and the Senedd have fixed five-year terms since 2016 (first Thursday
in May: 2016, 2021, 2026, 2031). Dissolution needs either a two-thirds vote or a failure to
nominate a First Minister within 28 days. `ChamberProfile` needs `fixedTerm: true`, and the
scheduler's snap-election and player "call an election" branches must honour it. The extraordinary
election after a failed nomination is a real and rare event (it nearly happened in 2024 when Humza
Yousaf resigned) and is worth one forced sequence of its own later, not in the port.

### 3.4 Government formation norms

Minority government is the Holyrood default (SNP 2007 to 2011, 2016 to 2021, 2024 on) and
coalition or co-operation the historical alternative: Labour–Lib Dem partnerships 1999 to 2007,
the Bute House Agreement with the Greens 2021 to 2024, Labour–Plaid "One Wales" 2007 to 2011, the
Labour–Plaid Co-operation Agreement 2021 to 2024, and a Lib Dem minister in a Labour Welsh
Government 2016 to 2021. The existing `arrangement` union (`majority | minority | supplyConfidence
| coalition`) and `coalitionPartner`/`confidencePartner` cover all of these. What HillSim's
`installNpcGovernment` does not do is pick a partner: it writes `majority` or `minority` and stops.
A devolved `formGovernment` step that offers the nearest party by ideology a deal when the winner
is short (Greens for the SNP, Plaid or Lib Dems for Labour) is ~40 lines and is what makes a
caught-up Holyrood read right. It also lets the existing coalition-life cards (`arrangementIn`)
fire there.

### 3.5 The ladder is not shorter

HillSim's provinces have **no tier 3**, and the doc is explicit that "the short ladder is the
whole point of going provincial." The devolved governments are the other way round: they have a
real two-tier ministry.

| Tier | Westminster | Scotland | Wales |
|---|---|---|---|
| 1 | PPS | Parliamentary Liaison Officer | *(none; land on tier 2 or a committee convener)* |
| 2 | Whip | Whip (party business manager) | Whip |
| 3 | Minister of State | **Minister for X** (junior, under a Cabinet Secretary) | **Minister for X** (since 2024; Deputy Minister before) |
| 4 | Secretary of State | **Cabinet Secretary for X** | **Cabinet Secretary for X** (since March 2024; Minister for X before) |
| 4 | Chief Whip / Leader of the House | Minister for Parliamentary Business | Trefnydd and Chief Whip |
| 5 | Prime Minister | First Minister | First Minister |
| 0 | Speaker | Presiding Officer | Llywydd |

So `translateOffice` for a devolved arena is nearer to identity-by-tier than HillSim's: tier 3 to
`{arena}_min_{dept}`, tier 4 to `{arena}_cabsec_{dept}`. The Scottish Cabinet is 10 to 12 Cabinet
Secretaries plus ~15 Ministers; the Welsh one is capped by statute (raised by the 2024 Act). The
Deputy First Minister overlay maps onto the existing `deputyPmId`/`_isDeputyPM` machinery
unchanged.

### 3.6 Departments

Keep `DEPARTMENTS` UK-only, for the same reason HillSim kept its federal (nine sites in
`career.ts` iterate it to pick a random brief). Add a `DevolvedDepartmentId` union to
`DepartmentId` and a `DEVOLVED_CABINET: Record<DevolvedArenaId, DepartmentId[]>`:

- **Reused:** `health`, `education`, `transport`, `environment` (as Net Zero / Climate Change and
  Rural Affairs), `business` (as Economy), `culture`, `housing`, `energy`, `justice` (**Scotland
  only**: justice and policing are not devolved to Wales), `treasury` (retitled Finance).
- **New, devolved-only:** `localGovernment`, `socialJustice`, `rural`, `constitution` (Scotland:
  Constitution, External Affairs and Culture), `welshLanguage` (Wales), `gaelic` is a Scottish
  Economy sub-brief and not worth an id.
- **Absent:** `home`, `foreign`, `defence`, `dwp` (social security is partly devolved to Scotland
  since 2016 and sits under Social Justice), `scienceTech`.

The devolved `GREAT_OFFICES` are Finance, Health and Education, the same three HillSim chose for
a province and for the same reason: health and education are most of what the government spends.

### 3.7 Titles move with the calendar

HillSim's `ChamberProfile.member` is a constant. Here it cannot be: Welsh members were "AMs"
until 6 May 2020 and "MSs" after; Welsh ministers were "Minister for X" until March 2024 and
"Cabinet Secretary for X" after. `memberTitle(arena, day)` and `cabinetTitle(arena, day)` replace
the constants, and the voice rules must read them too. Scotland is stable (MSP, Cabinet Secretary,
Minister) across every era on offer.

### 3.8 The constitutional axis

HillSim deliberately did not model Quebec's sovereignty question beyond prose, calling it "the one
thing about Quebec politics the numbers cannot express." Independence is more central to Holyrood
than sovereignty is to the National Assembly: it is the axis every party is sorted on, and a
Section 30 request, a Section 35 order, or a referendum pledge is the FM's signature act.
Recommend doing exactly what HillSim did for the port (prose, in the deck) and flagging an
`indySupport` meter and a referendum sequence as the first post-port feature, not part of it.
Wales has a weaker version (independence polls at ~25 to 30%) that stays prose.

### 3.9 Which eras can be offered

`federalEraFor(day)` needs a Commons sitting on or before the devolved polling day.
WestminsterSim's eras are 2010, 2015, 2017, 2019 and 2024, so:

| Devolved election | Commons it derives | Offerable |
|---|---|---|
| 5 May 2011 | 2010 parliament, one year in | yes |
| 5 May 2016 | 2015 parliament, one year in | yes |
| 6 May 2021 | 2019 parliament, 17 months in | yes |
| 7 May 2026 | 2024 parliament, 22 months in | yes, **results to be entered and verified** |
| 3 May 2007 | none: predates the 2010 era | only if a 2005 Commons is added |

HillSim offered every provincial era back to 2006 to 2009 because its earliest federal era is
2008. Recommend offering 2011, 2016, 2021 and 2026 for both nations and leaving 2007 out unless a
2005 parliament is wanted at Westminster for its own sake. The 2026 results were declared on 7
May 2026, after the Senedd's move to 96 seats; the seat counts and vote shares in section 5 for
2026 are deliberately left blank rather than guessed.

### 3.10 Regions and names

`RegionId` already has `scotland` and `wales` as single regions with their own
`swingSensitivity` (0.6 and 0.85), and the devolved arena's `regions` is just `['scotland']`. The
eight Holyrood list regions and the five old Senedd ones live on the seat (`listRegion`), not in
`RegionId`, so nothing that keys on region changes. Name pools: the 73 Holyrood constituencies
are not the Westminster ones (Ontario was the only province that could reuse the federal list,
and neither nation can), so `data/devolvedSeats.ts` carries 73 + 40 + 16 names plus the list
regions.

### 3.11 Dual mandates

Until recently a politician could sit in both (Salmond, Rhodri Morgan). Legislation passed in
both nations in 2024 to 2025 ends the Commons dual mandate, so HillSim's one-way resign-and-stand
jump is now exactly right, and a by-election delivers the guaranteed seat (Holyrood constituency
vacancies are by-elections; list vacancies go to the next name, which is the cheap route for a
drafted leader).

### 3.12 Leading from outside the chamber

A UK wrinkle with no Canadian analogue: Douglas Ross led the Scottish Conservatives for a year
as an MP; Jim Murphy led Scottish Labour for five months with no Holyrood seat. HillSim's draft
hands the winner the party's safest seat on the spot. The faithful version is "lead from
Westminster until the next Holyrood election, then stand at the top of a list." Recommend
shipping HillSim's version first and adding the outside-leader variant as a flag on the draft
payload later; it touches the leader-rank checks in `career.ts`, which all assume `hasSeat`.

### 3.13 The chamber's voice, for Britain

The substitution rules differ in detail and in one trap:

- `Prime Minister` to `First Minister`; `Downing Street` / `Number 10` to `Bute House` (Scotland)
  or `the First Minister's office` (Wales, which has no residence); `Whitehall` to `St Andrew's
  House` / `Cathays Park`; `the Commons` / `the House` to `the Chamber`; `Westminster` to
  `Holyrood` / `Cardiff Bay`; `MPs` to `MSPs` / `MSs`; `PMQs` to `FMQs` (both chambers hold First
  Minister's Questions on Thursdays, so every PMQs card maps); `Chancellor` to `Finance
  Secretary`; `Secretary of State` to `Cabinet Secretary`; `Minister of State` to `Minister`;
  `Chief Whip` to `Minister for Parliamentary Business` / `Trefnydd`; `the Speaker` to `the
  Presiding Officer` / `the Llywydd`; `general election` to `Holyrood election` / `Senedd
  election`; `the country` to `Scotland` / `Wales`.
- **The trap:** HillSim's `national` to `provincial` rule would turn "Scottish National Party"
  into "Scottish Provincial Party". Either protect the party name before the pass or drop the
  rule; `nationwide` to `Scotland-wide` is still wanted.
- Wales wants a light bilingual layer in authored cards (Senedd, Llywydd, Trefnydd, Cymru,
  Cymraeg), not in the voice pass.
- `the Lords` has no devolved equivalent and the peerage exit offer is still valid for a devolved
  politician, so leave the exit offers alone.

### 3.14 The scenery cards become real

`src/content/cards/devolvedScenery.ts` (6 cards, flavour-only, for UK-party MPs seated in
Scotland, Wales or NI) already describes exactly what HillSim lists as its next step: "federal to
provincial conflict cards firing from both chairs, now that the other government's leader is a
real NPC in a chamber that is actually simulated." Once Holyrood is a dormant arena with a named
First Minister and a real party, those cards can name them (`{fm}`, `{fmParty}`) and mirror
versions can fire at Holyrood about the Secretary of State for Scotland, who already exists here
as `sos_scotland`. The Barnett row, the two-governments blame game and the "which parliament
failed you" doorstep get their second chair for free.

### 3.15 A fix Scotland needs regardless

HillSim's BRIEF §3a documents two inherited bugs in *this* engine's handling of a regional party:
a uniform national swing is applied as the same absolute delta to every seat, so a party whose
vote lives in 9% of the House (the SNP) has its movement diluted elevenfold; and polling noise
was flat rather than scaled by party size. HillSim's `computeSeat` now takes a `coverage` map and
divides a regional party's national move by the share of the House it contests. That fix is in
`election.ts` and `polling.ts`, is independent of arenas, and would improve WestminsterSim's
Scottish results today. Port it first.

### 3.16 Northern Ireland

Stormont is STV, mandatory power-sharing with a joint First and deputy First Minister, cross-
community votes, petitions of concern, and periodic collapse. Nothing in this engine represents
any of that, and faking it would be worse than leaving it out, which is the same call HillSim made
for the consensus-government territories. WestminsterSim already excludes NI as a player region.

---

## 4. Data to assemble

Modelled on `data/provinces.ts`. Seat totals and governments below are from memory and must be
checked against the official returns before they go in, exactly as HillSim's doc describes doing
(its first pass from memory had real errors the checking caught). Vote shares are the regional
list vote. 2026 is left blank on purpose.

### Scottish Parliament (129 seats; majority 65)

| Election | SNP | Lab | Con | LD | Green | Other | Government |
|---|---:|---:|---:|---:|---:|---:|---|
| 2007-05-03 | 47 | 46 | 17 | 16 | 2 | 1 ind | SNP minority (Salmond), opposition Lab |
| 2011-05-05 | 69 | 37 | 15 | 5 | 2 | 1 ind | SNP majority |
| 2016-05-05 | 63 | 24 | 31 | 5 | 6 | — | SNP minority (Sturgeon), opposition Con |
| 2021-05-06 | 64 | 22 | 31 | 4 | 8 | — | SNP minority; Bute House Agreement with Greens from Aug 2021 to Apr 2024 |
| 2026-05-07 | | | | | | | **to enter from the official result** |

List regions: Central Scotland (9 constituencies), Glasgow (9), Highlands and Islands (8), Lothian
(9), Mid Scotland and Fife (9), North East Scotland (10), South Scotland (9), West Scotland (10);
7 list seats each.

### Senedd (60 seats to 2021, majority 31; 96 from 2026, majority 49)

| Election | Lab | PC | Con | LD | UKIP/Reform | Other | Government |
|---|---:|---:|---:|---:|---:|---:|---|
| 2007-05-03 | 26 | 15 | 12 | 6 | — | 1 ind | Lab minority, then Lab–Plaid "One Wales" coalition from July 2007 |
| 2011-05-05 | 30 | 11 | 14 | 5 | — | — | Lab, exactly half the chamber |
| 2016-05-05 | 29 | 12 | 11 | 1 | 7 UKIP | — | Lab-led, with the Lib Dem leader in cabinet |
| 2021-05-06 | 30 | 13 | 16 | 1 | 0 | — | Lab minority; Co-operation Agreement with Plaid from Dec 2021 to May 2024 |
| 2026-05-07 | | | | | | | **to enter from the official result**; 16 constituencies × 6 |

Old list regions: North Wales, Mid and West Wales, South Wales West, South Wales Central, South
Wales East; 8 constituencies and 4 list seats each.

### Also needed

- The two cabinets' portfolio lists per era (3.6) and the per-party `listRatio` calibration (3.1).
- 73 + 40 + 16 constituency names and the two list-region tables (3.10).
- `sgp` and `alba` party records; chamber-aware display names for `lab`, `con`, `ld` (3.2).
- Blurbs for the era picker, one line each, as HillSim's `LegislatureSnapshot.blurb`.

---

## 5. Port plan, in order

Each phase leaves the game playable and the suite green.

**Phase 0: the regional-party swing fix** (3.15). `election.ts`, `polling.ts`, a
`regionalSwing.test.ts` ported from HillSim. Independent of everything else and worth having
alone.

**Phase 1: the arena scaffold, mechanical port.** `seats.ts`; the `ArenaId`/`ArenaSnapshot`/
`arena`/`dormant`/`anchorShares`/`polledParties` additions to `types/game.ts`; `Requirement.arena`;
`data/chambers.ts` with three profiles; `engine/arena.ts` (freeze, thaw, catch-up, ghost player,
leader retirement, bench rebuild, incoming seniority, the jump, `startInNation`, `nationalEraFor`,
`arenaElections`, `allPlayerHeadTenures`); `chamberVoice.ts` with the UK rules and the SNP guard;
`cardEngine.ts` tokens and gating; the ~60 `career.ts` hook sites; the scheduler's recruit and
draft events and per-chamber fallback pool; `newGame.ts` devolved start; `gameStore.ts` v10
migration and `jumpChamber`; the `Chamber` creation step; the Profile jump panel; arena filters on
the Cabinet, Parliament, History and Elections surfaces; `Hemicycle` by `totalSeats`. At this point
Holyrood runs as FPTP with 129 single seats, which is wrong but playable, and every HillSim test
in `arena.test.ts` can be ported and made green.

**Phase 2: seat systems** (3.1). `seatSystem` on the profile; `kind`/`listRegion` on the seat;
list allocation by d'Hondt after the constituency loop; the list safety net; `listPr` for the
2026 Senedd; `HUNG_BAND` by House size; election-night copy for list seats. Tests: the 2016 and
2021 Holyrood results reproduce within ±3 seats from their own anchors; the SNP never clears 65 on
a 45% list vote without a list collapse elsewhere; 96 Senedd seats always sum; a leader who loses a
constituency is returned on the list.

**Phase 3: the devolved ladder and nouns** (3.3 to 3.7). `fixedTerm`; `formGovernment` with a
partner; `DEVOLVED_CABINET`, tier-3 and tier-4 devolved offices, `translateOffice` by tier,
devolved great offices and ranks; `memberTitle`/`cabinetTitle` by day; chamber-aware party names.

**Phase 4: data** (section 4), verified against the official returns, with the arithmetic tests
HillSim wrote (seats sum to the real House, shares sum to about one, every seat-winner is on the
ballot, every ballot party has a share, the governing party either won most seats or has a named
partner).

**Phase 5: content.** A shared devolved deck of ~40 written against `{house}`/`{member}`/`{head}`
tokens (NHS waiting times, a council's budget, a ferry, a school estate, a Barnett row from the
other chair, FMQs), 10 to 20 each for Scotland (independence as prose, income tax divergence, the
Section 35 fight, CalMac, Gaelic) and Wales (20mph, the M4 relief road, Port Talbot, Cymraeg 2050,
Senedd expansion), and the two-chair rewrite of `devolvedScenery.ts`. HillSim's own verdict on
its 90 provincial cards: "enough to play; not enough to match the federal deck."

**Later, not in the port:** the independence meter and referendum sequence (3.8); the extraordinary
election after a failed FM nomination (3.3); leading from outside the chamber (3.12); a 2005
Commons so 2007 can be offered (3.9); Holyrood's committee system (HillSim notes committees are
Commons-only in its model too, and Holyrood committees matter more than Canadian provincial ones).

---

## 6. Decisions taken

1. **Party identity** (3.2): the UK `PartyId`s are reused in every chamber. `partyNameIn` renders
   "Scottish Labour" at Holyrood and "Welsh Conservatives" in the Senedd; `sgp` (Scottish Greens)
   and `alba` are the only new ids, flagged `devolvedOnly` so they never stand for Westminster.
2. **Eras** (3.9): 2011, 2016 and 2021 for both chambers. 2007 predates the 2010 Commons and 2026 is
   not guessed; a career that starts in 2021 fights the 2026 election in the simulation.
3. **Senedd 2026** (3.1): built. `seatSystemAt('wales', day)` returns AMS before 7 May 2026 and
   closed-list PR in sixteen six-member constituencies from it; `runElection` rebuilds the map on
   the day, carrying each new constituency's politics from the old region its voters came from.
4. **The list safety net**: built. A constituency member whose seat falls is returned from the
   regional list when the party's allocation reaches their rank; a Scottish Green player is a list
   member from the start.

## 7. What landed

Everything in Phases 0 to 3 of the plan above, on branch `claude/devolved-chambers`:

| Area | Where |
|---|---|
| Arena scaffold: freeze/thaw, lazy catch-up with the ghost player, leader retirement and a devolved formation-partner pick in dormant chambers, incoming seniority, the jump, devolved starts, `ukEraFor` | `src/engine/arena.ts` |
| Chamber profiles, fixed-term flag, seat systems by date, the Welsh renames (AM to MS in May 2020; Minister to Cabinet Secretary in March 2024), first-Thursday-in-May scheduling | `src/data/chambers.ts` |
| Holyrood 2011/2016/2021 and Senedd 2011/2016/2021 with per-region constituency matrices, list and constituency vote, per-party list ratios | `src/data/devolved.ts` |
| 73 Holyrood constituencies by region, 40 old Senedd constituencies, the 16 constituencies of the 2026 Senedd | `src/data/devolvedSeats.ts` |
| d'Hondt, the list stage, the safety net, list ranks, list-PR districts | `src/engine/listSeats.ts`, `src/engine/election.ts`, `src/generation/constituency.ts` |
| HillSim's regional-swing fix: a regional party's national move is divided by its seat coverage before swinging; polling noise scales with party size | `src/engine/election.ts`, `src/engine/polling.ts` |
| Devolved departments, the two-tier `cabsec`/`min` ladder, Scotland-only justice, shared rungs with chamber titles, `translateOffice` both ways (no Welsh tier 1) | `src/data/offices.ts` |
| The chamber's voice over generated prose, with the "Scottish National Party" shield | `src/engine/chamberVoice.ts` |
| Chamber tokens (`{house}`, `{member}`, `{head}`, `{government}`, `{nation}`, `{speaker}`, `{otherleader}`, `{otherparty}`, `{othergov}`) and Westminster-only default gating | `src/engine/cardEngine.ts` |
| "Westminster is asking" and "a devolved party wants you to lead", fixed-term guards, per-chamber fallback pool | `src/engine/scheduler.ts`, `src/engine/career.ts` |
| Save migration v10, `jumpChamber`, floor-crossing kept within the chamber | `src/store/gameStore.ts` |
| Chamber step at creation; jump panel on the Profile; arena filters on the Cabinet, Parliament, History, Elections, poll and seat graphs; list-seat lines on election night; First Minister on the end screen | `src/screens/*`, `src/components/*` |
| Shared devolved deck plus Scotland and Wales decks | `src/content/cards/devolved.ts`, `src/content/cards/nations/*.ts` |
| Tests | `src/engine/__tests__/arena.test.ts`, `src/engine/__tests__/listSeats.test.ts` |

### Still open

- The seat counts and vote shares in `data/devolved.ts` were written from memory and are guarded
  for arithmetic, not for truth. They should be checked against the official returns.
- 2026 results for both chambers, once entered, would add a fourth era to each.
- The independence meter and referendum sequence (3.8), the extraordinary election after a failed
  nomination (3.3), leading from outside the chamber (3.12), Holyrood and Senedd committees, and
  the two-chair rewrite of `devolvedScenery.ts` (the `{otherleader}` tokens it needs now exist).
- Relationships do not survive a round trip: only the mentor and the journalist follow a move.
- A devolved chamber's ballot is fixed at the election the career walked into, so a 2016 start
  keeps UKIP on the Senedd ballot for good while a 2021 start has Reform. Party systems being
  rebuilt is a real-world event the simulation does not model, as HillSim's doc also notes.
- Lost confidence votes in a fixed-term chamber end the First Minister, not the parliament; the
  successor is nominated from the same party. The opposition forming a government instead, and
  the extraordinary election after 28 days without a nomination, are not modelled.
