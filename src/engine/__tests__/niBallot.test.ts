import { describe, expect, it } from 'vitest';
import { Era, GameState, PartyId } from '../../types/game';
import {
  abstainsIn, counterpartParty, outsidePartyPolitics, PARTIES, playablePartiesFor,
} from '../../data/parties';
import { PLAYER_REGIONS } from '../../data/regions';
import { NI_CONSTITUENCIES, NI_WESTMINSTER, niConstituencyName } from '../../data/niWestminster';
import { OFFICES } from '../../data/offices';
import { createNewGame, SAVE_VERSION } from '../newGame';
import { dressNiSeats } from '../../generation/constituency';
import { runElection } from '../election';
import { onNiBallot, partyPolling, partyPollingShare, updatePolling } from '../polling';
import { applyPollingShock } from '../effects';
import { initCalendar, nextStep } from '../scheduler';
import { acknowledgeElectionCore, continueCore, resolveChoiceCore } from '../turn';
import { seatsForMajorityIn, votingSeatsIn } from '../seats';
import { migrateGameState } from '../../store/gameStore';
import { isoToDay } from '../clock';
import { Rng } from '../rng';

const NI_PARTIES: PartyId[] = ['dup', 'sf', 'sdlp', 'uup', 'alliance'];

function game(opts: { seed: number; era: Era; partyId?: PartyId; region?: GameState['player']['region'] }): GameState {
  return createNewGame({
    name: 'Test Subject', gender: 'f', age: 40, region: opts.region ?? 'ni', background: 'lawyer',
    partyId: opts.partyId ?? 'alliance',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: opts.era, seed: opts.seed,
  });
}

describe('Northern Ireland at Westminster: parties and regions', () => {
  it('offers the four NI parties, never Sinn Féin, and only in Northern Ireland', () => {
    for (const era of ['2010', '2015', '2017', '2019', '2024'] as Era[]) {
      const all = playablePartiesFor(era);
      expect(all).toEqual(expect.arrayContaining(['dup', 'uup', 'sdlp', 'alliance']));
      expect(all).not.toContain('sf');
      expect(all).not.toContain('tuv');
      expect(playablePartiesFor(era, 'ni')).toEqual(['dup', 'uup', 'sdlp', 'alliance']);
      expect(playablePartiesFor(era, 'london')).not.toContain('dup');
    }
    expect(PLAYER_REGIONS).toContain('ni');
  });

  it('abstention is a Commons fact and a Stormont irrelevance', () => {
    expect(abstainsIn('sf', 'uk')).toBe(true);
    expect(abstainsIn('sf', undefined)).toBe(true);
    expect(abstainsIn('sf', 'scotland')).toBe(false);
    expect(abstainsIn('dup', 'uk')).toBe(false);
    expect(outsidePartyPolitics('sf', 'uk')).toBe(true);
    expect(outsidePartyPolitics('tuv', 'uk')).toBe(true);
    expect(outsidePartyPolitics('sgp', 'uk')).toBe(true);
    expect(outsidePartyPolitics('sgp', 'scotland')).toBe(false);
    expect(outsidePartyPolitics('dup', 'uk')).toBe(false);
    expect(outsidePartyPolitics('spk', 'uk')).toBe(true);
    expect(outsidePartyPolitics('ind', 'wales')).toBe(true);
    expect(counterpartParty('sf', 'uk')).toBeNull();
    expect(counterpartParty('dup', 'uk')).toBe('dup');
  });

  it('seat maths exclude Sinn Féin at Westminster and nobody in a devolved chamber', () => {
    const seats: Partial<Record<PartyId, number>> = { lab: 400, con: 200, sf: 7, spk: 1, snp: 42 };
    expect(votingSeatsIn(seats, 'uk')).toBe(642);
    expect(seatsForMajorityIn(seats, 'uk')).toBe(322);
    expect(votingSeatsIn(seats, 'scotland')).toBe(649);
    // a devolved chamber (the Assembly arrives in P2; any devolved arena shows the rule)
    expect(votingSeatsIn({ sf: 27, dup: 25 }, 'scotland')).toBe(52);
  });
});

