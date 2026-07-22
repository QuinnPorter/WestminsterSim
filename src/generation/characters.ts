import {
  AvatarConfig, Character, Gender, OfficeId, PartyId, RegionId, TraitId,
} from '../types/game';
import {
  FIRST_NB, REGIONAL_FIRST_F, REGIONAL_FIRST_M, REGIONAL_SURNAMES, SURNAMES,
  FIRST_M, FIRST_F,
} from '../data/names';
import { AVATAR_COUNTS } from '../avatar/palette';
import { Rng, clamp } from '../engine/rng';

const ALL_TRAITS: TraitId[] = [
  'ambitious', 'loyal', 'ruthless', 'principled', 'charming', 'dull', 'maverick', 'fixer',
];

export function randomAvatar(rng: Rng): AvatarConfig {
  return {
    skin: rng.int(0, AVATAR_COUNTS.skin - 1),
    hairStyle: rng.int(0, AVATAR_COUNTS.hairStyle - 1),
    hairColour: rng.int(0, AVATAR_COUNTS.hairColour - 1),
    eyes: rng.int(0, AVATAR_COUNTS.eyes - 1),
    brows: rng.int(0, AVATAR_COUNTS.brows - 1),
    outfit: rng.int(0, AVATAR_COUNTS.outfit - 1),
    outfitColour: rng.int(0, AVATAR_COUNTS.outfitColour - 1),
    accessory: rng.int(0, AVATAR_COUNTS.accessory - 1),
    bg: rng.int(0, AVATAR_COUNTS.bg - 1),
  };
}

export function generateName(
  rng: Rng,
  gender: Gender,
  usedNames: Set<string>,
  region?: RegionId
): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    let firsts: string[];
    if (gender === 'nb') {
      firsts = FIRST_NB;
    } else {
      const base = gender === 'm' ? FIRST_M : FIRST_F;
      const regional = region
        ? (gender === 'm' ? REGIONAL_FIRST_M[region] : REGIONAL_FIRST_F[region])
        : undefined;
      // regional names get a boosted look-in
      firsts = regional && rng.chance(0.35) ? regional : base;
    }
    const surnames =
      region && REGIONAL_SURNAMES[region] && rng.chance(0.4)
        ? REGIONAL_SURNAMES[region]!
        : SURNAMES;
    const name = `${rng.pick(firsts)} ${rng.pick(surnames)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  return `${rng.pick(FIRST_M)} ${rng.pick(SURNAMES)}-${rng.int(2, 9)}`;
}

export interface GenerateCharacterOpts {
  partyId: PartyId;
  officeId?: OfficeId | null;
  minAge?: number;
  maxAge?: number;
  competenceMean?: number;
  traitBias?: TraitId[];
  region?: RegionId;
}

export function generateCharacter(
  rng: Rng,
  usedNames: Set<string>,
  opts: GenerateCharacterOpts,
  idCounter: { value: number }
): Character {
  const gender: Gender = rng.next() < 0.46 ? 'f' : rng.next() < 0.96 ? 'm' : 'nb';
  const traits: TraitId[] = [];
  if (opts.traitBias && opts.traitBias.length > 0 && rng.chance(0.7)) {
    traits.push(rng.pick(opts.traitBias));
  }
  while (traits.length < 2) {
    const t = rng.pick(ALL_TRAITS);
    if (!traits.includes(t)) traits.push(t);
  }
  // baseline standing with a sitting leader, derived from traits alone (NOT a fresh
  // rng draw — that would shift the whole deterministic stream). The `loyal` are
  // naturally warmer, the `ambitious`/`ruthless` naturally cooler; appointments,
  // snubs and sackings move it from here during play.
  const loyaltyBias =
    (traits.includes('loyal') ? 22 : 0) -
    (traits.includes('ambitious') ? 12 : 0) -
    (traits.includes('ruthless') ? 8 : 0) +
    (traits.includes('principled') ? 4 : 0);
  return {
    id: `npc_${idCounter.value++}`,
    name: generateName(rng, gender, usedNames, opts.region),
    gender,
    age: rng.int(opts.minAge ?? 38, opts.maxAge ?? 64),
    partyId: opts.partyId,
    officeId: opts.officeId ?? null,
    traits,
    competence: Math.round(clamp(rng.normal(opts.competenceMean ?? 55, 12), 25, 92)),
    avatar: randomAvatar(rng),
    active: true,
    loyalty: clamp(loyaltyBias, -100, 100),
  };
}
