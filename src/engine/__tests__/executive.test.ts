import { describe, expect, it } from 'vitest';
import { GameState, OfficeId, PartyId } from '../../types/game';
import { NI_ASSEMBLY } from '../../data/niAssembly';
import { OFFICES, cabinetOfficesFor, executiveDepartments } from '../../data/offices';
import {
  allocateMinistries, designateFirstMinisters, entitledParties, hasOfficialOpposition, inExecutive,
  oppositionMinSeats, pickJusticeParty, planExecutive, OPPOSITION_REFORM_DAY,
} from '../executive';
import {
  applyElectionAftermath, giveOffice, nextOfficeFor, onFrontbenchTrack, onMinorPartyTrack,
  playerInGovernmentBloc, playerLeaderRole, playerOfficeTitle, withdrawFromCoalitionCore,
} from '../career';
import { installPlayerAsLeader, jumpToArena } from '../arena';
import { runElection } from '../election';
import { updatePolling } from '../polling';
import { createNewGame } from '../newGame';
import { nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { isoToDay } from '../clock';
import { Rng } from '../rng';

const sum = (m: Partial<Record<PartyId, number>>) => Object.values(m).reduce((a, b) => a + (b ?? 0), 0);

function game(opts: { seed: number; arena?: 'uk' | 'ni'; election?: string; partyId?: PartyId; region?: GameState['player']['region']; era?: '2010' | '2024' }): GameState {
  return createNewGame({
    name: 'Test Subject', gender: 'f', age: 40, region: opts.region ?? 'ni', background: 'lawyer',
    partyId: opts.partyId ?? 'dup',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: opts.era ?? '2010', seed: opts.seed,
    ...(opts.arena && opts.arena !== 'uk' ? { arena: opts.arena, devolvedElection: opts.election ?? '2011-05-05' } : {}),
  });
}

/** the party holding each cabinet post */
function holders(g: GameState): Record<OfficeId, PartyId> {
  const out: Record<OfficeId, PartyId> = {};
  for (const post of g.government.cabinet) {
    out[post.officeId] = post.characterId === 'player' ? g.player.partyId : g.characters[post.characterId].partyId;
  }
  return out;
}

function countBy(parties: PartyId[]): Partial<Record<PartyId, number>> {
  const out: Partial<Record<PartyId, number>> = {};
  for (const p of parties) out[p] = (out[p] ?? 0) + 1;
  return out;
}

const SEATS_2022: Partial<Record<PartyId, number>> = { sf: 27, dup: 25, alliance: 17, uup: 9, sdlp: 8, tuv: 1, pbp: 1, ind: 2 };

describe('designating the First and deputy First Ministers', () => {
  it('the largest party nominates the First Minister, the largest party of the other community the deputy', () => {
    expect(designateFirstMinisters(NI_ASSEMBLY[0].seats)).toEqual({ fm: 'dup', dfm: 'sf' });
    expect(designateFirstMinisters(NI_ASSEMBLY[1].seats)).toEqual({ fm: 'dup', dfm: 'sf' });
    expect(designateFirstMinisters(SEATS_2022)).toEqual({ fm: 'sf', dfm: 'dup' });
  });
  it('an Alliance plurality takes the First Minister, and the deputy comes from the largest designation', () => {
    expect(designateFirstMinisters({ alliance: 30, dup: 25, sf: 24, uup: 6, sdlp: 4, tuv: 1 })).toEqual({ fm: 'alliance', dfm: 'dup' });
    expect(designateFirstMinisters({ alliance: 30, sf: 26, dup: 20, sdlp: 8, uup: 6 })).toEqual({ fm: 'alliance', dfm: 'sf' });
    // a tie on seats between the two big parties is broken by the vote
    expect(designateFirstMinisters({ dup: 27, sf: 27, alliance: 17 }, { dup: 0.21, sf: 0.29 })).toEqual({ fm: 'sf', dfm: 'dup' });
  });
  it('independents and the Speaker have no designation and never lead', () => {
    expect(designateFirstMinisters({ ind: 50, spk: 1, dup: 20, sf: 19 })).toEqual({ fm: 'dup', dfm: 'sf' });
    expect(designateFirstMinisters({ dup: 50, uup: 10 })).toBeNull();
  });
});

describe('sharing out the ministries', () => {
  it("2016 with the DUP and Sinn Féin alone: four and three of the seven, Justice to the independent", () => {
    const alloc = allocateMinistries(NI_ASSEMBLY[1].seats, ['dup', 'sf'], executiveDepartments('ni'), 'ind');
    const counts = countBy(Object.values(alloc) as PartyId[]);
    expect(counts).toEqual({ dup: 4, sf: 3, ind: 1 });
    expect(alloc.justice).toBe('ind');
    expect(Object.keys(alloc).sort()).toEqual([...executiveDepartments('ni')].sort());
    // the money goes to the first pick
    expect(alloc.finance).toBe('dup');
  });
  it('2011: every party is entitled, and the real Executive is five parties with Alliance at Justice', () => {
    const depts = executiveDepartments('ni');
    expect(entitledParties(NI_ASSEMBLY[0].seats, depts.length - 1)).toEqual(['dup', 'sf', 'uup', 'sdlp']);
    const plan = planExecutive(NI_ASSEMBLY[0].seats, NI_ASSEMBLY[0].shares, new Rng(1), isoToDay('2011-05-05'), 'ni', NI_ASSEMBLY[0].executive)!;
    expect(plan.fm).toBe('dup');
    expect(plan.dfm).toBe('sf');
    expect(plan.parties).toEqual(['dup', 'sf', 'alliance', 'uup', 'sdlp']);
    expect(countBy(Object.values(plan.allocation) as PartyId[])).toEqual({ dup: 3, sf: 2, uup: 1, sdlp: 1, alliance: 1 });
    expect(plan.allocation.justice).toBe('alliance');
  });
  it('without a snapshot the rules run: before 2016 nobody declines and Alliance takes Justice', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const plan = planExecutive(NI_ASSEMBLY[0].seats, NI_ASSEMBLY[0].shares, new Rng(seed), isoToDay('2011-05-05'), 'ni')!;
      expect(plan.declined).toEqual([]);
      expect(plan.justice).toBe('alliance');
      expect(plan.parties.sort()).toEqual(['alliance', 'dup', 'sdlp', 'sf', 'uup']);
    }
  });
  it('from 2016 the smaller entitled parties sometimes decline, never the two heads', () => {
    let declined = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const plan = planExecutive(NI_ASSEMBLY[1].seats, NI_ASSEMBLY[1].shares, new Rng(seed), OPPOSITION_REFORM_DAY, 'ni')!;
      expect(plan.declined).not.toContain('dup');
      expect(plan.declined).not.toContain('sf');
      if (plan.declined.length > 0) declined++;
      // every department is held by somebody in the Executive
      for (const d of executiveDepartments('ni')) expect(plan.parties).toContain(plan.allocation[d]);
    }
    // two parties each declining with p = 0.4: P(at least one) = 0.64, 40 draws
    expect(declined).toBeGreaterThan(14);
    expect(declined).toBeLessThan(36);
  });
  it('Justice: Alliance by convention, an independent possible after the reforms', () => {
    expect(pickJusticeParty(NI_ASSEMBLY[0].seats, isoToDay('2011-05-05'))).toBe('alliance');
    expect(pickJusticeParty({ dup: 40, sf: 30 }, isoToDay('2011-05-05'))).toBeUndefined();
    const picks = new Set<string>();
    for (let s = 1; s <= 20; s++) picks.add(pickJusticeParty(NI_ASSEMBLY[1].seats, OPPOSITION_REFORM_DAY, new Rng(s)) ?? 'none');
    expect(picks).toEqual(new Set(['alliance', 'ind']));
  });
  it('the opposition bar is five per cent of the House', () => {
    expect(oppositionMinSeats(108)).toBe(6);
    expect(oppositionMinSeats(90)).toBe(5);
  });
});