describe('Northern Ireland at Westminster: the seats', () => {
  for (const era of ['2010', '2015', '2017', '2019', '2024'] as Era[]) {
    it(`${era}: the eighteen NI seats carry the real names and winners, on the five-party ballot`, () => {
      const g = game({ seed: 5, era, partyId: 'con', region: 'london' });
      const ni = g.seatMap.filter((s) => s.region === 'ni');
      expect(ni).toHaveLength(18);
      const day = isoToDay(NI_WESTMINSTER[era].election);
      const realNames = NI_CONSTITUENCIES.map((c) => niConstituencyName(c, day));
      expect(ni.map((s) => s.name).sort()).toEqual([...realNames].sort());
      const byName = new Map(ni.map((s) => [s.name, s]));
      for (const c of NI_CONSTITUENCIES) {
        const seat = byName.get(niConstituencyName(c, day))!;
        const real = NI_WESTMINSTER[era].winners[c.id];
        const expected = PARTIES[real].devolvedOnly ? 'ind' : real;
        expect(seat.winner, c.name).toBe(expected);
        // the winner leads its own seat
        const best = (Object.keys(seat.shares) as PartyId[])
          .reduce((a, p) => ((seat.shares[p] ?? 0) > (seat.shares[a] ?? 0) ? p : a), seat.winner);
        expect(best, c.name).toBe(seat.winner);
        for (const p of Object.keys(seat.shares) as PartyId[]) {
          expect([...NI_PARTIES, 'ind'], `${c.name} has key ${p}`).toContain(p);
        }
      }
    });
  }

  it('dressing the seats draws nothing and adds no share key', () => {
    const g = game({ seed: 9, era: '2019', partyId: 'lab', region: 'london' });
    const before = g.seatMap.filter((s) => s.region === 'ni')
      .map((s) => ({ id: s.id, keys: Object.keys(s.shares), baseKeys: Object.keys(s.base ?? {}) }));
    dressNiSeats(g.seatMap, '2019');
    const after = g.seatMap.filter((s) => s.region === 'ni')
      .map((s) => ({ id: s.id, keys: Object.keys(s.shares), baseKeys: Object.keys(s.base ?? {}) }));
    expect(after).toEqual(before);
    for (const s of g.seatMap.filter((x) => x.region === 'ni')) {
      const sum = Object.values(s.shares).reduce((a, b) => a + (b ?? 0), 0);
      expect(sum).toBeCloseTo(1, 6);
    }
  });

  it('an NI player sits for a real Northern Ireland seat held by their party', () => {
    const g = game({ seed: 3, era: '2024', partyId: 'uup' });
    const seat = g.seatMap.find((s) => s.id === g.player.seatId)!;
    expect(seat.region).toBe('ni');
    expect(seat.winner).toBe('uup');
    expect(seat.name).toBe('South Antrim');
    expect(g.player.region).toBe('ni');
  });
});

describe('Northern Ireland at Westminster: the ballot', () => {
  it('every Commons start carries an NI ballot at its era anchor, normalised over five parties', () => {
    const g = game({ seed: 1, era: '2017', partyId: 'con', region: 'london' });
    const ni = g.polling.ni!;
    expect(ni.parties).toEqual(NI_PARTIES);
    const sum = ni.parties.reduce((a, p) => a + (ni.shares[p] ?? 0), 0);
    expect(sum).toBeCloseTo(1, 9);
    expect(ni.shares.dup).toBeGreaterThan(ni.shares.sf!);
    expect(g.pollHistory[0].ni).toBeDefined();
    expect(partyPollingShare(g, 'dup')).toBeCloseTo(ni.shares.dup!, 9);
    expect(partyPollingShare(g, 'con')).toBeCloseTo(g.polling.shares.con!, 9);
    expect(partyPolling(g, 'dup')).toBeGreaterThan(20);
    expect(onNiBallot(g)).toBe(false);
    const niMp = game({ seed: 1, era: '2017', partyId: 'dup' });
    expect(onNiBallot(niMp)).toBe(true);
    // an NI member who sits as an independent still reads Northern Ireland's polls
    niMp.player.partyId = 'ind';
    expect(onNiBallot(niMp)).toBe(true);
  });

  it('the ballot remembers its last result and reverts toward it', () => {
    const g = game({ seed: 21, era: '2019', partyId: 'con', region: 'london' });
    const rng = new Rng(g.rngState);
    g.day = g.nextElectionBy;
    updatePolling(g, rng, g.day);
    const { result } = runElection(g, rng);
    expect(g.polling.ni!.lastResult).toEqual(result.regionalShares!.ni);
  });

  it('a shock to an NI party moves the NI ballot and leaves the GB poll untouched', () => {
    const g = game({ seed: 2, era: '2019', partyId: 'alliance' });
    const gbBefore = { ...g.polling.shares };
    const dupBefore = g.polling.ni!.shares.dup!;
    applyPollingShock(g, 'dup', 3);
    expect(g.polling.shares).toEqual(gbBefore);
    expect(g.polling.ni!.shares.dup).toBeGreaterThan(dupBefore);
    const sum = NI_PARTIES.reduce((a, p) => a + (g.polling.ni!.shares[p] ?? 0), 0);
    expect(sum).toBeCloseTo(1, 9);
    // and a GB shock leaves the NI ballot alone
    const niBefore = { ...g.polling.ni!.shares };
    applyPollingShock(g, 'lab', -2);
    expect(g.polling.ni!.shares).toEqual(niBefore);
  });

  it('the NI ballot walks on its own stream and the GB stream is not consumed by it', () => {
    const a = game({ seed: 4, era: '2015', partyId: 'con', region: 'london' });
    const b = game({ seed: 4, era: '2015', partyId: 'con', region: 'london' });
    delete b.polling.ni; // a save from before the ballot existed
    const ra = new Rng(a.rngState);
    const rb = new Rng(b.rngState);
    updatePolling(a, ra, a.day + 400);
    updatePolling(b, rb, b.day + 400);
    expect(ra.state).toBe(rb.state);
    expect(a.polling.shares).toEqual(b.polling.shares);
    expect(b.polling.ni, 'the ballot is created at birth or on load, never on the fly').toBeUndefined();
    expect(a.polling.ni!.rngState).not.toBe(game({ seed: 4, era: '2015', partyId: 'con', region: 'london' }).polling.ni!.rngState);
  });

  it('NI seats swing with their own ballot at a general election, within a plausible band', () => {
    let dup = 0, sf = 0, n = 0;
    for (let i = 0; i < 40; i++) {
      const g = game({ seed: 7000 + i, era: '2017', partyId: 'con', region: 'london' });
      const rng = new Rng(g.rngState);
      g.day = g.nextElectionBy;
      updatePolling(g, rng, g.day);
      const { result } = runElection(g, rng);
      const niSeats = NI_PARTIES.reduce((a, p) => a + (result.seats[p] ?? 0), 0) + (result.seats.ind ?? 0);
      expect(niSeats).toBe(18);
      expect(result.regionalShares?.ni).toBeDefined();
      const niSum = NI_PARTIES.reduce((a, p) => a + (result.regionalShares!.ni![p] ?? 0), 0);
      expect(niSum).toBeCloseTo(1, 6);
      dup += result.seats.dup ?? 0;
      sf += result.seats.sf ?? 0;
      n++;
    }
    // from the 2017 anchor (DUP 10, SF 7) after a five-year walk on a 36/29 vote:
    // the means should sit near the anchor, with real movement in either direction
    expect(dup / n).toBeGreaterThan(6);
    expect(dup / n).toBeLessThan(11.5);
    expect(sf / n).toBeGreaterThan(4.5);
    expect(sf / n).toBeLessThan(9);
  });
});

