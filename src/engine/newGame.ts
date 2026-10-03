import {
  ArenaId, AvatarConfig, BackgroundId, CabinetPost, CauseId, Character, DevolvedArenaId, Era,
  GameState, Gender, PartyId, Player, RegionId, Relationship,
} from '../types/game';
import { PARLIAMENTS } from '../data/parliaments';
import { PARTIES } from '../data/parties';
import { BACKGROUNDS } from '../data/backgrounds';
import { CABINET_OFFICES } from '../data/offices';
import { generateSeatMap, countSeats } from '../generation/constituency';
import { generateCharacter } from '../generation/characters';
import { Rng, clamp } from './rng';
import { isoToDay, UK_TERM_DAYS } from './clock';
import { seatCoalitionCabinet } from './career';
import { catchUpArena, startInNation, ukEraFor } from './arena';
import { polledPartiesForEra } from '../data/parties';
import { workingMajority } from './seats';

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
  /** the chamber the career begins in; omitted = the Commons */
  arena?: ArenaId;
  /** for a devolved start, the ISO polling day of the legislature chosen. `era`
   *  is then derived: the Westminster parliament sitting on that date. */
  devolvedElection?: string;
}

export const SAVE_VERSION = 10;

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
    committeeChair: null,
    rebellionCount: 0,
    flags: {},
    seatId,
    hasSeat: true,
    enteredParliament: startDay,
    causes: (input.causes ?? []).slice(0, 3),
    favours: [],
    promises: [],
  };
}

export function createNewGame(input: CreationInput): GameState {
  const originalParty = input.partyId;
  const seed = input.seed ?? ((Math.random() * 0xffffffff) >>> 0);
  const rng = new Rng(seed);
  // A devolved career still needs a Commons behind it — it is the chamber they
  // may one day move to, and the government they will spend their career arguing
  // with. Build the Westminster parliament that was actually sitting on the day
  // the devolved legislature was elected, then catch it up to that day.
  const devolvedStart = input.arena && input.arena !== 'uk'
    ? { arena: input.arena as DevolvedArenaId, day: isoToDay(input.devolvedElection!) }
    : null;
  const era = devolvedStart ? ukEraFor(devolvedStart.day) : input.era;
  input = { ...input, era };
  const data = PARLIAMENTS[era];
  const startDay = isoToDay(data.firstSitting);

  // for a devolved start the player is not in this chamber at all, so seat the
  // notional Westminster placeholder with a party that actually contests it
  const ukParty: PartyId = devolvedStart
    ? (PARTIES[input.partyId]?.devolvedOnly ? 'lab' : (input.partyId === 'snp' || input.partyId === 'pc' ? input.partyId : input.partyId))
    : input.partyId;
  const ukRegion: RegionId = devolvedStart ? devolvedStart.arena : input.region;
  const { seatMap, playerSeatId, playerRegion } = generateSeatMap(
    rng, data.matrix, ukParty, ukRegion, era
  );
  // a regional party (SNP/PC/…) may have been redirected to its real home nation;
  // adopt that region for the player and their cast so the home patch, the regional
  // cabinet office, and the constituency name all stay coherent with the party.
  input = { ...input, region: playerRegion, partyId: ukParty };
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
  const majority = workingMajority(seats, govParty);

  const state: GameState = {
    version: SAVE_VERSION,
    rngState: rng.state,
    day: startDay,
    startEra: era,
    startDay,
    // a career begins in the Commons; a devolved chamber is only built when the
    // player actually sits in one
    arena: 'uk',
    dormant: {},
    anchorShares: { ...data.baselineShares },
    polledParties: polledPartiesForEra(era),
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
      loInheritedPolls: (data.baselineShares[oppParty] ?? 0) * 100,
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
    pendingContests: [],
    cardHistory: {},
    calendarDone: {},
    lastCardId: null,
    parliamentStart: startDay,
    nextElectionBy: startDay + UK_TERM_DAYS,
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

  if (devolvedStart) {
    // run the Commons forward to the day the devolved legislature was elected,
    // then freeze it behind the player and stand the devolved chamber up
    state.day = devolvedStart.day;
    catchUpArena(state, rng, devolvedStart.day);
    state.startDay = devolvedStart.day;
    state.player.enteredParliament = devolvedStart.day;
    // the Westminster seat was a placeholder for a member who never sat there;
    // clear the marker so a later move to the Commons does not hand them that seat
    for (const seat of state.seatMap) delete seat.isPlayerSeat;
    state.player.seatId = '';
    startInNation(state, rng, devolvedStart.arena, originalParty);
    state.rngState = rng.state;
  }

  return state;
}