describe('a Stormont start', () => {
  it('2011 installs the real five-party Executive with the TUV outside and no official opposition', () => {
    const g = game({ seed: 5, arena: 'ni', partyId: 'uup' });
    const gv = g.government;
    expect(gv.executive?.status).toBe('formed');
    expect(gv.executive?.parties).toEqual(['dup', 'sf', 'alliance', 'uup', 'sdlp']);
    expect(gv.executive?.justiceParty).toBe('alliance');
    expect(gv.governingParty).toBe('dup');
    expect(gv.coalitionPartner).toBe('sf');
    expect(gv.arrangement).toBe('coalition');
    expect(gv.deputyTitle).toBe('dfm');
    expect(g.characters[gv.pmId].partyId).toBe('dup');
    expect(g.characters[gv.deputyPmId!].partyId).toBe('sf');
    // every post on the roster is filled by somebody from the party that holds the brief
    const held = holders(g);
    expect(Object.keys(held).sort()).toEqual([...cabinetOfficesFor('ni')].sort());
    expect(held.ni_minister_finance).toBe('dup');
    expect(held.ni_minister_justice).toBe('alliance');
    expect(held.chiefWhip).toBe('dup');
    expect(countBy(Object.values(held))).toEqual({ dup: 4, sf: 2, uup: 1, sdlp: 1, alliance: 1 });
    for (const post of gv.cabinet) expect(g.characters[post.characterId].officeId).toBe(post.officeId);
    // the TUV's single seat leads the opposition in name only
    expect(gv.oppositionParty).toBe('tuv');
    expect(g.characters[gv.loId].partyId).toBe('tuv');
    expect(hasOfficialOpposition(g)).toBe(false);
    expect(gv.shadowCabinet).toEqual([]);
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(1);
    expect(g.pmHistory[g.pmHistory.length - 1].partyId).toBe('dup');
    expect(g.loHistory![g.loHistory!.length - 1].partyId).toBe('tuv');
    // a UUP member is on the frontbench track as a party of the Executive
    expect(onFrontbenchTrack(g)).toBe(true);
    expect(playerInGovernmentBloc(g)).toBe(true);
    expect(onMinorPartyTrack(g)).toBe(false);
  });

  it('a TUV member sits on the minor track: one seat is no official opposition', () => {
    const g = game({ seed: 6, arena: 'ni', partyId: 'tuv' });
    expect(g.player.partyId).toBe('tuv');
    expect(g.government.oppositionParty).toBe('tuv');
    expect(onFrontbenchTrack(g)).toBe(false);
    expect(onMinorPartyTrack(g)).toBe(true);
    g.player.officeId = 'leader';
    expect(playerLeaderRole(g)).toBe('minorLeader');
  });

  it('2016 (held back from the picker but built for a later arrival) seats the UUP as the official opposition with a bench', () => {
    const g = game({ seed: 7, arena: 'ni', partyId: 'uup', election: '2016-05-05' });
    const gv = g.government;
    expect(gv.executive?.parties).toEqual(['dup', 'sf', 'ind']);
    expect(gv.executive?.justiceParty).toBe('ind');
    expect(holders(g).ni_minister_justice).toBe('ind');
    expect(countBy(Object.values(holders(g)))).toEqual({ dup: 5, sf: 3, ind: 1 });
    expect(gv.oppositionParty).toBe('uup');
    expect(hasOfficialOpposition(g)).toBe(true);
    expect(gv.shadowCabinet.map((p) => p.officeId).sort()).toEqual([...cabinetOfficesFor('ni')].sort());
    for (const post of gv.shadowCabinet) expect(g.characters[post.characterId].partyId).toBe('uup');
    expect(onFrontbenchTrack(g)).toBe(true);
    expect(playerInGovernmentBloc(g)).toBe(false);
    expect(inExecutive(g, 'uup')).toBe(false);
  });
});

