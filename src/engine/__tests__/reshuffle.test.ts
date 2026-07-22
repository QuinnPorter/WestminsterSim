import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  benchPoolFor, sackMinisterCore, openPlayerReshuffle, resolveForcedChoice,
  cabinetStrength, cabinetLoyalty, cabinetAuthorityPressure, playerControlsOwnBench,
} from '../career';
import { GameState, Character, PartyId, OfficeId } from '../../types/game';
import { CABINET_OFFICES } from '../../data/offices';
import { Rng } from '../rng';

function makeGame(seed = 7): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 44, region: 'yorkshire',
    background: 'teacher', partyId: 'lab',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2024', seed, causes: ['publicServices'],
  };
  return createNewGame(input);
}

/** make the player the sitting PM of their (governing) party */
function makePlayerPm(g: GameState): void {
  g.player.officeId = 'leader';
  g.government.pmId = 'player';
}

/** drop `n` named backbenchers of a party into the character pool */
function seedBackbenchers(g: GameState, party: PartyId, specs: Partial<Character>[]): Character[] {
  const made: Character[] = [];
  specs.forEach((spec, i) => {
    const id = `bench_${party}_${i}`;
    const c: Character = {
      name: `Bench ${i}`, gender: 'm', age: 50,
      traits: ['loyal'], competence: 60, loyalty: 0,
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      ...spec,
      id, partyId: party, officeId: null, active: true,
    };
    g.characters[id] = c;
    made.push(c);
  });
  return made;
}

describe('named bench pool & appointments', () => {
  it('benchPoolFor returns active, unseated, same-party MPs only', () => {
    const g = makeGame();
    seedBackbenchers(g, 'lab', [{ competence: 70 }, { competence: 50 }]);
    // a seated cabinet member is NOT in the pool
    const seatedId = g.government.cabinet.find((p) => p.characterId !== 'player')!.characterId;
    const pool = benchPoolFor(g, 'lab');
    expect(pool.some((c) => c.id === seatedId)).toBe(false);
    expect(pool.filter((c) => c.id.startsWith('bench_lab_'))).toHaveLength(2);
    // no other-party members
    expect(pool.every((c) => c.partyId === 'lab')).toBe(true);
  });

  it('sacking seats the named replacement and drops the sacked minister into the pool', () => {
    const g = makeGame();
    makePlayerPm(g);
    const [heir] = seedBackbenchers(g, 'lab', [{ competence: 80, loyalty: 30 }]);
    const post = g.government.cabinet.find((p) => p.officeId === 'sos_home')!;
    const sackedId = post.characterId;
    sackMinisterCore(g, new Rng(1), 'sos_home', heir.id);
    // the named heir now holds the office…
    expect(g.government.cabinet.find((p) => p.officeId === 'sos_home')!.characterId).toBe(heir.id);
    expect(g.characters[heir.id].officeId).toBe('sos_home');
    // …and the sacked minister is a resentful backbencher back in the pool
    const sacked = g.characters[sackedId];
    expect(sacked.officeId).toBeNull();
    expect(sacked.active).toBe(true);
    expect((sacked.loyalty ?? 0)).toBeLessThan(0);
    expect(benchPoolFor(g, 'lab').some((c) => c.id === sackedId)).toBe(true);
  });

  it('sacking without a named pick promotes from the existing pool, not a stranger', () => {
    const g = makeGame();
    makePlayerPm(g);
    seedBackbenchers(g, 'lab', [{ competence: 85, loyalty: 10 }]);
    const before = new Set(Object.keys(g.characters));
    sackMinisterCore(g, new Rng(3), 'sos_health');
    const newHolder = g.government.cabinet.find((p) => p.officeId === 'sos_health')!.characterId;
    // the promoted minister is a pre-existing named MP, not a freshly minted NPC
    expect(before.has(newHolder)).toBe(true);
  });
});

