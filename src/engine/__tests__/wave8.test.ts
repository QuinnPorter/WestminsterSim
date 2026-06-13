import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import { applyElectionAftermath, nextOfficeFor } from '../career';
import { officeTitleFor } from '../../data/offices';
import {
  playablePartiesForEra, populistPartyForEra, PLAYABLE_PARTIES,
} from '../../data/parties';
import { ElectionResult, GameState, PartyId } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con') {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 44, region: 'yorkshire',
    background: 'teacher', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

/** a Labour-governs result where the Lib Dems take second place and the
 *  Conservatives collapse to third — the official opposition should follow. */
function ldOvertakeResult(state: GameState): ElectionResult {
  const seats: Partial<Record<PartyId, number>> = {
    lab: 350, ld: 160, con: 90, snp: 40, green: 5, spk: 1, reform: 4,
  };
  return {
    id: `ge_${state.day}`, date: state.day, seats, voteShares: {},
    playerResult: null, outcome: 'majority', governingParty: 'lab', playerHeldSeat: true,
  };
}

describe('wave 8 — bug 1: results-driven official opposition', () => {
  it('the Lib Dems become the official opposition when they take second place', () => {
    const game = makeGame(); // 2019: con gov, lab opp
    // flip to a Labour government with the Conservatives as opposition first
    game.government.governingParty = 'lab';
    game.government.oppositionParty = 'con';
    applyElectionAftermath(game, new Rng(7), ldOvertakeResult(game), true);
    expect(game.government.oppositionParty).toBe('ld');
  });

  it('the shadow cabinet roster is regenerated to the new opposition party', () => {
    const game = makeGame();
    game.government.governingParty = 'lab';
    game.government.oppositionParty = 'con';
    applyElectionAftermath(game, new Rng(11), ldOvertakeResult(game), true);
    for (const post of game.government.shadowCabinet) {
      if (post.characterId === 'player') continue;
      expect(game.characters[post.characterId]?.partyId).toBe('ld');
    }
    // and the Leader of the Opposition is a Lib Dem
    expect(game.characters[game.government.loId]?.partyId).toBe('ld');
  });

  it('a player whose party becomes the opposition is seated on the shadow bench', () => {
    const game = makeGame(42, 'ld'); // player is a Lib Dem (a third party in 2019)
    game.government.governingParty = 'lab';
    game.government.oppositionParty = 'con';
    game.player.hasSeat = true;
    game.player.officeId = 'sos_health'; // a cabinet-rank brief
    applyElectionAftermath(game, new Rng(13), ldOvertakeResult(game), true);
    expect(game.government.oppositionParty).toBe('ld');
    const post = game.government.shadowCabinet.find((p) => p.officeId === 'sos_health');
    expect(post?.characterId).toBe('player');
  });

  it('a player whose party drops to third loses their shadow office', () => {
    const game = makeGame(42, 'con'); // player Conservative
    game.government.governingParty = 'lab';
    game.government.oppositionParty = 'con';
    game.player.hasSeat = true;
    game.player.officeId = 'sos_health';
    // seat the player as the Conservative shadow Health Secretary
    const post = game.government.shadowCabinet.find((p) => p.officeId === 'sos_health')!;
    post.characterId = 'player';
    applyElectionAftermath(game, new Rng(17), ldOvertakeResult(game), true);
    expect(game.government.oppositionParty).toBe('ld');
    expect(game.player.officeId).toBeNull();
    const stillSeated = game.government.shadowCabinet.some((p) => p.characterId === 'player');
    expect(stillSeated).toBe(false);
  });
});

describe('wave 8 — bug 2: era-aware playable parties', () => {
  it('swaps the populist slot to the era-correct party', () => {
    expect(populistPartyForEra('2015')).toBe('ukip');
    expect(populistPartyForEra('2017')).toBe('ukip');
    expect(populistPartyForEra('2019')).toBe('brexit');
    expect(populistPartyForEra('2024')).toBe('reform');

    expect(playablePartiesForEra('2015')).toContain('ukip');
    expect(playablePartiesForEra('2015')).not.toContain('reform');
    expect(playablePartiesForEra('2019')).toContain('brexit');
    expect(playablePartiesForEra('2019')).not.toContain('reform');
    expect(playablePartiesForEra('2024')).toContain('reform');
  });

  it('keeps the same length and the non-populist slots unchanged', () => {
    for (const era of ['2015', '2017', '2019', '2024'] as const) {
      const list = playablePartiesForEra(era);
      expect(list).toHaveLength(PLAYABLE_PARTIES.length);
      for (const p of ['con', 'lab', 'ld', 'snp', 'green', 'pc'] as PartyId[]) {
        expect(list).toContain(p);
      }
    }
  });
});

describe('wave 8 — bug 3: a single spokesperson rung', () => {
  it('never re-offers the brief a minor-party player already holds, and never a lead (sos_) role', () => {
    const game = makeGame(42, 'snp'); // SNP: a third party
    game.player.hasSeat = true;
    game.player.officeId = 'min_health';
    for (let i = 0; i < 200; i++) {
      const target = nextOfficeFor(game, new Rng(1000 + i));
      if (target === null) continue;
      expect(target).not.toBe('min_health');
      expect(target.startsWith('sos_')).toBe(false);
    }
  });

  it('renders a single "Spokesperson" title with no "Lead" distinction', () => {
    const min = officeTitleFor('min_health', { inGovernment: false, minorPartyName: 'Reform UK' });
    const sos = officeTitleFor('sos_health', { inGovernment: false, minorPartyName: 'Reform UK' });
    expect(min).toContain('Spokesperson');
    expect(min).not.toContain('Lead');
    expect(sos).not.toContain('Lead');
  });
});
