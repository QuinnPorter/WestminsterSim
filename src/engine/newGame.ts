import {
  AvatarConfig, BackgroundId, CabinetPost, CauseId, Character, Era, GameState, Gender,
  PartyId, Player, RegionId, Relationship,
} from '../types/game';
import { PARLIAMENTS } from '../data/parliaments';
import { BACKGROUNDS } from '../data/backgrounds';
import { CABINET_OFFICES } from '../data/offices';
import { generateSeatMap, countSeats } from '../generation/constituency';
import { generateCharacter } from '../generation/characters';
import { Rng, clamp } from './rng';
import { isoToDay } from './clock';
import { seatCoalitionCabinet } from './career';

export interface CreationInput {
  name: string;
  gender: Gender;
  age: number;
  region: RegionId;
  background: BackgroundId;
  partyId: PartyId;
  avatar: AvatarConfig;
  era: Era;
  /** broad causes chosen at the agenda step (0–3) */
  causes?: CauseId[];
  seed?: number;
}

export const SAVE_VERSION = 8;

function buildPlayer(input: CreationInput, seatId: string, startDay: number): Player {
  const mods = BACKGROUNDS[input.background].statMods;
  return {
    name: input.name,
    gender: input.gender,
    age: input.age,
    partyId: input.partyId,
    background: input.background,
    region: input.region,
    avatar: input.avatar,
    stats: {
      profile: clamp(20 + (mods.profile ?? 0), 0, 100),
      partyStanding: clamp(40 + (mods.partyStanding ?? 0), 0, 100),
      competence: clamp(42 + (mods.competence ?? 0), 0, 100),
      constituencyApproval: clamp(52 + (mods.constituencyApproval ?? 0), 0, 100),
      integrity: clamp(55 + (mods.integrity ?? 0), 0, 100),
    },
    officeId: null,
    officeSinceDay: null,
    rebellionCount: 0,
    flags: {},
    seatId,
    hasSeat: true,
    enteredParliament: startDay,
    causes: (input.causes ?? []).slice(0, 3),
    favours: [],
  };
}

