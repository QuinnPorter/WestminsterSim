import { describe, expect, it } from 'vitest';
import { committeeChairTitle, committeeNameFor } from '../../data/committees';
import { createNewGame } from '../newGame';
import { initCalendar } from '../calendar';
import { canChairCommittee, materializeForced, pickCommittee, playerOfficeTitle, resolveForcedChoice } from '../career';
import { executiveDepartments } from '../../data/offices';
import { Rng } from '../rng';

describe('committee chairs in every chamber', () => {
  it('are named as each chamber names them', () => {
    expect(committeeNameFor('treasury', 'uk')).toBe('Treasury Select Committee');
    expect(committeeChairTitle('treasury')).toBe('Chair, Treasury Select Committee');
    expect(committeeNameFor('finance', 'ni')).toBe('Committee for Finance');
    expect(committeeNameFor('economy', 'ni')).toBe('Committee for the Economy');
    expect(committeeChairTitle('finance', 'scotland')).toBe('Convener, Finance Committee');
    expect(committeeChairTitle('health', 'wales')).toBe('Chair, Health Committee');
  });

  it('an Assembly backbencher can be offered a statutory committee and holds it under the right title', () => {
    const g = createNewGame({
      name: 'Test Subject', gender: 'f', age: 40, region: 'ni', background: 'lawyer', partyId: 'uup',
      avatar: { skin: 0, hairStyle: 0, hairColour: 0, eyes: 0, brows: 0, outfit: 0, outfitColour: 0, accessory: 0, bg: 0 },
      era: '2010', seed: 3, arena: 'ni', devolvedElection: '2011-05-05',
    });
    initCalendar(g);
    const rng = new Rng(3);
    expect(canChairCommittee(g)).toBe(true);
    const dept = pickCommittee(g, rng);
    expect(executiveDepartments('ni')).toContain(dept);
    const card = materializeForced(g, rng, { kind: 'committeeChairContest', payload: { dept } });
    expect(card.body).toContain('share-out');
    expect(card.body).not.toMatch(/whole House|MPs/);
    g.player.stats.competence = 90;
    g.player.stats.profile = 90;
    g.player.stats.partyStanding = 90;
    const out = resolveForcedChoice(g, rng, card, 0);
    expect(out.text).not.toContain('Select Committee');
    expect(g.player.committeeChair).toBe(dept);
    expect(playerOfficeTitle(g)).toBe(committeeChairTitle(dept, 'ni'));
    expect(playerOfficeTitle(g)).toMatch(/^Chair, Committee for /);
    expect(g.history.some((h) => h.kind === 'committeeTenure' && h.arena === 'ni')).toBe(true);
  });
});
