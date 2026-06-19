import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { openLeadershipVacancy, giveOffice, reconcileCharacterOffices } from '../career';
import { OFFICES } from '../../data/offices';
import { Rng } from '../rng';
import { Era, PartyId } from '../../types/game';

function makeGame(partyId: PartyId, era: Era, seed: number) {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 45, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era, seed,
  };
  return createNewGame(input);
}

describe('wave 23 — ghost ministers', () => {
  it('giveOffice nulls the office of the NPC the player displaces', () => {
    const g = makeGame('lab', '2024', 3); // Labour governs in 2024 → player on the cabinet track
    const post = g.government.cabinet.find((p) => p.officeId === 'sos_health')!;
    const npcId = post.characterId;
    expect(g.characters[npcId].officeId).toBe('sos_health');

    giveOffice(g, new Rng(1), 'sos_health', 'promoted');

    expect(post.characterId).toBe('player');
    expect(g.characters[npcId].officeId).toBeNull(); // no longer a "ghost" Health Secretary
    expect(g.characters[npcId].active).toBe(true);   // they're a backbencher now, not retired
  });

  it('reconcileCharacterOffices clears ghosts but keeps real holders and spokespeople', () => {
    const g = makeGame('lab', '2024', 5);
    const tmpl = Object.values(g.characters)[0];
    g.characters['ghost_test'] = { ...tmpl, id: 'ghost_test', officeId: 'sos_education', active: true };
    g.characters['spox_test'] = { ...tmpl, id: 'spox_test', officeId: 'min_home', active: true };

    reconcileCharacterOffices(g);

    expect(g.characters['ghost_test'].officeId).toBeNull();   // stale cabinet title cleared
    expect(g.characters['spox_test'].officeId).toBe('min_home'); // min_* spokesperson untouched
    // the genuine Education Secretary keeps their post
    const realEdu = g.government.cabinet.find((p) => p.officeId === 'sos_education')!;
    expect(g.characters[realEdu.characterId].officeId).toBe('sos_education');
  });
});

describe('wave 23 — minor-party contest roles', () => {
  it('a third-party field mixes spokespeople and backbenchers', () => {
    let sawSpokesperson = false, sawBackbench = false;
    for (let i = 0; i < 25; i++) {
      const g = makeGame('reform', '2024', 100 + i); // Reform is a minor party in 2024
      openLeadershipVacancy(g, new Rng(200 + i), g.player.partyId);
      const stand = g.forcedQueue.find((e) => e.kind === 'leadershipStand');
      const ids = (stand?.payload?.candidateIds as string[]) ?? [];
      for (const id of ids) {
        const o = g.characters[id]?.officeId;
        if (o && OFFICES[o]?.tier === 3) sawSpokesperson = true; // "[Party] Spokesperson for X"
        if (!o) sawBackbench = true;                              // "Backbench MP"
      }
    }
    expect(sawSpokesperson).toBe(true);
    expect(sawBackbench).toBe(true);
  });
});
