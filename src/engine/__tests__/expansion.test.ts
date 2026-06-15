import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  recordPmChange, reconstructPmHistory, buildLegacy, materializeForced, resolveForcedChoice,
  nextOfficeFor, callForLeaderResignationCore, seatPlayerJuniorPartner, setDeputyPmCore,
  sackMinisterCore, playerOfficeTitle, playerInGovernmentBloc, startBacking,
  applyElectionAftermath,
} from '../career';
import { initCalendar, nextStep, resolveCalendarChoice } from '../scheduler';
import { runElection } from '../election';
import { applyEffects } from '../effects';
import { cardEligible } from '../cardEngine';
import { getRelationship } from '../relationships';
import { ALL_CARDS } from '../../content/cards';
import { OFFICES } from '../../data/offices';
import { DecisionCard } from '../../types/content';
import { GameState, DrawnCard, ElectionResult } from '../../types/game';
import { Rng } from '../rng';

const byId = (id: string): DecisionCard => ALL_CARDS.find((c) => c.id === id)!;

function makeGame(seed = 7, causes: CreationInput['causes'] = ['publicServices']): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 44, region: 'yorkshire',
    background: 'teacher', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed, causes,
  };
  return createNewGame(input);
}

describe('expansion — data model', () => {
  it('seeds pmHistory, causes and favours on a new game', () => {
    const g = makeGame();
    expect(g.version).toBe(7);
    expect(g.pmHistory).toHaveLength(1);
    expect(g.pmHistory[0].endDay).toBeNull();
    expect(g.pmHistory[0].characterId).toBe(g.government.pmId);
    expect(g.loHistory).toHaveLength(1);
    expect(g.loHistory![0].endDay).toBeNull();
    expect(g.loHistory![0].characterId).toBe(g.government.loId);
    expect(g.player.causes).toEqual(['publicServices']);
    expect(g.player.favours).toEqual([]);
  });

  it('records a change of Prime Minister, closing the prior spell', () => {
    const g = makeGame();
    const firstPm = g.pmHistory[0];
    g.day += 400;
    recordPmChange(g, 'player');
    expect(g.pmHistory).toHaveLength(2);
    expect(firstPm.endDay).toBe(g.day);
    expect(g.pmHistory[1].characterId).toBe('player');
    expect(g.pmHistory[1].name).toBe(g.player.name);
    expect(g.pmHistory[1].endDay).toBeNull();
  });

  it('is a no-op when the same person is already the incumbent', () => {
    const g = makeGame();
    recordPmChange(g, g.government.pmId);
    expect(g.pmHistory).toHaveLength(1);
  });

  it('reconstructs pmHistory from a legacy save with no pmHistory', () => {
    const g = makeGame();
    // simulate a pre-v6 save: drop the structured history, keep a headline trail
    g.pmHistory = undefined as unknown as GameState['pmHistory'];
    g.history.push({ kind: 'event', date: g.day + 100, headline: 'Jordan Vale becomes Prime Minister' });
    g.government.pmId = 'npc_x';
    g.characters['npc_x'] = {
      id: 'npc_x', name: 'Jordan Vale', gender: 'm', age: 55, partyId: 'lab',
      officeId: 'leader', traits: [], competence: 60,
      avatar: g.player.avatar, active: true,
    };
    g.government.pmSinceDay = g.day + 100;
    const rebuilt = reconstructPmHistory(g);
    expect(rebuilt.length).toBeGreaterThanOrEqual(1);
    expect(rebuilt[rebuilt.length - 1].name).toBe('Jordan Vale');
    expect(rebuilt[rebuilt.length - 1].endDay).toBeNull();
  });
});

describe('expansion — favours', () => {
  it('grantFavour banks a favour against the named relationship', () => {
    const g = makeGame();
    const allyId = getRelationship(g, 'ally')!.characterId;
    applyEffects(g, { grantFavour: { kind: 'ally', note: 'owed one' } });
    expect(g.player.favours).toHaveLength(1);
    expect(g.player.favours[0].kind).toBe('ally');
    expect(g.player.favours[0].characterId).toBe(allyId);
    expect(g.player.favours[0].note).toBe('owed one');
  });
});