describe('the single-tier ladder respects the share-out', () => {
  it('a UUP member is only ever offered the one post the party holds, and is offered it', () => {
    const g = game({ seed: 8, arena: 'ni', partyId: 'uup' });
    g.player.officeId = 'ni_spokes_health';
    g.player.officeSinceDay = g.day - 400;
    g.player.stats.partyStanding = 70;
    const uupPost = Object.entries(holders(g)).find(([id, p]) => p === 'uup' && OFFICES[id].department)![0];
    let senior = 0;
    for (let s = 1; s <= 200; s++) {
      const target = nextOfficeFor(g, new Rng(s));
      if (!target) continue;
      if (OFFICES[target].tier >= 4 && OFFICES[target].department) {
        expect(target).toBe(uupPost);
        senior++;
      }
    }
    expect(senior).toBeGreaterThan(20);
  });
  it('an Alliance newcomer is offered a spokesperson brief, never one the party itself runs', () => {
    const g = game({ seed: 9, arena: 'ni', partyId: 'alliance' });
    g.player.officeId = 'whip';
    g.player.officeSinceDay = g.day - 400;
    let spokes = 0;
    for (let s = 1; s <= 200; s++) {
      const target = nextOfficeFor(g, new Rng(s));
      if (!target) continue;
      expect(target).not.toBe('pps');
      if (target.startsWith('ni_spokes_')) {
        expect(target).not.toBe('ni_spokes_justice');
        spokes++;
      }
      if (OFFICES[target].tier >= 4 && OFFICES[target].department) expect(target).toBe('ni_minister_justice');
    }
    expect(spokes).toBeGreaterThan(50);
  });
  it('giving a member a post their party does not hold lands them in one it does', () => {
    const g = game({ seed: 10, arena: 'ni', partyId: 'sdlp' });
    const rng = new Rng(3);
    giveOffice(g, rng, 'sos_treasury', 'promoted');
    const held = holders(g);
    expect(g.player.officeId).toMatch(/^ni_minister_/);
    expect(held[g.player.officeId!]).toBe('sdlp');
    expect(g.government.cabinet.find((p) => p.officeId === g.player.officeId)?.characterId).toBe('player');
    expect(playerOfficeTitle(g)).toMatch(/^Minister (of|for) /);
  });
});

