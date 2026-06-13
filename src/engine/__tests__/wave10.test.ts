import { describe, expect, it } from 'vitest';
import { createNewGame, CreationInput } from '../newGame';
import {
  appointNpcDeputyPm, setDeputyPmCore, coalitionCompatible, pickCoalitionPartner,
  seatCoalitionCabinet, nextOfficeFor, npcReshuffle,
} from '../career';
import { GREAT_OFFICES, OFFICES } from '../../data/offices';
import { ElectionResult, GameState, OfficeId, PartyId } from '../../types/game';
import { Rng } from '../rng';

function makeGame(seed = 42, partyId: CreationInput['partyId'] = 'con') {
  const input: CreationInput = {
    name: 'Test MP', gender: 'f', age: 47, region: 'yorkshire',
    background: 'lawyer', partyId,
    avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
    era: '2019', seed,
  };
  return createNewGame(input);
}

function officeOfDeputy(game: GameState): OfficeId | undefined {
  const id = game.government.deputyPmId;
  return game.government.cabinet.find((p) => p.characterId === id)?.officeId;
}

describe('wave 10 — deputy is a senior office, never the Chief Whip', () => {
  it('never appoints the Chief Whip and lands on a great office ~half the time', () => {
    const game = makeGame(); // con governs; full NPC cabinet
    let set = 0, great = 0, whip = 0;
    for (let i = 0; i < 300; i++) {
      appointNpcDeputyPm(game, new Rng(1000 + i));
      const office = officeOfDeputy(game);
      if (!office) continue;
      set++;
      if (office === 'chiefWhip') whip++;
      if (GREAT_OFFICES.includes(office)) great++;
    }
    expect(set).toBeGreaterThan(150);
    expect(whip).toBe(0);
    expect(great / set).toBeGreaterThan(0.3);
    expect(great / set).toBeLessThan(0.7);
  });
});

describe('wave 10 — player-PM names the deputy', () => {
  it('a PM can set an NPC Secretary of State, but not the Chief Whip or when not PM', () => {
    const game = makeGame();
    // make the player PM
    game.government.pmId = 'player';
    game.player.officeId = 'leader';
    const sosPost = game.government.cabinet.find((p) => p.officeId === 'sos_health')!;
    setDeputyPmCore(game, new Rng(1), sosPost.characterId);
    expect(game.government.deputyPmId).toBe(sosPost.characterId);

    const whipPost = game.government.cabinet.find((p) => p.officeId === 'chiefWhip')!;
    setDeputyPmCore(game, new Rng(2), whipPost.characterId);
    expect(game.government.deputyPmId).toBe(sosPost.characterId); // unchanged — whip rejected

    // not PM → rejected
    const g2 = makeGame(7);
    const sos2 = g2.government.cabinet.find((p) => p.officeId === 'sos_home')!;
    setDeputyPmCore(g2, new Rng(3), sos2.characterId);
    expect(g2.government.deputyPmId).toBeUndefined();
  });
});

describe('wave 10 — coalition compatibility & partner choice', () => {
  it('hard bans and ideology reach', () => {
    expect(coalitionCompatible('lab', 'reform')).toBe(false);
    expect(coalitionCompatible('reform', 'lab')).toBe(false);
    expect(coalitionCompatible('con', 'green')).toBe(false);
    expect(coalitionCompatible('lab', 'ld')).toBe(true);
    expect(coalitionCompatible('con', 'ld')).toBe(true);
    expect(coalitionCompatible('lab', 'snp')).toBe(true);
  });

  it('pickCoalitionPartner never returns a banned partner', () => {
    const seats: Partial<Record<PartyId, number>> = { lab: 300, reform: 60, ld: 40, snp: 20, green: 5 };
    const result = { seats } as unknown as ElectionResult;
    for (let i = 0; i < 40; i++) {
      const p = pickCoalitionPartner(result, new Rng(500 + i), 'lab');
      if (p !== null) expect(p).not.toBe('reform'); // banned with Labour
    }
  });
});

describe('wave 10 — coalition cabinet seats', () => {
  it('seats a proportional number of partner ministers, never a great office or whip', () => {
    const game = makeGame();
    game.government.governingParty = 'con';
    game.government.oppositionParty = 'lab';
    game.government.arrangement = 'coalition';
    game.government.coalitionPartner = 'ld';
    game.seats = { con: 300, ld: 50, lab: 200 };
    seatCoalitionCabinet(game, new Rng(11));
    const ldPosts = game.government.cabinet.filter(
      (p) => game.characters[p.characterId]?.partyId === 'ld'
    );
    expect(ldPosts.length).toBeGreaterThan(0);
    expect(ldPosts.length).toBeLessThanOrEqual(2);
    for (const p of ldPosts) {
      expect(p.officeId).not.toBe('chiefWhip');
      expect(GREAT_OFFICES.includes(p.officeId)).toBe(false);
      expect(OFFICES[p.officeId]?.department).toBeTruthy();
    }
  });

  it('a 1–2 MP partner gets at most one minister, and they survive a governing reshuffle', () => {
    const game = makeGame(3);
    game.government.governingParty = 'con';
    game.government.arrangement = 'coalition';
    game.government.coalitionPartner = 'ld';
    game.seats = { con: 330, ld: 2, lab: 200 };
    seatCoalitionCabinet(game, new Rng(13));
    const before = game.government.cabinet.filter((p) => game.characters[p.characterId]?.partyId === 'ld').length;
    expect(before).toBeLessThanOrEqual(1);
    for (let i = 0; i < 8; i++) npcReshuffle(game, new Rng(2000 + i), 'con');
    const after = game.government.cabinet.filter((p) => game.characters[p.characterId]?.partyId === 'ld').length;
    expect(after).toBe(before); // coalition ministers aren't churned by the governing party
  });
});

describe('wave 10 — Chief Whip is a playable office', () => {
  it('a sitting Whip can be offered the Chief Whip', () => {
    const game = makeGame(); // con governs, player con
    game.player.officeId = 'whip';
    let sawChiefWhip = false;
    for (let i = 0; i < 200 && !sawChiefWhip; i++) {
      if (nextOfficeFor(game, new Rng(3000 + i)) === 'chiefWhip') sawChiefWhip = true;
    }
    expect(sawChiefWhip).toBe(true);
  });
});