describe('player-led reshuffle', () => {
  it('opens a decision card for a sitting PM but not for a minor-party leader', () => {
    const g = makeGame();
    makePlayerPm(g);
    expect(playerControlsOwnBench(g)).toBe(true);
    openPlayerReshuffle(g, new Rng(1));
    expect(g.currentCard?.kind).toBe('playerReshuffle');

    const g2 = makeGame();
    g2.player.partyId = 'green'; // neither governing nor official opposition
    g2.player.officeId = 'leader';
    expect(playerControlsOwnBench(g2)).toBe(false);
    openPlayerReshuffle(g2, new Rng(1));
    expect(g2.currentCard).toBeFalsy();
  });

  it('a broad reshuffle drops 40–60% of the bench to the backbenches', () => {
    const g = makeGame();
    makePlayerPm(g);
    // a deep pool so replacements come from real MPs
    seedBackbenchers(g, 'lab', Array.from({ length: 14 }, (_, i) => ({ competence: 55 + (i % 20), loyalty: i % 2 ? 20 : -10 })));
    const before = g.government.cabinet
      .filter((p) => p.characterId !== 'player' && g.characters[p.characterId]?.partyId === 'lab')
      .map((p) => p.characterId);

    openPlayerReshuffle(g, new Rng(5));
    const card = g.currentCard!;
    // choice 1 = "Promote on merit" (a broad reshuffle)
    resolveForcedChoice(g, new Rng(5), card, 1);

    // measure the deliberate churn: ministers dropped to the backbenches (officeId null).
    // (laterals move sitting ministers between seats, so counting changed SEATS would
    // over-count; the count of dropped ministers is exactly the churn set.)
    const dropped = before.filter((id) => g.characters[id]?.officeId == null).length;
    const frac = dropped / before.length;
    expect(frac).toBeGreaterThanOrEqual(0.35);
    expect(frac).toBeLessThanOrEqual(0.62);
  });

  it('a merit reshuffle promotes sitting ministers laterally, not only fresh blood', () => {
    // make the great offices weak (so they get churned) and seat strong ministers in
    // ordinary briefs (so they are the ones elevated) — plus a deep bench to backfill
    const weaken = ['sos_treasury', 'sos_home', 'sos_foreign'];
    const strengthen = ['sos_health', 'sos_education', 'sos_defence'];
    const setup = (g: GameState) => {
      makePlayerPm(g);
      for (const p of g.government.cabinet) {
        const c = g.characters[p.characterId];
        if (!c || c.partyId !== 'lab') continue;
        if (weaken.includes(p.officeId)) { c.competence = 30; c.loyalty = -10; }
        else if (strengthen.includes(p.officeId)) { c.competence = 90; c.loyalty = 40; }
        else c.competence = 55;
      }
      seedBackbenchers(g, 'lab', Array.from({ length: 12 }, (_, i) => ({ competence: 50 + (i % 10), loyalty: 5 })));
    };

    // try a few seeds so the (probabilistic) lateral is exercised deterministically
    let sawLateral = false;
    for (let seed = 1; seed <= 8 && !sawLateral; seed++) {
      const g = makeGame();
      setup(g);
      const snap = new Map<string, string | null>();
      for (const p of g.government.cabinet) snap.set(p.characterId, g.characters[p.characterId]?.officeId ?? null);
      openPlayerReshuffle(g, new Rng(seed));
      resolveForcedChoice(g, new Rng(seed), g.currentCard!, 1);
      // a lateral: a character who held one cabinet office before and a DIFFERENT one now
      sawLateral = [...snap.entries()].some(([id, was]) => {
        const now = g.characters[id]?.officeId ?? null;
        return was != null && now != null && was !== now
          && CABINET_OFFICES.includes(now as OfficeId);
      });
    }
    expect(sawLateral).toBe(true);
  });

  it('a reshuffle never leaves a seat empty or double-booked', () => {
    const g = makeGame();
    makePlayerPm(g);
    seedBackbenchers(g, 'lab', Array.from({ length: 10 }, (_, i) => ({ competence: 60 + (i % 15), loyalty: i % 2 ? 20 : -20 })));
    openPlayerReshuffle(g, new Rng(3));
    resolveForcedChoice(g, new Rng(3), g.currentCard!, 1);
    const holders = g.government.cabinet.map((p) => p.characterId);
    // every cabinet office is filled, and no character holds two seats
    expect(holders.every((id) => id === 'player' || !!g.characters[id])).toBe(true);
    expect(new Set(holders).size).toBe(holders.length);
    // every seated minister's officeId matches the seat they occupy
    for (const p of g.government.cabinet) {
      if (p.characterId === 'player') continue;
      expect(g.characters[p.characterId]?.officeId).toBe(p.officeId);
    }
  });

  it('the "hold off" choice leaves the bench untouched', () => {
    const g = makeGame();
    makePlayerPm(g);
    seedBackbenchers(g, 'lab', [{ competence: 70 }]);
    openPlayerReshuffle(g, new Rng(2));
    const card = g.currentCard!;
    const before = g.government.cabinet.map((p) => p.characterId);
    // hold-off is the last choice
    resolveForcedChoice(g, new Rng(2), card, card.choices.length - 1);
    expect(g.government.cabinet.map((p) => p.characterId)).toEqual(before);
  });
});

describe('cabinet composition consequences', () => {
  it('a strong, loyal cabinet shields the leader; a weak, mutinous one exposes them', () => {
    const g = makeGame();
    makePlayerPm(g);
    // make the whole own-party cabinet able and loyal
    for (const p of g.government.cabinet) {
      const c = g.characters[p.characterId];
      if (c && c.partyId === 'lab') { c.competence = 85; c.loyalty = 60; }
    }
    expect(cabinetStrength(g)).toBeGreaterThan(70);
    expect(cabinetLoyalty(g)).toBeGreaterThan(30);
    expect(cabinetAuthorityPressure(g)).toBeLessThan(0);

    // now make them weak and disloyal
    for (const p of g.government.cabinet) {
      const c = g.characters[p.characterId];
      if (c && c.partyId === 'lab') { c.competence = 35; c.loyalty = -50; }
    }
    expect(cabinetAuthorityPressure(g)).toBeGreaterThan(0);
  });
});
