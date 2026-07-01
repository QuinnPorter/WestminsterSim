import { describe, expect, it } from 'vitest';
import { PARLIAMENTS } from '../../data/parliaments';
import { PARTIES } from '../../data/parties';
import { CONSTITUENCY_POOLS } from '../../data/constituencyNames';
import { generateSeatMap } from '../../generation/constituency';
import { Rng } from '../rng';
import { Era, PartyId, RegionId } from '../../types/game';

const ERAS: Era[] = ['2010', '2015', '2017', '2019', '2024'];
const ALL_REGIONS = Object.keys(CONSTITUENCY_POOLS) as RegionId[];

/** A generated seat name is exactly one of: a bare stem, a stem + a directional
 *  suffix ("Reading East"), or two stems joined by " and " ("Hackney and Bow").
 *  Reconstruct it against ONLY the given region's pool — this is what proves a
 *  seat's name genuinely belongs to the region its winner was drawn for. The
 *  numbered "<stem> <n>" collision fallback in generateName is also accepted. */
function nameBelongsToRegion(name: string, region: RegionId): boolean {
  const pool = CONSTITUENCY_POOLS[region];
  const stems = pool.stems;
  // bare stem
  if (stems.includes(name)) return true;
  // stem + suffix
  for (const stem of stems) {
    for (const suf of pool.suffixes) {
      if (name === `${stem} ${suf}`) return true;
    }
  }
  // two paired stems
  for (const a of stems) {
    for (const b of stems) {
      if (name === `${a} and ${b}`) return true;
    }
  }
  // ultra-rare numbered collision fallback: "<stem> <n>"
  for (const stem of stems) {
    const m = name === stem ? null : name.match(new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`));
    if (m) return true;
  }
  return false;
}

describe('constituency coherence', () => {
  // ---- (a) regional parties only ever contest their own regions ----------
  it('regional parties appear only within their contestsRegions across every matrix', () => {
    // parties that do NOT contest the whole of Great Britain are "regional" and
    // must never win — nor even appear as a winner — outside contestsRegions.
    const regionalParties = (Object.keys(PARTIES) as PartyId[]).filter(
      (p) => PARTIES[p].contestsRegions.length > 0 && PARTIES[p].contestsRegions.length < ALL_REGIONS.length
    );
    // sanity: the usual suspects are present so the assertion has teeth
    for (const p of ['snp', 'pc', 'dup', 'sf', 'sdlp', 'uup', 'alliance'] as PartyId[]) {
      expect(regionalParties).toContain(p);
    }

    for (const era of ERAS) {
      const matrix = PARLIAMENTS[era].matrix;
      for (const region of Object.keys(matrix) as RegionId[]) {
        for (const party of Object.keys(matrix[region]) as PartyId[]) {
          if (!regionalParties.includes(party)) continue;
          expect(
            PARTIES[party].contestsRegions,
            `${party} won a seat in ${region} in ${era} but does not contest it`
          ).toContain(region);
        }
      }
    }
  });

  it('a regional party never lists a region outside itself in contestsRegions', () => {
    // SNP -> scotland only; PC -> wales only; the NI bloc -> ni only.
    expect(PARTIES.snp.contestsRegions).toEqual(['scotland']);
    expect(PARTIES.pc.contestsRegions).toEqual(['wales']);
    for (const p of ['dup', 'sf', 'sdlp', 'uup', 'alliance'] as PartyId[]) {
      expect(PARTIES[p].contestsRegions).toEqual(['ni']);
    }
  });

  // ---- (b) player.region always equals the region of their seat -----------
  it('player region matches the seat region after generateSeatMap for a spread of eras/parties', () => {
    // include a deliberate mismatch (an SNP hopeful "from Yorkshire") to prove the
    // redirect keeps region <-> seat coherent rather than producing "SNP MP for Sheffield".
    const scenarios: Array<{ party: PartyId; region: RegionId }> = [
      { party: 'con', region: 'southEast' },
      { party: 'lab', region: 'northEast' },
      { party: 'ld', region: 'southWest' },
      { party: 'snp', region: 'scotland' },
      { party: 'snp', region: 'yorkshire' }, // incompatible on purpose -> must be redirected
      { party: 'pc', region: 'wales' },
      { party: 'pc', region: 'london' }, // incompatible on purpose
      { party: 'dup', region: 'ni' },
      { party: 'green', region: 'london' },
      { party: 'reform', region: 'eastMidlands' },
    ];

    for (const era of ERAS) {
      for (const { party, region } of scenarios) {
        const rng = new Rng(era.length * 1000 + party.length * 31 + region.length);
        const { seatMap, playerSeatId, playerRegion } = generateSeatMap(
          rng, PARLIAMENTS[era].matrix, party, region, era
        );
        const seat = seatMap.find((s) => s.id === playerSeatId);
        expect(seat, `no player seat for ${party}/${region} in ${era}`).toBeDefined();
        // the seat the player holds sits in exactly the region the result reports
        expect(seat!.region).toBe(playerRegion);
        // and that region is one the player's party actually contests
        expect(PARTIES[party].contestsRegions).toContain(playerRegion);
        // the player's party genuinely holds the seat (won outright or shock-flipped)
        expect(seat!.winner).toBe(party);
        expect(seat!.isPlayerSeat).toBe(true);
      }
    }
  });

  // ---- (c) every seat name belongs to its own region's name pool ----------
  it('every generated seat name belongs to its region name pool', () => {
    for (const era of ERAS) {
      const rng = new Rng(4242 + era.length);
      const { seatMap } = generateSeatMap(
        rng, PARLIAMENTS[era].matrix, 'con', 'southEast', era
      );
      for (const seat of seatMap) {
        // Speaker seats keep their own region's name too, so no exemption needed.
        expect(
          nameBelongsToRegion(seat.name, seat.region),
          `seat "${seat.name}" (${era}) is filed under ${seat.region} but is not in that region's pool`
        ).toBe(true);
      }
    }
  });

  it('no seat name resolves to a foreign region pool (catches misfiled stems)', () => {
    // A name that belongs to some OTHER region's pool but not its own is exactly
    // the "SNP MP for Sheffield" class of bug — a stem filed under the wrong nation.
    for (const era of ERAS) {
      const rng = new Rng(9001 + era.length);
      const { seatMap } = generateSeatMap(
        rng, PARLIAMENTS[era].matrix, 'lab', 'northWest', era
      );
      for (const seat of seatMap) {
        if (nameBelongsToRegion(seat.name, seat.region)) continue;
        const foreign = ALL_REGIONS.filter(
          (r) => r !== seat.region && nameBelongsToRegion(seat.name, r)
        );
        expect(
          foreign,
          `seat "${seat.name}" is in ${seat.region} but matches pool(s): ${foreign.join(', ')}`
        ).toEqual([]);
      }
    }
  });
});
