import { describe, expect, it } from 'vitest';
import { GameState } from '../../types/game';
import {
  MAYORALTIES, mayoraltyById, mayoralVotingSystemAt, nextMayoralElection,
} from '../../data/mayoralties';
import { ALL_CARDS, MAYOR_CARDS } from '../../content/cards';
import { INTERLUDES } from '../scheduler';
import { cardEligible, resolveTokens } from '../cardEngine';
import { newTestGame as game, play } from '../../test/play';
import { pickSeatFor } from '../arena';
import { RETURN_OFFER_MIN_DAYS, mayorDraftTargets, mayoralResult, regionalStrength } from '../mayor';
import {
  becomeMayor, buildLegacy, materializeForced, playerStatusTitle,
} from '../career';
import { isoToDay } from '../clock';
import { Rng } from '../rng';

// the setup file turns the interludes off for every seeded test; this file is
// about them
INTERLUDES.mayorDraft = true;

function asMayor(seed: number, mayoralty = 'london'): { g: GameState; rng: Rng } {
  const g = game({ seed });
  const rng = new Rng(seed);
  becomeMayor(g, rng, mayoraltyById(mayoralty)!);
  return { g, rng };
}

const SCAN = /\{[a-zA-Z]+\}|undefined|\bNaN\b/;

describe('the mayoralties', () => {
  it('know their polling days, the four-year cycle and the successor office', () => {
    const gm = mayoraltyById('greaterManchester')!;
    expect(nextMayoralElection(gm, isoToDay('2018-01-01'))).toBe(isoToDay('2021-05-06'));
    expect(nextMayoralElection(gm, isoToDay('2022-01-01'))).toBe(isoToDay('2024-05-02'));
    expect(nextMayoralElection(gm, isoToDay('2024-06-01'))).toBe(isoToDay('2028-05-04'));
    expect(nextMayoralElection(mayoraltyById('london')!, isoToDay('2019-01-01'))).toBe(isoToDay('2021-05-06'));
    expect(nextMayoralElection(mayoraltyById('westOfEngland')!, isoToDay('2025-06-01'))).toBe(isoToDay('2029-05-03'));
    // the North of Tyne's mayor faced the North East's electorate next
    expect(nextMayoralElection(mayoraltyById('northOfTyne')!, isoToDay('2020-01-01'))).toBe(isoToDay('2024-05-02'));
    for (const m of MAYORALTIES) {
      for (let i = 1; i < m.elections.length; i++) expect(isoToDay(m.elections[i])).toBeGreaterThan(isoToDay(m.elections[i - 1]));
    }
  });

  it('switch voting systems with the Acts', () => {
    expect(mayoralVotingSystemAt(isoToDay('2021-05-06'))).toBe('sv');
    expect(mayoralVotingSystemAt(isoToDay('2024-05-02'))).toBe('fptp');
    expect(mayoralVotingSystemAt(isoToDay('2025-05-01'))).toBe('fptp');
    expect(mayoralVotingSystemAt(isoToDay('2028-05-04'))).toBe('sv');
  });
});