describe('the Executive and the player', () => {
  it('a drafted leader of the deputy First Minister’s party becomes deputy First Minister', () => {
    const g = game({ seed: 11, arena: 'ni', partyId: 'sf' });
    installPlayerAsLeader(g, new Rng(11));
    expect(g.government.deputyPmId).toBe('player');
    expect(g.player.flags._isDeputyPM).toBe(true);
    expect(playerOfficeTitle(g)).toBe('deputy First Minister');
    expect(playerLeaderRole(g)).toBe('minorLeader');
    // walking out is not yet modelled: a no-op that leaves the Executive standing
    withdrawFromCoalitionCore(g, new Rng(12));
    expect(g.government.executive?.status).toBe('formed');
    expect(g.government.coalitionPartner).toBe('sf');
    expect(g.government.deputyPmId).toBe('player');
  });
  it('a drafted leader of the First Minister’s party is First Minister', () => {
    const g = game({ seed: 13, arena: 'ni', partyId: 'dup' });
    installPlayerAsLeader(g, new Rng(13));
    expect(g.government.pmId).toBe('player');
    expect(playerLeaderRole(g)).toBe('pm');
    expect(playerOfficeTitle(g)).toBe('First Minister');
  });
  it('an Assembly election re-forms the Executive with no coalition talks, and a minister keeps or moves', () => {
    for (const seed of [21, 22, 23, 24, 25, 26]) {
      const g = game({ seed, arena: 'ni', partyId: 'dup' });
      const rng = new Rng(seed);
      giveOffice(g, rng, 'ni_minister_finance', 'promoted');
      expect(g.government.cabinet.find((p) => p.officeId === 'ni_minister_finance')?.characterId).toBe('player');
      g.day = g.nextElectionBy;
      updatePolling(g, rng, g.day);
      const { result, playerWonSeat } = runElection(g, rng);
      applyElectionAftermath(g, rng, result, playerWonSeat);
      const gv = g.government;
      expect(gv.executive?.formedDay).toBe(g.day);
      expect(gv.arrangement).toBe('coalition');
      expect(g.forcedQueue.some((e) => e.kind === 'coalitionTalks' || e.kind === 'coalitionOffer')).toBe(false);
      const ranked = (Object.entries(result.seats) as [PartyId, number][]).sort((a, b) => b[1] - a[1]);
      expect(gv.governingParty).toBe(ranked[0][0]);
      expect(gv.coalitionPartner).toBeDefined();
      expect(gv.coalitionPartner).not.toBe(gv.governingParty);
      const held = holders(g);
      expect(Object.keys(held).sort()).toEqual([...cabinetOfficesFor('ni')].sort());
      for (const p of Object.values(held)) expect(gv.executive!.parties).toContain(p);
      if (playerWonSeat) {
        if (g.player.officeId) {
          expect(held[g.player.officeId]).toBe('dup');
          expect(gv.cabinet.find((p) => p.officeId === g.player.officeId)?.characterId).toBe('player');
        }
      } else {
        expect(g.player.officeId).toBeNull();
      }
      expect(gv.cabinet.filter((p) => p.characterId === 'player').length).toBeLessThanOrEqual(1);
      // Sinn Féin's seats count at Stormont
      expect(sum(g.seats)).toBe(108);
    }
  });
});