describe('expansion — scandal arc', () => {
  it('gates each beat by the scandal_stage flag', () => {
    const g = makeGame();
    const breakCard = byId('cr_arc_break');
    const investigation = byId('cr_arc_investigation');
    const resolution = byId('cr_arc_resolution');

    // no scandal yet: the opener is eligible, the beats are not
    expect(cardEligible(g, breakCard)).toBe(true);
    expect(cardEligible(g, investigation)).toBe(false);
    expect(cardEligible(g, resolution)).toBe(false);

    // stage 1: investigation surfaces, the opener is locked out
    g.player.flags.scandal_stage = 1;
    expect(cardEligible(g, breakCard)).toBe(false);
    expect(cardEligible(g, investigation)).toBe(true);
    expect(cardEligible(g, resolution)).toBe(false);

    // stage 2: only the resolution
    g.player.flags.scandal_stage = 2;
    expect(cardEligible(g, investigation)).toBe(false);
    expect(cardEligible(g, resolution)).toBe(true);
  });

  it('the opening beat sets the scandal flags', () => {
    const g = makeGame();
    const breakCard = byId('cr_arc_break');
    applyEffects(g, breakCard.choices[0].effects);
    expect(g.player.flags.scandal_stage).toBe(1);
    expect(g.player.flags.scandal).toBe(true);
  });
});

describe('expansion — active whipping', () => {
  it('rebelling on a three-line whip increments the rebellion count', () => {
    const g = makeGame();
    const before = g.player.rebellionCount;
    const whip = byId('whip_three_line');
    const rebel = whip.choices.find((c) => c.label.startsWith('Rebel'))!;
    applyEffects(g, rebel.effects);
    expect(g.player.rebellionCount).toBe(before + 1);
  });
});

describe('expansion — ministry focus', () => {
  it('has a department-gated focus card for every cabinet department, each banking its flag', async () => {
    const { MINISTRY_FOCUS_CARDS } = await import('../../content/cards/ministryFocus');
    expect(MINISTRY_FOCUS_CARDS.length).toBe(13);
    for (const card of MINISTRY_FOCUS_CARDS) {
      const dept = card.requires?.department?.[0];
      expect(dept).toBeTruthy();
      expect(card.requires?.minTier).toBe(4);
      expect(card.requires?.flags).toEqual({ [`focus_${dept}`]: false });
      // each choice writes a distinct focus_<dept> value
      card.choices.forEach((c, i) => {
        expect(c.effects.setFlags?.[`focus_${dept}`]).toBe(i + 1);
      });
    }
  });
});

describe('expansion — set-pieces', () => {
  it('budget runs as a three-step sequence that moves polling and logs a headline', () => {
    const g = makeGame();
    g.player.officeId = 'sos_treasury'; // the Chancellor's name goes on the headline
    const rng = new Rng(3);
    for (let step = 1; step <= 3; step++) {
      const card = materializeForced(g, rng, { kind: 'budget', payload: { step } });
      expect(card.kind).toBe('budget');
      expect(card.choices.length).toBeGreaterThanOrEqual(2);
      const out = resolveForcedChoice(g, rng, card, 0);
      expect(out.text).toBeTruthy();
    }
    expect(g.history.some((h) => h.kind === 'event' && /delivers the Budget/.test(h.headline))).toBe(true);
  });

  it('pmqs names the opposing leader and runs a two-step exchange', () => {
    const g = makeGame();
    g.player.officeId = 'leader'; // player is a leader → opponent is the other leader
    const rng = new Rng(5);
    const card = materializeForced(g, rng, { kind: 'pmqs', payload: { step: 1 } });
    expect(card.kind).toBe('pmqs');
    expect(card.choices.length).toBe(4);
    expect(resolveForcedChoice(g, rng, card, 0).text).toBeTruthy();
    const card2 = materializeForced(g, rng, { kind: 'pmqs', payload: { step: 2 } });
    expect(resolveForcedChoice(g, rng, card2, 2).text).toBeTruthy();
  });

  it('conference runs a three-beat speech and logs a headline', () => {
    const g = makeGame();
    const rng = new Rng(9);
    for (let step = 1; step <= 3; step++) {
      const card = materializeForced(g, rng, { kind: 'conference', payload: { step } });
      expect(card.kind).toBe('conference');
      resolveForcedChoice(g, rng, card, 0);
    }
    expect(g.history.some((h) => h.kind === 'event' && /addresses the party conference/.test(h.headline))).toBe(true);
  });

  it('the scheduler routes a due Budget to the multi-step set-piece for the Chancellor', () => {
    const g = makeGame();
    initCalendar(g);
    g.player.officeId = 'sos_treasury'; // Chancellor (player party governs in 2024)
    g.nextElectionBy = g.day + 1000;
    g.calendarDone.budget = g.day - 1; // force it due
    nextStep(g, new Rng(1));
    expect(g.currentCard?.kind).toBe('budget');
  });

  it('the scheduler routes a due conference to the keynote for a party leader', () => {
    const g = makeGame();
    initCalendar(g);
    g.player.officeId = 'leader';
    g.nextElectionBy = g.day + 1000;
    g.calendarDone.conference = g.day - 1;
    nextStep(g, new Rng(2));
    expect(g.currentCard?.kind).toBe('conference');
  });
});