describe('the draft', () => {
  it('targets the mayoralty in the member’s own region with a poll in the window', () => {
    const g = game({ seed: 1, profile: 60 });
    g.day = isoToDay('2020-06-01');
    const targets = mayorDraftTargets(g);
    expect(targets.map((t) => t.mayoralty.id)).toEqual(['london']);
    expect(targets[0].pollingDay).toBe(isoToDay('2021-05-06'));
    // nothing to run for in the South East; a leader is not asked; nor is a nobody
    expect(mayorDraftTargets(game({ seed: 1, region: 'southEast', profile: 60 }))).toEqual([]);
    const leader = game({ seed: 1, profile: 60 });
    leader.day = g.day;
    leader.player.officeId = 'leader';
    expect(mayorDraftTargets(leader)).toEqual([]);
    const nobody = game({ seed: 1, profile: 30 });
    nobody.day = g.day;
    expect(mayorDraftTargets(nobody)).toEqual([]);
    // cabinet rank is a name in itself
    nobody.player.flags._peakTier = 4;
    expect(mayorDraftTargets(nobody).map((t) => t.mayoralty.id)).toEqual(['london']);
  });

  it('offers every mayoralty in a region that has two, not only the first listed', () => {
    const g = game({ seed: 1, region: 'northWest', profile: 60 });
    g.day = isoToDay('2020-06-01');
    expect(mayorDraftTargets(g).map((t) => t.mayoralty.id).sort()).toEqual(['greaterManchester', 'liverpoolCityRegion']);
    // and the draft picks between them: across careers, both come up
    const asked = new Set<string>();
    for (let seed = 1; seed <= 40 && asked.size < 2; seed++) {
      const career = game({ seed, region: 'northWest', profile: 60 });
      career.player.flags._peakTier = 4;
      play(career, new Rng(seed), 60, (cur, kind) => {
        if (kind !== 'mayorDraft') return 0;
        asked.add(String(cur.currentCard!.payload!.mayoralty));
        return 1;
      });
    }
    expect([...asked].sort()).toEqual(['greaterManchester', 'liverpoolCityRegion']);
  });

  it('asks a former cabinet minister more often than a backbencher', () => {
    const drafted = (peak: number) => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const g = game({ seed, profile: 60 });
        g.player.flags._peakTier = Math.max(Number(g.player.flags._peakTier ?? 0), peak);
        if (play(g, new Rng(seed), 60).includes('mayorDraft')) n++;
      }
      return n;
    };
    const backbench = drafted(0);
    const cabinet = drafted(4);
    expect(cabinet).toBeGreaterThan(backbench + 5);
    expect(cabinet).toBeGreaterThanOrEqual(20);
  });

  it('asks a well-known London MP in a good share of careers, and never with the interludes off', () => {
    // about eight eligible ticks in the window at MAYOR_DRAFT_CHANCE (0.06) each at
    // full regional strength: 1 - (1 - 0.06)^8 ≈ 0.39 of careers, so 15.6 ± 3.1 of 40
    const run = (on: boolean) => {
      INTERLUDES.mayorDraft = on;
      try {
        let drafted = 0;
        for (let seed = 1; seed <= 40; seed++) {
          const g = game({ seed, profile: 60 });
          if (play(g, new Rng(seed), 60).includes('mayorDraft')) drafted++;
        }
        return drafted;
      } finally {
        INTERLUDES.mayorDraft = true;
      }
    };
    expect(run(false)).toBe(0);
    const drafted = run(true);
    expect(drafted).toBeGreaterThanOrEqual(9);
    expect(drafted).toBeLessThanOrEqual(24);
  });

  it('a selected candidate fights the count on polling day and, winning, leaves the Commons', () => {
    let wins = 0;
    let fought = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const g = game({ seed, profile: 70 });
      g.day = isoToDay('2020-09-01');
      const pollingDay = isoToDay('2021-05-06');
      g.player.mayorCandidacy = { mayoralty: 'london', pollingDay };
      let countDay: number | null = null;
      play(g, new Rng(seed), 40, (s, kind) => {
        if (kind === 'mayorElection') countDay = s.day;
        return 0;
      }, () => countDay !== null); // stop once the count is in: the re-election is another story
      if (countDay === null) continue;
      fought++;
      expect(countDay).toBe(pollingDay);
      if (g.player.mayor) {
        wins++;
        expect(g.player.hasSeat).toBe(false);
        expect(g.player.seatId).toBe('');
        expect(g.player.mayorCandidacy).toBeUndefined();
        expect(g.seatMap.some((s) => s.isPlayerSeat)).toBe(false);
      } else {
        expect(g.player.hasSeat).toBe(true);
        expect(g.player.mayorCandidacy).toBeUndefined();
      }
    }
    expect(fought).toBeGreaterThanOrEqual(25);
    expect(wins).toBeGreaterThan(5);
    expect(wins).toBeLessThan(fought);
  });
});

describe('the count', () => {
  it('favours the party that holds the region and the candidate with a name', () => {
    const london = mayoraltyById('london')!;
    let labWins = 0;
    let greenWins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const g = game({ seed, profile: 80 });
      g.day = isoToDay('2021-05-06');
      const lab = mayoralResult(g, new Rng(seed), london, { incumbent: false });
      expect(lab.system).toBe('sv');
      expect(lab.finalRound).toBeDefined();
      expect(Math.abs(Object.values(lab.firstRound).reduce((a, b) => a + (b ?? 0), 0) - 1)).toBeLessThan(1e-9);
      if (lab.won) labWins++;
      const gg = game({ seed, partyId: 'green', profile: 50 });
      gg.day = isoToDay('2024-05-02');
      const green = mayoralResult(gg, new Rng(seed), london, { incumbent: false });
      expect(green.system).toBe('fptp');
      expect(green.finalRound).toBeUndefined();
      if (green.won) greenWins++;
    }
    expect(regionalStrength(game({ seed: 1 }), 'lab', 'london')).toBeGreaterThan(0.35);
    expect(labWins).toBeGreaterThan(25);
    expect(greenWins).toBeLessThan(4);
  });
});

