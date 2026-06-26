import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  buildLegacy, startBacking, materializeForced, resolveForcedChoice,
} from '../career';
import { OFFICES, CABINET_OFFICES } from '../../data/offices';
import { Rng } from '../rng';
import { GameState, OfficeId } from '../../types/game';

function makeGame(seed = 1): GameState {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 48, region: 'southEast',
    background: 'lawyer', partyId: 'con',
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

/** push a government roleChange so buildLegacy credits the player with an office */
function holdOffice(g: GameState, officeId: OfficeId) {
  g.history.push({ kind: 'roleChange', date: g.day, officeId, how: 'appointed', roleSide: 'gov' });
}

describe('Science & Technology department', () => {
  it('mints a Minister of State (tier 3) and Secretary (tier 4) with the right titles', () => {
    expect(OFFICES.min_scienceTech.tier).toBe(3);
    expect(OFFICES.min_scienceTech.title).toBe('Minister of State for Science and Technology');
    expect(OFFICES.sos_scienceTech.tier).toBe(4);
    expect(OFFICES.sos_scienceTech.title).toBe('Science Secretary');
    expect(OFFICES.sos_scienceTech.shadowTitle).toBe('Shadow Science Secretary');
  });

  it('is part of the cabinet and is seated in a fresh game (gov + shadow)', () => {
    expect(CABINET_OFFICES).toContain('sos_scienceTech');
    const g = makeGame();
    expect(g.government.cabinet.some((p) => p.officeId === 'sos_scienceTech')).toBe(true);
    expect(g.government.shadowCabinet.some((p) => p.officeId === 'sos_scienceTech')).toBe(true);
  });
});

describe('end-screen titling', () => {
  it('a Minister of State reads "Junior Minister" (tag stays Minister)', () => {
    const g = makeGame();
    holdOffice(g, 'min_health');
    const legacy = buildLegacy(g);
    expect(legacy.rating).toBe('Minister');
    expect(legacy.verdict).toContain('Junior Minister');
  });

  it('a Chief Whip is below cabinet: own title, "Senior Minister" rating, no "cabinet minister"', () => {
    const g = makeGame();
    holdOffice(g, 'chiefWhip');
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('Chief Whip');
    expect(legacy.highestOfficeTitle).not.toContain('Cabinet —');
    expect(legacy.rating).toBe('Senior Minister');
    expect((legacy.verdict ?? '').toLowerCase()).toContain('chief whip');
    expect((legacy.verdict ?? '').toLowerCase()).not.toContain('cabinet minister');
  });

  it('a real Secretary of State still reads "Cabinet — …"', () => {
    const g = makeGame();
    holdOffice(g, 'sos_health');
    const legacy = buildLegacy(g);
    expect(legacy.highestOfficeTitle).toBe('Cabinet — Health Secretary');
    expect(legacy.rating).toBe('Heavyweight');
  });
});

describe('dynamic backing tally', () => {
  it('the MP counts sum to the party seats every round and the field narrows', () => {
    const g = makeGame();
    const rng = new Rng(7);
    g.seats = { con: 120, lab: 100 };
    const ids = ['k1', 'k2', 'k3', 'k4', 'k5'];
    ids.forEach((id, i) => {
      g.characters[id] = {
        id, name: `Cand ${i}`, gender: 'm', age: 50, partyId: 'con',
        officeId: 'min_health', traits: [], competence: 45 + i * 6,
        avatar: g.player.avatar, active: true,
      };
    });
    startBacking(g, rng, 'con', ids);

    const sums: number[] = [];
    const fieldSizes: number[] = [];
    let guard = 0;
    let ev = g.forcedQueue.shift();
    while (ev && ev.kind === 'leadershipBacking' && guard++ < 12) {
      const card = materializeForced(g, rng, ev);
      const counts = card.choices.map((c) => {
        const m = (c.sublabel ?? '').match(/(\d+) MP/);
        return m ? Number(m[1]) : 0;
      });
      sums.push(counts.reduce((a, b) => a + b, 0));
      fieldSizes.push(card.choices.length);
      resolveForcedChoice(g, rng, card, 0); // back the front-runner
      ev = g.forcedQueue.shift();
    }

    expect(sums.length).toBeGreaterThan(1);
    for (const s of sums) expect(s).toBe(120); // always equals the party's seats
    // each round shows fewer candidates than the last (eliminated ones redistribute)
    for (let i = 1; i < fieldSizes.length; i++) {
      expect(fieldSizes[i]).toBeLessThan(fieldSizes[i - 1]);
    }
  });
});