describe('expansion — richer legacy', () => {
  it('returns rating, verdict, final stats and causes', () => {
    const g = makeGame();
    const legacy = buildLegacy(g);
    expect(legacy.rating).toBeTruthy();
    expect(legacy.verdict).toBeTruthy();
    expect(legacy.finalStats).toEqual(g.player.stats);
    expect(legacy.causes).toEqual(['publicServices']);
    expect(legacy.becamePM).toBe(false);
  });
});

describe('wave 12 — Treasury ladder & new offices', () => {
  it('places the Treasury sub-ladder at the right tiers and order', () => {
    expect(OFFICES.exchequer_sec.tier).toBe(3);
    expect(OFFICES.financial_sec.tier).toBe(3);
    expect(OFFICES.min_treasury.tier).toBe(3);
    expect(OFFICES.chief_sec.tier).toBe(4);
    expect(OFFICES.sos_treasury.tier).toBe(4);
    // Exchequer is the most junior tier-3 rung, Minister of State the most senior
    expect(OFFICES.exchequer_sec.rank!).toBeLessThan(OFFICES.financial_sec.rank!);
    expect(OFFICES.financial_sec.rank!).toBeLessThan(OFFICES.min_treasury.rank!);
    // the Chief Secretary sits below the Chancellor within the cabinet tier
    expect(OFFICES.chief_sec.rank!).toBeLessThan(OFFICES.sos_treasury.rank!);
  });

  it('capitalises the Parliamentary Aide title and adds Housing + territorial offices', () => {
    expect(OFFICES.pps.shadowTitle).toBe('Parliamentary Aide to the Leader');
    expect(OFFICES.sos_housing.tier).toBe(4);
    expect(OFFICES.min_housing.tier).toBe(3);
    expect(OFFICES.sos_scotland.region).toBe('scotland');
    expect(OFFICES.sos_wales.region).toBe('wales');
    expect(OFFICES.sos_ni.region).toBe('ni');
  });

  it('offers territorial Secretary of State only to a player from that nation', () => {
    const isTerritorial = (o: string | null) =>
      o === 'sos_scotland' || o === 'sos_wales' || o === 'sos_ni';

    const eng = makeGame();
    eng.player.region = 'yorkshire';
    eng.player.officeId = 'min_health'; // tier-3 minister, in line for promotion
    let englishTerritorial = 0;
    for (let i = 0; i < 400; i++) if (isTerritorial(nextOfficeFor(eng, new Rng(i)))) englishTerritorial++;
    expect(englishTerritorial).toBe(0);

    const scot = makeGame();
    scot.player.region = 'scotland';
    scot.player.officeId = 'min_health';
    let scottishTerritorial = 0;
    for (let i = 0; i < 400; i++) if (nextOfficeFor(scot, new Rng(i)) === 'sos_scotland') scottishTerritorial++;
    expect(scottishTerritorial).toBeGreaterThan(0);
  });
});