describe('City Hall', () => {
  it('becoming mayor leaves no trace of the member in the House', () => {
    const g = game({ seed: 3 });
    const rng = new Rng(3);
    g.player.officeId = 'pps';
    becomeMayor(g, rng, mayoraltyById('london')!);
    expect(g.player.mayor).toEqual({
      mayoralty: 'london', since: g.day, nextElection: nextMayoralElection(mayoraltyById('london')!, g.day), electionsWon: 1,
    });
    expect(g.player.hasSeat).toBe(false);
    expect(g.player.seatId).toBe('');
    expect(g.player.officeId).toBeNull();
    expect(g.government.cabinet.some((p) => p.characterId === 'player')).toBe(false);
    expect(g.government.shadowCabinet.some((p) => p.characterId === 'player')).toBe(false);
    expect(g.seatMap.some((s) => s.isPlayerSeat)).toBe(false);
    expect(g.history.some((h) => h.kind === 'mayoralty' && h.action === 'start' && h.label === 'Mayor of London')).toBe(true);
    expect(playerStatusTitle(g)).toBe('Mayor of London');
    expect(resolveTokens(g, '{mayoralty} in {city}')).toBe('Mayor of London in London');
  });

  it('a general election while mayor is watched, not lost', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { g, rng } = asMayor(seed);
      g.player.mayor!.nextElection = g.day + 2000; // the re-election is not the question here
      g.nextElectionBy = g.day + 10;
      const kinds = play(g, rng, 12);
      expect(kinds).not.toContain('lostSeat');
      expect(kinds).not.toContain('mayorReturnOffer'); // the first two years are the city's
      expect(g.player.mayor).toBeDefined();
      expect(g.player.hasSeat).toBe(false);
      const entry = g.history.find((h) => h.kind === 'election');
      expect(entry && entry.kind === 'election' && entry.bystander).toBe(true);
      const result = Object.values(g.elections).find((e) => e.id === (entry as { resultId: string }).resultId);
      expect(result?.playerResult).toBeNull();
    }
  });

  it('the party offers a seat after two years, and the count decides the return', () => {
    let returned = 0;
    let stayed = 0;
    for (let seed = 1; seed <= 16; seed++) {
      // Labour holds London seats and mostly wins them back; a Green is given the
      // best of a bad lot and mostly stays at City Hall
      const g = game({ seed, partyId: seed % 2 === 0 ? 'lab' : 'green' });
      const rng = new Rng(seed);
      becomeMayor(g, rng, mayoraltyById('london')!);
      g.player.mayor!.since = g.day - Math.max(RETURN_OFFER_MIN_DAYS, 4 * 365); // a full term served
      g.player.mayor!.nextElection = g.day + 2000;
      g.nextElectionBy = g.day + 10;
      const before = { ...g.seats };
      let offered = false;
      play(g, rng, 14, (s, kind) => {
        if (kind === 'mayorReturnOffer') {
          offered = true;
          return 0;
        }
        if (kind === 'campaign' && s.player.mayor?.standingForSeat) {
          const seat = s.seatMap.find((x) => x.id === s.player.seatId);
          expect(seat?.region).toBe('london');
          expect(seat?.isPlayerSeat).toBe(true);
          expect(s.seats).toEqual(before); // a candidacy flips nothing
        }
        return 0;
      });
      expect(offered).toBe(true);
      expect(Object.keys(g.elections).length).toBeGreaterThan(0);
      if (g.player.hasSeat) {
        returned++;
        expect(g.player.mayor).toBeUndefined();
        expect(g.player.flags._incomingTier).toBe(4); // a full term served
        expect(g.player.flags._incomingDay).toBe(g.parliamentStart);
        expect(g.player.flags._seatSinceDay).toBe(g.parliamentStart);
        expect(g.player.flags._lastMayorDraftDay).toBe(g.parliamentStart); // not asked straight back
        expect(g.history.some((h) => h.kind === 'mayoralty' && h.action === 'end')).toBe(true);
      } else {
        stayed++;
        expect(g.player.mayor).toBeDefined();
        expect(g.player.mayor?.standingForSeat).toBeUndefined();
        expect(g.player.seatId).toBe('');
      }
    }
    expect(returned).toBeGreaterThan(0);
    expect(stayed).toBeGreaterThan(0);
  });

  it('the re-election comes round, and a lost one leaves a candidate in the wilderness', () => {
    let kept = 0;
    let lost = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const { g, rng } = asMayor(seed);
      g.player.stats.profile = seed % 2 === 0 ? 85 : 20;
      g.player.stats.constituencyApproval = seed % 2 === 0 ? 80 : 20;
      g.player.mayor!.nextElection = g.day + 70;
      const kinds = play(g, rng, 5);
      expect(kinds).toContain('mayorElection');
      if (g.player.mayor) {
        kept++;
        expect(g.player.mayor.electionsWon).toBe(2);
        expect(g.player.mayor.nextElection).toBeGreaterThan(g.day);
      } else {
        lost++;
        expect(kinds).toContain('lostMayoralty');
        expect(g.player.hasSeat).toBe(false);
        expect(g.player.seatId).not.toBe('');
        expect(g.seatMap.find((s) => s.id === g.player.seatId)?.isPlayerSeat).toBe(true);
        expect(g.gameOver).toBeNull();
        // the record comes with them: a minister's seniority for a part term, a fresh seat clock
        expect(g.player.flags._incomingTier).toBe(3);
        expect(typeof g.player.flags._seatSinceDay).toBe('number');
        // the wilderness runs to the next general election, and the count can bring them back
        const later = [...kinds, ...play(g, rng, 30)];
        expect(later).toContain('wilderness');
        expect(Object.keys(g.elections).length).toBeGreaterThan(0);
      }
    }
    expect(kept).toBeGreaterThan(0);
    expect(lost).toBeGreaterThan(0);
  });

  it('a candidacy marks a seat without flipping it', () => {
    const g = game({ seed: 4 });
    const seatsBefore = { ...g.seats };
    const snapshot = g.seatMap.map((s) => ({ id: s.id, winner: s.winner, shares: { ...s.shares } }));
    const id = pickSeatFor(g, new Rng(4), 'green', null, { region: 'london', byPartyStrength: true, candidateOnly: true });
    const seat = g.seatMap.find((s) => s.id === id)!;
    expect(seat.region).toBe('london');
    expect(seat.isPlayerSeat).toBe(true);
    expect(g.seats).toEqual(seatsBefore);
    for (const s of g.seatMap) {
      const was = snapshot.find((x) => x.id === s.id)!;
      expect(s.winner).toBe(was.winner);
      expect(s.shares).toEqual(was.shares);
    }
  });

  it('the deck is the mayor’s and nobody else’s', () => {
    expect(MAYOR_CARDS.length).toBeGreaterThanOrEqual(12);
    const { g } = asMayor(5);
    for (const card of ALL_CARDS) {
      expect(cardEligible(g, card)).toBe(card.requires?.mayor === true);
    }
    const mp = game({ seed: 5 });
    for (const card of MAYOR_CARDS) expect(cardEligible(mp, card)).toBe(false);
  });

  it('the chosen exit speaks of City Hall, and the legacy records the office', () => {
    const { g, rng } = asMayor(6);
    const card = materializeForced(g, rng, { kind: 'exitOffer', payload: { role: 'peerage' } });
    expect(card.choices[1].label).toBe('Stay at City Hall');
    expect(card.body).toContain('City Hall');
    g.day += 5 * 365;
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('Mayor of London');
    expect(legacy.wasMayor).toBe(true);
    expect(legacy.yearsAsMayor).toBe(5);
    expect(legacy.mayoralElectionsWon).toBe(1);
  });

  it('a long mayoralty reads cleanly: no stray tokens, no undefined, the world still turns', () => {
    const { g, rng } = asMayor(7, 'greaterManchester');
    const leadersBefore = { pm: g.government.pmId, lo: g.government.loId };
    let mayorCards = 0;
    play(g, rng, 250, (s, kind) => {
      const card = s.currentCard!;
      expect(card.title).not.toMatch(SCAN);
      expect(card.body).not.toMatch(SCAN);
      for (const c of card.choices) expect(c.label).not.toMatch(SCAN);
      if (kind === 'normal' && s.player.mayor) mayorCards++;
      if (kind === 'mayorReturnOffer') return 1; // stay
      if (kind === 'exitOffer') return 1;
      return 0;
    });
    expect(mayorCards).toBeGreaterThan(10);
    for (const h of g.history) if (h.kind === 'event') expect(h.headline).not.toMatch(SCAN);
    for (const v of Object.values(g.player.stats)) expect(Number.isNaN(v)).toBe(false);
    // somebody else's leadership changed hands while the player was away
    expect(g.government.pmId !== leadersBefore.pm || g.government.loId !== leadersBefore.lo).toBe(true);
  });
});