export function createNewGame(input: CreationInput): GameState {
  const seed = input.seed ?? ((Math.random() * 0xffffffff) >>> 0);
  const rng = new Rng(seed);
  const data = PARLIAMENTS[input.era];
  const startDay = isoToDay(data.firstSitting);

  const { seatMap, playerSeatId } = generateSeatMap(
    rng, data.matrix, input.partyId, input.region, input.era
  );
  const seats = countSeats(seatMap);

  // ---- generate the political cast ----
  const usedNames = new Set<string>([input.name]);
  const idCounter = { value: 0 };
  const characters: Record<string, Character> = {};
  const add = (c: Character) => {
    characters[c.id] = c;
    return c;
  };

  const govParty = data.governingParty;
  const oppParty = data.oppositionParty;

  const pm = add(generateCharacter(rng, usedNames, {
    partyId: govParty, officeId: 'leader', minAge: 45, maxAge: 62,
    competenceMean: 62, traitBias: ['ambitious', 'charming'],
  }, idCounter));
  const lo = add(generateCharacter(rng, usedNames, {
    partyId: oppParty, officeId: 'leader', minAge: 45, maxAge: 62,
    competenceMean: 60, traitBias: ['ambitious'],
  }, idCounter));

  // a coalition era (2010 Con–LD) also has a junior-partner leader, who becomes
  // Deputy PM. Generated up front so a player who picks the partner inherits them
  // as their own party leader rather than a throwaway figure.
  const coalitionLeader = data.coalitionPartner
    ? add(generateCharacter(rng, usedNames, {
        partyId: data.coalitionPartner, officeId: 'leader', minAge: 43, maxAge: 60,
        competenceMean: 60, traitBias: ['ambitious', 'charming'],
      }, idCounter))
    : null;

  const cabinet: CabinetPost[] = [];
  const shadowCabinet: CabinetPost[] = [];
  for (const officeId of CABINET_OFFICES) {
    cabinet.push({
      officeId,
      characterId: add(generateCharacter(rng, usedNames, {
        partyId: govParty, officeId, competenceMean: 58,
      }, idCounter)).id,
    });
    shadowCabinet.push({
      officeId,
      characterId: add(generateCharacter(rng, usedNames, {
        partyId: oppParty, officeId, competenceMean: 56,
      }, idCounter)).id,
    });
  }

  // ---- the player's personal cast ----
  const playerParty = input.partyId;
  const relationships: Relationship[] = [];

  // party leader: PM, LO, or a generated minor-party leader
  let leaderId: string;
  if (playerParty === govParty) leaderId = pm.id;
  else if (playerParty === oppParty) leaderId = lo.id;
  else if (coalitionLeader && playerParty === data.coalitionPartner) leaderId = coalitionLeader.id;
  else {
    leaderId = add(generateCharacter(rng, usedNames, {
      partyId: playerParty, officeId: 'leader', minAge: 42, maxAge: 64,
      competenceMean: 58, traitBias: ['ambitious'],
    }, idCounter)).id;
  }
  relationships.push({ characterId: leaderId, kind: 'leader', value: rng.int(-5, 15) });

  // chief whip of the player's party
  let whipId: string;
  if (playerParty === govParty) {
    whipId = cabinet.find((p) => p.officeId === 'chiefWhip')!.characterId;
  } else if (playerParty === oppParty) {
    whipId = shadowCabinet.find((p) => p.officeId === 'chiefWhip')!.characterId;
  } else {
    whipId = add(generateCharacter(rng, usedNames, {
      partyId: playerParty, officeId: 'chiefWhip', competenceMean: 55,
      traitBias: ['fixer', 'ruthless'],
    }, idCounter)).id;
  }
  relationships.push({ characterId: whipId, kind: 'chiefWhip', value: rng.int(-5, 10) });

  const mentor = add(generateCharacter(rng, usedNames, {
    partyId: playerParty, minAge: 55, maxAge: 72, competenceMean: 60,
    traitBias: ['principled', 'loyal'], region: input.region,
  }, idCounter));
  relationships.push({ characterId: mentor.id, kind: 'mentor', value: rng.int(25, 45) });

  const ally = add(generateCharacter(rng, usedNames, {
    partyId: playerParty, minAge: Math.max(28, input.age - 6),
    maxAge: input.age + 6, competenceMean: 52, traitBias: ['charming', 'loyal'],
  }, idCounter));
  relationships.push({ characterId: ally.id, kind: 'ally', value: rng.int(30, 50) });

  const rival = add(generateCharacter(rng, usedNames, {
    partyId: playerParty, minAge: Math.max(28, input.age - 6),
    maxAge: input.age + 8, competenceMean: 58, traitBias: ['ambitious', 'ruthless'],
  }, idCounter));
  relationships.push({ characterId: rival.id, kind: 'rival', value: rng.int(-30, -10) });

  const journalist = add(generateCharacter(rng, usedNames, {
    partyId: 'ind', minAge: 32, maxAge: 58, competenceMean: 60,
    traitBias: ['ruthless', 'charming'],
  }, idCounter));
  relationships.push({ characterId: journalist.id, kind: 'journalist', value: rng.int(-10, 10) });

  const player = buildPlayer(input, playerSeatId, startDay);

  // working majority excluding SF + Speaker
  const sfSeats = seats.sf ?? 0;
  const voting = 650 - sfSeats - 1;
  const govSeats = seats[govParty] ?? 0;
  const majority = govSeats - (voting - govSeats);

  const state: GameState = {
    version: SAVE_VERSION,
    rngState: rng.state,
    day: startDay,
    startEra: input.era,
    startDay,
    player,
    characters,
    relationships,
    seats,
    seatMap,
    government: {
      governingParty: govParty,
      oppositionParty: oppParty,
      pmId: pm.id,
      loId: lo.id,
      cabinet,
      shadowCabinet,
      majority,
      pmSinceDay: startDay,
      arrangement: data.arrangement ?? (majority > 0 ? 'majority' : 'minority'),
      ...(data.confidencePartner ? { confidencePartner: data.confidencePartner } : {}),
      ...(data.coalitionPartner ? { coalitionPartner: data.coalitionPartner } : {}),
      termsInPower: 1,
    },
    polling: { shares: { ...data.baselineShares }, lastUpdated: startDay },
    pollHistory: [{ day: startDay, shares: { ...data.baselineShares } }],
    history: [
      {
        kind: 'enteredParliament',
        date: startDay,
        seatName: seatMap.find((s) => s.id === playerSeatId)!.name,
      },
    ],
    elections: {},
    pmHistory: [
      { characterId: pm.id, name: pm.name, partyId: govParty, startDay, endDay: null },
    ],
    loHistory: [
      { characterId: lo.id, name: lo.name, partyId: oppParty, startDay, endDay: null },
    ],
    mentors: [],
    currentCard: null,
    pendingElectionId: null,
    forcedQueue: [],
    cardHistory: {},
    calendarDone: {},
    lastCardId: null,
    parliamentStart: startDay,
    nextElectionBy: startDay + Math.round(4.75 * 365),
    gameOver: null,
  };

  // A coalition government (2010 Con–LD) seats the junior partner from day one:
  // its leader is Deputy PM and it takes a seat-proportionate slice of the Cabinet
  // (seatCoalitionCabinet swaps in generated partner ministers, never the player).
  // The player's party never changes, and government-bloc membership is derived
  // from it each turn — so when an election ends the coalition they move with the
  // partner, never stranded in a government their party has left.
  if (state.government.arrangement === 'coalition' && coalitionLeader) {
    state.government.deputyPmId = coalitionLeader.id;
    state.government.deputyTitle = 'dpm';
    seatCoalitionCabinet(state, rng);
  }

  return state;
}