describe('wave 12 — end-screen stats & tie-break', () => {
  it('counts leadership contests fought (incl. losses) and elections won as leader', () => {
    const g = makeGame();
    g.history.push({ kind: 'leadershipContest', date: g.day, won: false, partyId: 'lab' });
    g.player.flags._electionsWonAsLeader = 2;
    const legacy = buildLegacy(g);
    expect(legacy.leadershipContestsFought).toBe(1);
    expect(legacy.leadershipContestsWon).toBe(0);
    expect(legacy.electionsWonAsLeader).toBe(2);
  });

  it('prefers government framing then great offices for the highest office', () => {
    // a shadow great office vs a government regular cabinet seat → government wins
    const g1 = makeGame();
    g1.history.push({ kind: 'roleChange', date: g1.day, officeId: 'sos_home', how: 'appointed', roleSide: 'opp', partyId: 'lab' });
    g1.history.push({ kind: 'roleChange', date: g1.day, officeId: 'sos_culture', how: 'appointed', roleSide: 'gov', partyId: 'lab' });
    expect(buildLegacy(g1).highestOfficeTitle).toContain('Culture Secretary');

    // two government cabinet seats → the great office of state wins
    const g2 = makeGame();
    g2.history.push({ kind: 'roleChange', date: g2.day, officeId: 'sos_culture', how: 'appointed', roleSide: 'gov', partyId: 'lab' });
    g2.history.push({ kind: 'roleChange', date: g2.day, officeId: 'sos_treasury', how: 'appointed', roleSide: 'gov', partyId: 'lab' });
    expect(buildLegacy(g2).highestOfficeTitle).toContain('Chancellor');
  });
});

describe('wave 13 — tuning & opposition heave', () => {
  function budgetCard(): DrawnCard {
    return {
      cardId: 'cal_budget_x', kind: 'calendar', title: 'Budget day', body: '',
      choices: [{ label: 'a' }, { label: 'b' }], payload: { calKey: 'budget' },
    };
  }
  function oppGame(seed = 11): GameState {
    return createNewGame({
      name: 'Opp MP', gender: 'm', age: 50, region: 'southEast',
      background: 'lawyer', partyId: 'con', // Labour governs in 2024 → Con is opposition
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      era: '2024', seed,
    });
  }

  it('stronger incumbent fatigue cuts a long-governing party\'s vote', () => {
    const fresh = makeGame(); fresh.government.termsInPower = 1;
    const tired = makeGame(); tired.government.termsInPower = 4;
    const a = runElection(fresh, new Rng(5)).result.voteShares.lab ?? 0;
    const b = runElection(tired, new Rng(5)).result.voteShares.lab ?? 0;
    expect(b).toBeLessThan(a - 0.03); // 4th-term Labour clearly down on a 1st-term run
  });

  it('the Budget card rewards championing in government but attacking in opposition', () => {
    const gov = makeGame(); // Labour player, in government
    const govOut = resolveCalendarChoice(gov, new Rng(1), budgetCard(), 0);
    expect(govOut.deltas.some((d) => d.label === 'Leader' && d.delta > 0)).toBe(true);

    const opp = oppGame();
    const oppOut = resolveCalendarChoice(opp, new Rng(1), budgetCard(), 0);
    expect(oppOut.deltas.some((d) => d.label === 'Profile' && d.delta > 0)).toBe(true);
  });

  it('lets an opposition MP move against their own (NPC) leader, but not the PM', () => {
    const opp = oppGame();
    const before = opp.player.stats.partyStanding;
    const out = callForLeaderResignationCore(opp, new Rng(3));
    expect(/leader|resign|no confidence/i.test(out.text)).toBe(true);
    expect(opp.player.stats.partyStanding).toBeLessThan(before); // it costs standing
    expect(opp.government.oppLeaderPressure ?? 0).toBeGreaterThan(0);

    // a government player has no opposition leader to move against
    const gov = makeGame();
    const noop = callForLeaderResignationCore(gov, new Rng(3));
    expect(noop.text).toContain('no leader of your party to move against');
  });
});

describe('wave 12 — Budget routes to the Chancellor, not the PM', () => {
  function dueBudget(g: GameState) {
    initCalendar(g);
    g.nextElectionBy = g.day + 1000;
    g.calendarDone.budget = g.day - 1;
  }

  it('the in-government Chancellor gets the multi-step set-piece', () => {
    const g = makeGame();
    g.player.officeId = 'sos_treasury'; // Labour governs in 2024 → in government
    dueBudget(g);
    nextStep(g, new Rng(1));
    expect(g.currentCard?.kind).toBe('budget');
  });

  it('a Prime Minister does not get the Budget set-piece', () => {
    const g = makeGame();
    g.player.officeId = 'leader';
    g.government.pmId = 'player';
    dueBudget(g);
    nextStep(g, new Rng(1));
    expect(g.currentCard?.kind).not.toBe('budget');
  });
});