describe('the 2016 Assembly election, fought from the 2011 one', () => {
  // bands from forty seeded 2011→2016 runs at the final constants (means DUP 36.4,
  // SF 30.9, UUP 15.3, SDLP 14.6, Alliance 8.0; sd 3.5, 2.4, 2.7, 2.2, 0.9), set at
  // roughly three standard deviations; the real 2016 result was 38/28/16/12/8
  const BANDS: Partial<Record<PartyId, [number, number]>> = {
    dup: [26, 47], sf: [23, 39], uup: [4, 23], sdlp: [7, 22], alliance: [3, 12],
  };
  it('eight seeded runs land inside the bands and keep the single-seat parties on one', () => {
    const totals: Partial<Record<PartyId, number>> = {};
    for (let seed = 1; seed <= 8; seed++) {
      const g = game({ seed, arena: 'ni', partyId: 'dup' });
      const rng = new Rng(seed);
      g.day = g.nextElectionBy;
      updatePolling(g, rng, g.day);
      const { result } = runElection(g, rng);
      expect(sum(result.seats)).toBe(108);
      for (const [p, [lo, hi]] of Object.entries(BANDS) as [PartyId, [number, number]][]) {
        const n = result.seats[p] ?? 0;
        expect(n, `${p} seed ${seed}`).toBeGreaterThanOrEqual(lo);
        expect(n, `${p} seed ${seed}`).toBeLessThanOrEqual(hi);
        totals[p] = (totals[p] ?? 0) + n;
      }
      for (const p of ['tuv', 'gpni', 'ind'] as PartyId[]) expect(result.seats[p] ?? 0, `${p} seed ${seed}`).toBeLessThanOrEqual(2);
    }
    expect(totals.dup! / 8).toBeGreaterThan(32);
    expect(totals.dup! / 8).toBeLessThan(41);
    expect(totals.sf! / 8).toBeGreaterThan(27);
    expect(totals.sf! / 8).toBeLessThan(35);
  });
});

describe('a dormant Assembly catches up', () => {
  it('a 2024 Commons career drafted to Stormont finds a formed Executive in the ninety-seat Assembly', () => {
    const g = game({ seed: 31, arena: 'uk', partyId: 'lab', region: 'london', era: '2024' });
    g.player.region = 'ni';
    g.player.stats.profile = 80;
    jumpToArena(g, new Rng(31), 'ni', 'dup');
    expect(g.arena).toBe('ni');
    expect(sum(g.seats)).toBe(90);
    expect(g.government.executive?.status).toBe('formed');
    expect(g.government.coalitionPartner).toBeDefined();
    const held = holders(g);
    expect(Object.keys(held).sort()).toEqual([...cabinetOfficesFor('ni')].sort());
    for (const p of Object.values(held)) expect(g.government.executive!.parties).toContain(p);
    expect(g.pmHistory.filter((t) => t.endDay === null)).toHaveLength(1);
    expect(Object.keys(g.calendarDone).sort()).toEqual(['budget', 'conference', 'locals', 'recess']);
  });
});

describe('smoke: Stormont careers', () => {
  for (const party of ['dup', 'sf', 'alliance', 'uup'] as PartyId[]) {
    it(`a 2011 ${party} career runs 250 turns clean`, () => {
      const g = game({ seed: 40 + party.length, arena: 'ni', partyId: party });
      const rng = new Rng(40 + party.length);
      let shown = 0;
      for (let turn = 0; turn < 250 && !g.gameOver; turn++) {
        if (!g.currentCard) nextStep(g, rng);
        const card = g.currentCard;
        if (!card) break;
        const text = `${card.title} ${card.body} ${card.choices.map((c) => c.label).join(' ')} ${card.outcome?.text ?? ''}`;
        expect(text, `${card.kind} turn ${turn}`).not.toMatch(/undefined|\bthe the\b|\{[a-z]+\}|\bNaN\b/);
        if (card.kind !== 'ukRecruit' && card.kind !== 'devolvedDraft') {
          expect(text, `${card.kind} turn ${turn}`).not.toMatch(/Holyrood|Senedd|\bMSPs?\b|Cathays|Bute House|St Andrew|House of Commons|\bthe Commons\b|\bPMQs\b|Number 10/);
        }
        shown++;
        if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
        resolveChoiceCore(g, rng, card.kind === 'ukRecruit' ? 1 : 0);
        expect(g.arena).toBe('ni');
        if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
        continueCore(g, rng);
        for (const v of Object.values(g.player.stats)) expect(Number.isNaN(v)).toBe(false);
        expect(g.government.executive?.status).toBe('formed');
      }
      expect(shown).toBeGreaterThan(100);
    });
  }
});