describe('Northern Ireland at Westminster: a career', () => {
  it('an Alliance MP plays 250 turns on the minor-party track with clean prose', () => {
    const g = game({ seed: 77, era: '2019', partyId: 'alliance' });
    initCalendar(g);
    const rng = new Rng(g.rngState);
    nextStep(g, rng);
    const allowed = /^(min_|whip$|chiefWhip$|leader$|pps$)/;
    let shown = 0;
    for (let turn = 0; turn < 250 && !g.gameOver; turn++) {
      if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
      const card = g.currentCard;
      if (!card) { nextStep(g, rng); continue; }
      const text = `${card.title} ${card.body} ${card.choices.map((c) => c.label).join(' ')}`;
      expect(text, `${card.kind} turn ${turn}`).not.toMatch(/\{[a-zA-Z]+\}|undefined|\bthe the\b/);
      shown++;
      resolveChoiceCore(g, rng, 0);
      const out = g.currentCard?.outcome?.text ?? '';
      expect(out, `${card.kind} outcome turn ${turn}`).not.toMatch(/\{[a-zA-Z]+\}|undefined/);
      if (g.pendingElectionId) { acknowledgeElectionCore(g, rng); continue; }
      continueCore(g, rng);
      if (g.player.officeId) {
        expect(g.player.officeId, `office at turn ${turn}`).toMatch(allowed);
        expect(OFFICES[g.player.officeId].tier).toBeLessThanOrEqual(5);
      }
      expect(g.government.governingParty).not.toBe('alliance');
    }
    expect(shown).toBeGreaterThan(50);
  });
});

describe('Northern Ireland at Westminster: saves', () => {
  it('a v10 Commons save gains the NI ballot on load', () => {
    const g = game({ seed: 12, era: '2015', partyId: 'lab', region: 'london' });
    const raw = JSON.parse(JSON.stringify(g)) as GameState;
    delete raw.polling.ni;
    raw.version = 10;
    const m = migrateGameState(raw);
    expect(m.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(11);
    expect(m.polling.ni?.parties).toEqual(NI_PARTIES);
    expect(m.polling.ni?.anchor.dup).toBeCloseTo(g.polling.ni!.anchor.dup!, 9);
  });

  it('a v10 Holyrood save gains the NI ballot on its dormant Commons', () => {
    const g = createNewGame({
      name: 'Test Subject', gender: 'm', age: 40, region: 'scotland', background: 'lawyer',
      partyId: 'snp', arena: 'scotland', devolvedElection: '2016-05-05',
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      era: '2015', seed: 13,
    });
    const raw = JSON.parse(JSON.stringify(g)) as GameState;
    expect(raw.arena).toBe('scotland');
    delete raw.dormant.uk!.polling.ni;
    raw.version = 10;
    const m = migrateGameState(raw);
    expect(m.polling.ni).toBeUndefined();
    expect(m.dormant.uk!.polling.ni?.parties).toEqual(NI_PARTIES);
  });
});