describe('wave 14 — coalition junior partner & leader fixes', () => {
  // build a state where the player leads 'lab' as the JUNIOR partner under 'con',
  // with 'reform' as the largest party outside the government bloc
  function juniorGame(labSeats: number): GameState {
    const g = makeGame();
    const conLeader = g.government.loId; // con leads the opposition in 2024
    g.government.governingParty = 'con';
    g.government.pmId = conLeader;
    g.government.coalitionPartner = 'lab';
    g.government.arrangement = 'coalition';
    g.player.officeId = 'leader';
    g.seats = { con: 300, lab: labSeats, reform: 180, green: 10 };
    return g;
  }

  it('seats a significant junior partner as Deputy PM on the government side', () => {
    const g = juniorGame(40);
    seatPlayerJuniorPartner(g, new Rng(1));
    expect(g.government.pmId).not.toBe('player');         // the senior leader is PM
    expect(playerInGovernmentBloc(g)).toBe(true);
    expect(g.government.cabinet.some((p) => p.characterId === 'player')).toBe(true);
    expect(g.player.flags._isDeputyPM).toBe(true);
    expect(g.government.oppositionParty).toBe('reform');  // the 3rd party, not the player
    const title = playerOfficeTitle(g);
    expect(title).toContain('Deputy Prime Minister');
    expect(title).toContain('Leader of the');
  });

  it('gives a small junior partner a cabinet brief, still leading their party', () => {
    const g = juniorGame(8);
    seatPlayerJuniorPartner(g, new Rng(1));
    expect(g.player.flags._isDeputyPM).toBeFalsy();
    expect(g.government.cabinet.some((p) => p.characterId === 'player')).toBe(true);
    expect(playerOfficeTitle(g)).toMatch(/and Leader of the/);
  });

  it('will not make the Chief Secretary Deputy PM', () => {
    const g = makeGame();
    g.player.officeId = 'leader';
    g.government.pmId = 'player';
    const cs = g.government.cabinet.find((p) => p.officeId === 'chief_sec')!;
    setDeputyPmCore(g, new Rng(1), cs.characterId);
    expect(g.government.deputyPmId).not.toBe(cs.characterId);
    // a normal Secretary of State is fine
    const health = g.government.cabinet.find((p) => p.officeId === 'sos_health')!;
    setDeputyPmCore(g, new Rng(1), health.characterId);
    expect(g.government.deputyPmId).toBe(health.characterId);
  });

  it('a minor-party leader cannot sack the opposition shadow cabinet', () => {
    const g = makeGame();
    g.player.partyId = 'green'; // neither governing (lab) nor opposition (con)
    g.player.officeId = 'leader';
    const before = g.government.shadowCabinet.map((p) => p.characterId);
    sackMinisterCore(g, new Rng(1), 'sos_home');
    expect(g.government.shadowCabinet.map((p) => p.characterId)).toEqual(before);
  });

  it('end-screen verdict is grammatical and title-cased', () => {
    const g = makeGame();
    g.player.stats.profile = 80;
    g.player.stats.integrity = 80;
    const legacy = buildLegacy(g);
    expect(legacy.verdict).not.toMatch(/\bA a\b/);
    expect(legacy.verdict).toContain('Household Name');
  });
});

describe('wave 15 — backing a candidate in a leadership contest', () => {
  // two Labour candidates: A is overwhelmingly strong (always wins), B is weak.
  function labPair(g: GameState): [string, string] {
    const ids = Object.values(g.characters)
      .filter((c) => c.partyId === 'lab' && c.active && c.id !== 'player' && c.id !== g.government.pmId)
      .map((c) => c.id);
    return [ids[0], ids[1]];
  }
  function backOnce(backWinner: boolean): number {
    const g = makeGame();
    const [A, B] = labPair(g);
    g.forcedQueue.unshift({
      kind: 'leadershipBacking',
      payload: { party: 'lab', survivors: [A, B], strengths: { [A]: 100, [B]: 10 }, backing: {}, round: 1 },
    });
    const ev = g.forcedQueue.shift()!;
    const card = materializeForced(g, new Rng(2), ev);
    const backable = card.payload!.candidateIds as string[];
    const idx = backable.indexOf(backWinner ? A : B);
    resolveForcedChoice(g, new Rng(2), card, idx);
    const rel = getRelationship(g, 'leader')!;
    expect(rel.characterId).toBe(A); // the strong candidate always wins
    return rel.value;
  }

  it('backing the winner leaves a warmer relationship than backing their opponent', () => {
    const warm = backOnce(true);
    const cold = backOnce(false);
    expect(warm).toBeGreaterThan(cold);
    expect(warm).toBeGreaterThan(0);
  });

  it('a backing contest of any size always narrows to one installed leader', () => {
    const g = makeGame();
    const field = Object.values(g.characters)
      .filter((c) => c.partyId === 'lab' && c.active && c.id !== 'player' && c.id !== g.government.pmId)
      .slice(0, 5).map((c) => c.id);
    startBacking(g, new Rng(3), 'lab', field);
    let safety = 0;
    while (g.forcedQueue[0]?.kind === 'leadershipBacking' && safety++ < 20) {
      const ev = g.forcedQueue.shift()!;
      const card = materializeForced(g, new Rng(3 + safety), ev);
      resolveForcedChoice(g, new Rng(3 + safety), card, 0); // back the top contender each round
    }
    expect(g.forcedQueue.some((e) => e.kind === 'leadershipBacking')).toBe(false);
    expect(field).toContain(getRelationship(g, 'leader')!.characterId);
  });

  it('startBacking installs the lone survivor directly', () => {
    const g = makeGame();
    const only = Object.values(g.characters)
      .find((c) => c.partyId === 'lab' && c.active && c.id !== 'player' && c.id !== g.government.pmId)!.id;
    startBacking(g, new Rng(1), 'lab', [only]);
    expect(g.forcedQueue.some((e) => e.kind === 'leadershipBacking')).toBe(false);
    expect(getRelationship(g, 'leader')!.characterId).toBe(only);
  });
});

describe('wave 16 — fixes', () => {
  it('a 2024 seat map carries only Reform, never UKIP/Brexit', () => {
    const g = makeGame(); // 2024
    const seen = new Set<string>();
    for (const seat of g.seatMap) for (const p of Object.keys(seat.shares)) seen.add(p);
    expect(seen.has('ukip')).toBe(false);
    expect(seen.has('brexit')).toBe(false);
    expect(seen.has('reform')).toBe(true);
  });

  it('on a change of government the WINNING party leader becomes PM (not the old LO)', () => {
    const g = makeGame(); // lab governs, con is opposition
    const oldLoId = g.government.loId; // a Conservative
    // a third party (Lib Dems) wins the most seats outright
    const seats = { ld: 330, lab: 180, con: 110, sf: 7, spk: 1 } as Record<string, number>;
    g.seats = { ...seats };
    const result: ElectionResult = {
      id: 'e_test', date: g.day, seats: { ...seats },
      voteShares: { ld: 0.42, lab: 0.30, con: 0.22 },
      playerResult: null, outcome: 'majority', governingParty: 'ld', playerHeldSeat: false,
    };
    g.elections[result.id] = result;
    applyElectionAftermath(g, new Rng(2), result, false);
    expect(g.government.pmId).not.toBe(oldLoId);
    expect(g.characters[g.government.pmId]?.partyId).toBe('ld');
    expect(g.government.governingParty).toBe('ld');
  });

  it('buildLegacy reports whole years as PM from the player\'s tenures', () => {
    const g = makeGame();
    g.day = 5000;
    g.pmHistory = [
      { characterId: 'player', name: g.player.name, partyId: 'lab', startDay: 1000, endDay: 1800 },
      { characterId: 'player', name: g.player.name, partyId: 'lab', startDay: 4000, endDay: null },
    ];
    // becamePM is derived from history; force a becamePM roleChange so the field is populated
    g.history.push({ kind: 'roleChange', date: 1000, officeId: 'leader', how: 'becamePM', roleSide: 'gov', partyId: 'lab' });
    const legacy = buildLegacy(g);
    // 800 days + 1000 days = 1800 days -> 4 whole years
    expect(legacy.yearsAsPM).toBe(4);
    expect(legacy.pmStints).toBe(2);
  });
});
