import { DrawnCard, GameDay, GameState, PartyId, RegionId } from '../types/game';
import {
  Mayoralty, MayoralVotingSystem, mayoraltiesIn, mayoraltyById, mayoraltyOn, mayoralVotingSystemAt,
  nextMayoralElection,
} from '../data/mayoralties';
import { PARTIES, partyNameIn, partyNameWithArticle } from '../data/parties';
import { partyPollingShare } from './polling';
import { formatMonthYear } from './clock';
import { Rng, clamp } from './rng';

/**
 * The metro-mayor interlude, as a model: who is asked to run, how the count
 * goes, and the cards' prose. The transitions that move the player in and out
 * of City Hall live in career.ts (they strip offices and seat candidates), the
 * mayor's turn in scheduler.ts. Nothing here reads a chamber but the Commons.
 */

// ---------------------------------------------------------------------------
// the draft
// ---------------------------------------------------------------------------

/** the per-tick chance a party asks an eligible MP to run, at full regional
 *  strength. A London Labour MP elected in 2019 has eight or so eligible ticks
 *  before the May 2021 poll, so this gives roughly a two-in-five chance of
 *  being asked that cycle. */
export const MAYOR_DRAFT_CHANCE = 0.06;
export const MAYOR_DRAFT_MIN_PROFILE = 40;
/** below the first ministerial rungs, a bigger name is needed */
export const MAYOR_DRAFT_PROFILE_WITHOUT_RANK = 55;
export const MAYOR_DRAFT_COOLDOWN = 365 * 8;
/** the poll must be this far off: time to be selected, not so far that nobody is thinking about it */
export const MAYOR_DRAFT_WINDOW = { min: 60, max: 420 };
/** no approach when a general election is this close */
export const MAYOR_DRAFT_GE_CLEARANCE = 120;
/** the odds of winning the party's selection, before the campaign choices */
export const MAYOR_SELECTION_BASE = 0.55;

export interface MayorDraftTarget {
  mayoralty: Mayoralty;
  pollingDay: GameDay;
}

/** The mayoralty an MP might be asked to run for: in their own region, with a
 *  poll in the window, for a member with a profile worth running on. Draws
 *  nothing. The caller supplies the chamber-side gates (seated, no office bar). */
export function mayorDraftTarget(state: GameState): MayorDraftTarget | null {
  if ((state.arena ?? 'uk') !== 'uk') return null;
  const p = state.player;
  if (!p.hasSeat || p.mayor || p.mayorCandidacy || p.officeId === 'leader' || p.partyId === 'ind') return null;
  if (p.stats.profile < MAYOR_DRAFT_MIN_PROFILE) return null;
  const peak = Number(p.flags._peakTier ?? 0);
  if (peak < 2 && p.stats.profile < MAYOR_DRAFT_PROFILE_WITHOUT_RANK) return null;
  if (state.nextElectionBy - state.day < MAYOR_DRAFT_GE_CLEARANCE) return null;
  const last = p.flags._lastMayorDraftDay;
  if (typeof last === 'number' && state.day - last < MAYOR_DRAFT_COOLDOWN) return null;
  let best: MayorDraftTarget | null = null;
  for (const m of mayoraltiesIn(p.region, state.day)) {
    const pollingDay = nextMayoralElection(m, state.day);
    const lead = pollingDay - state.day;
    if (lead < MAYOR_DRAFT_WINDOW.min || lead > MAYOR_DRAFT_WINDOW.max) continue;
    if (!best || pollingDay < best.pollingDay) best = { mayoralty: m, pollingDay };
  }
  return best;
}

/** a party on fifteen per cent in the region rarely bothers an MP; one that
 *  expects to win asks */
export function mayorDraftChance(state: GameState, target: MayorDraftTarget): number {
  const strength = regionalStrength(state, state.player.partyId, target.mayoralty.region);
  return MAYOR_DRAFT_CHANCE * clamp(strength / 0.35, 0.25, 1);
}

/** the odds of winning the selection, from the member's standing with the party
 *  and their public name */
export function mayorSelectionOdds(state: GameState): number {
  const s = state.player.stats;
  return clamp(MAYOR_SELECTION_BASE + (s.profile - 50) / 200 + (s.partyStanding - 50) / 250, 0.2, 0.9);
}

// ---------------------------------------------------------------------------
// the count
// ---------------------------------------------------------------------------

/** a party's mean vote share across the region's seats at the last count, or
 *  its national polling where it holds no ground there */
export function regionalStrength(state: GameState, party: PartyId, region: RegionId): number {
  const seats = state.seatMap.filter((s) => s.region === region && s.kind !== 'list' && s.winner !== 'spk');
  if (seats.length === 0) return partyPollingShare(state, party);
  let total = 0;
  for (const s of seats) total += s.shares[party] ?? 0;
  return total / seats.length;
}

export interface MayoralCount {
  system: MayoralVotingSystem;
  /** first preferences (or the only round), by party, summing to one */
  firstRound: Partial<Record<PartyId, number>>;
  /** the supplementary vote's run-off, where one was needed */
  finalRound?: { parties: [PartyId, PartyId]; shares: [number, number] };
  winner: PartyId;
  /** did the player (standing for their party) win */
  won: boolean;
}

/** the player's own pull at the ballot box: a known name and a liked record */
function personalVote(state: GameState, incumbent: boolean): number {
  const s = state.player.stats;
  return (s.profile - 50) / 100 * 0.12 + (s.constituencyApproval - 50) / 100 * 0.04 + (incumbent ? 0.03 : 0);
}

/** The mayoral election. Party strength in the region, the player's personal
 *  vote and some noise decide the first round; under the supplementary vote the
 *  top two go to a run-off and the others' voters transfer by ideological
 *  distance. First past the post is the plurality. Draws from the main stream:
 *  by now the career has long since left the Commons' path. */
export function mayoralResult(
  state: GameState, rng: Rng, mayoralty: Mayoralty, opts: { incumbent: boolean; bonus?: number }
): MayoralCount {
  const system = mayoralVotingSystemAt(state.day);
  const mine = state.player.partyId;
  const region = mayoralty.region;
  const candidates = (Object.keys(PARTIES) as PartyId[]).filter((p) =>
    p === mine || (PARTIES[p].contestsRegions.includes(region) && regionalStrength(state, p, region) >= 0.03));
  const raw: Partial<Record<PartyId, number>> = {};
  let sum = 0;
  for (const p of candidates) {
    let v = regionalStrength(state, p, region) + rng.normal(0, 0.05);
    if (p === mine) v += personalVote(state, opts.incumbent) + (opts.bonus ?? 0);
    v = Math.max(0.01, v);
    raw[p] = v;
    sum += v;
  }
  const firstRound: Partial<Record<PartyId, number>> = {};
  for (const p of candidates) firstRound[p] = (raw[p] ?? 0) / sum;
  const ranked = [...candidates].sort((a, b) => (firstRound[b] ?? 0) - (firstRound[a] ?? 0));
  if (system === 'fptp' || ranked.length < 3) {
    const winner = ranked[0];
    return { system, firstRound, winner, won: winner === mine };
  }
  // the supplementary vote: the two leaders go through, the rest transfer
  const [a, b] = ranked;
  const transfers: [number, number] = [0, 0];
  const TRANSFER_RATE = 0.6;
  for (const p of ranked.slice(2)) {
    const wA = 1 / (1 + Math.abs(PARTIES[p].ideology - PARTIES[a].ideology) / 20);
    const wB = 1 / (1 + Math.abs(PARTIES[p].ideology - PARTIES[b].ideology) / 20);
    const moving = (firstRound[p] ?? 0) * TRANSFER_RATE;
    transfers[0] += moving * wA / (wA + wB);
    transfers[1] += moving * wB / (wA + wB);
  }
  const shares: [number, number] = [(firstRound[a] ?? 0) + transfers[0], (firstRound[b] ?? 0) + transfers[1]];
  const winner = shares[0] >= shares[1] ? a : b;
  return { system, firstRound, finalRound: { parties: [a, b], shares }, winner, won: winner === mine };
}

/** the count in a sentence, for the history */
export function countHeadline(state: GameState, mayoralty: Mayoralty, count: MayoralCount): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const who = count.won ? state.player.name : `${partyNameWithArticle(count.winner, 'uk')}’s candidate`;
  if (count.finalRound) {
    const [i, j] = count.finalRound.parties[0] === count.winner ? [0, 1] : [1, 0];
    return `${who} elected ${mayoralty.name}, ${pct(count.finalRound.shares[i])} to ${pct(count.finalRound.shares[j])} in the run-off`;
  }
  return `${who} elected ${mayoralty.name} with ${pct(count.firstRound[count.winner] ?? 0)} of the vote`;
}

// ---------------------------------------------------------------------------
// the mayor's standing
// ---------------------------------------------------------------------------

/** the office the player holds today, successor included */
export function playerMayoralty(state: GameState): Mayoralty | undefined {
  const id = state.player.mayor?.mayoralty ?? state.player.mayorCandidacy?.mayoralty;
  return id ? (mayoraltyOn(id, state.day) ?? mayoraltyById(id)) : undefined;
}

/** a full term served, or a re-election won: the record that counts as senior
 *  on a return to the Commons */
export function servedFullTerm(state: GameState): boolean {
  const m = state.player.mayor;
  if (!m) return false;
  return m.terms >= 2 || state.day - m.since >= Math.round(3.5 * 365);
}

/** the title pill for a mayor */
export function mayorTitle(state: GameState): string {
  return playerMayoralty(state)?.name ?? 'Mayor';
}

// ---------------------------------------------------------------------------
// the cards' prose
// ---------------------------------------------------------------------------

export function buildMayorDraftCard(state: GameState, rng: Rng, payload: Record<string, unknown> | undefined): DrawnCard {
  const step = (payload?.step as number) ?? 1;
  const m = mayoraltyById(payload?.mayoralty as string);
  const name = m?.name ?? 'the mayoralty';
  const city = m?.city ?? 'the region';
  const party = partyNameIn(state.player.partyId, 'uk');
  const odds = Math.round(((payload?.winChance as number) ?? mayorSelectionOdds(state)) * 100);
  const polling = formatMonthYear((payload?.pollingDay as number) ?? state.day);
  if (step === 1) {
    return {
      cardId: `forced_mayordraft1_${state.day}`,
      kind: 'mayorDraft',
      title: `Run for ${name}?`,
      body: `The regional party has been round the table twice and keeps landing on your name. The ${name} is up in ${polling}, their field is thin, and somebody who already has a Westminster profile across ${city} would start ahead. The catch is the one everybody knows: a mayor cannot sit in the Commons, so winning means resigning your seat and running a city from an office with no whips in it. Losing means staying exactly where you are, having told everyone you wanted to leave.`,
      choices: [
        { label: 'Put your name forward', sublabel: 'seek the selection' },
        { label: 'Your work is in Parliament', sublabel: 'decline, graciously' },
      ],
      payload: { ...payload, step: 1, advance: rng.int(7, 14) },
    };
  }
  if (step === 2) {
    return {
      cardId: `forced_mayordraft2_${state.day}`,
      kind: 'mayorDraft',
      title: 'The selection',
      body: `Six weeks of hustings in ${city}: council chambers, trade-union halls, a leisure centre that smells of chlorine. The members will choose the ${party} candidate, and the question at every stop is why somebody with a seat in Parliament wants a job running buses. Right now they are about ${odds > 60 ? 'warm' : odds > 45 ? 'split' : 'cool'} on you.`,
      choices: [
        { label: 'Run on the Westminster record', sublabel: 'the person who can get the Treasury to pick up the phone' },
        { label: 'Run as the local champion', sublabel: `${city} first, the party second` },
        { label: 'Spend every favour you have', sublabel: 'costly, and it moves members' },
      ],
      payload: { ...payload, step: 2, advance: rng.int(21, 35) },
    };
  }
  return {
    cardId: `forced_mayordraft3_${state.day}`,
    kind: 'mayorDraft',
    title: 'The members decide',
    body: `The result is read out in a hotel function room with a projector that does not work, to a party that has spent six weeks deciding whether it trusts you with ${city}.`,
    choices: [{ label: 'Hear the result' }, { label: 'Wait outside' }],
    payload: { ...payload, step: 3, advance: rng.int(3, 9) },
  };
}

export function buildMayorElectionCard(state: GameState, rng: Rng, payload: Record<string, unknown> | undefined): DrawnCard {
  const m = playerMayoralty(state);
  const name = m?.name ?? 'the mayoralty';
  const city = m?.city ?? 'the city';
  const reElection = payload?.reElection === true;
  const system = mayoralVotingSystemAt(state.day);
  const systemLine = system === 'sv'
    ? 'Second preferences will decide it if nobody clears half.'
    : 'First past the post: whoever is ahead on the night takes it.';
  return {
    cardId: `forced_mayorelection_${state.day}`,
    kind: 'mayorElection',
    title: reElection ? `${name}: the re-election` : `Polling day across ${city}`,
    body: reElection
      ? `Four years of ${city} and now the voters get their say on them. The posters say your name without a party on half of them, which your agent calls a strength and your party calls a problem. ${systemLine}`
      : `Polling day for ${name}. You have knocked on more doors in ${city} in six weeks than in your whole time as its MP, and tonight the count will tell you whether that was the beginning of something or an expensive way to annoy your whips. ${systemLine}`,
    choices: [
      { label: 'One last push on the doorsteps', sublabel: 'knock until the polls close' },
      { label: 'Rest, and wait for the count', sublabel: 'it is done; let it be done' },
    ],
    payload: { ...payload, advance: rng.int(2, 5) },
  };
}

export function buildMayorReturnOfferCard(state: GameState, rng: Rng): DrawnCard {
  const m = playerMayoralty(state);
  const city = m?.city ?? 'the city';
  const party = partyNameIn(state.player.partyId, 'uk');
  return {
    cardId: `forced_mayorreturn_${state.day}`,
    kind: 'mayorReturnOffer',
    title: 'A seat, if you want it',
    body: `A general election is coming and the ${party} has a seat in ${city} it would like you to take: a retirement nobody expected, a selection it can arrange. Stand and win and you are back in the Commons with the mayoralty behind you; stand and lose and you are still the mayor, with a defeat on the record. Say no and the question will not be asked again this parliament.`,
    choices: [
      { label: 'Stand for the Commons', sublabel: 'if you win, City Hall gets a new mayor' },
      { label: 'Stay at City Hall', sublabel: 'the job is not finished' },
    ],
    payload: { advance: rng.int(7, 14) },
  };
}

export function buildLostMayoraltyCard(state: GameState, rng: Rng, payload: Record<string, unknown> | undefined): DrawnCard {
  const label = (payload?.label as string) ?? 'the mayoralty';
  return {
    cardId: `forced_lostmayor_${state.day}`,
    kind: 'lostMayoralty',
    title: 'Out of City Hall',
    body: `The count goes against you, and by morning there is a new ${label}. You have no seat to go back to; the Commons is a general election away and a selection you would have to win first. The local party is sympathetic, which is how parties say it is sorry for your loss.`,
    choices: [
      { label: 'Seek a Commons seat at the next election', sublabel: 'the wilderness, with a candidacy' },
      { label: 'Leave politics', sublabel: 'the career ends here' },
    ],
    payload: { ...payload, advance: rng.int(14, 30) },
  };
}

/** the general election, watched from City Hall */
export function buildMayorBystanderCard(state: GameState, rng: Rng): DrawnCard {
  const m = playerMayoralty(state);
  const city = m?.city ?? 'the city';
  return {
    cardId: `forced_campaign_mayor_${state.day}`,
    kind: 'campaign',
    title: 'A general election, from City Hall',
    body: `Parliament is dissolved and the national campaign rolls through ${city} with its battle buses and its borrowed slogans. You are not on the ballot. You are, however, the best-known politician in the region, and both sides have noticed.`,
    choices: [
      { label: 'Campaign for the party across the region', sublabel: 'the mayor as the local face' },
      { label: 'Stay above it: the mayor is for everyone', sublabel: 'open things; shake hands; sign nothing' },
      { label: 'Quietly take soundings about a seat', sublabel: 'for next time' },
    ],
    payload: { step: 1, bystander: true, advance: rng.int(30, 45) },
  };
}

/** the chosen exit, with City Hall in place of the Commons */
export function mayorExitProse(role: 'peerage' | 'international' | 'executive' | 'university'): { body: string; stay: string; decline: string } {
  const bodies: Record<typeof role, string> = {
    peerage: 'A discreet lunch, a discreet offer. The party would like to send you to the other place: a peerage, a red bench, and a title to carry the rest of your days. For a mayor it is the establishment’s way of saying the city has had its turn, and so have you. City Hall would go on without you.',
    international: 'The approach comes through familiar channels: an international role, the kind that trades a city for a delegation and a motorcade. Serious work for a serious late career, and the end of yours in elected office; a city is a hard thing to hand back.',
    executive: 'A headhunter, a good bottle, and a number with a lot of noughts. There is an executive role waiting for somebody who knows how a city is actually run and which minister actually decides. The money is real; so is what the local paper will say about who you were really working for.',
    university: 'A university comes calling: would you be its Chancellor? Robes and Latin, degree ceremonies and a seat at High Table, a role that asks for gravitas and gives back dignity. No precept, no planning committee, no more Friday surgeries in a shopping centre. Just a green campus, and the slow applause of an institution that respects you.',
  };
  const declines: Record<typeof role, string> = {
    peerage: 'You thank them, and decline. The red benches can wait; there is a city here yet, and you are not done with it.',
    international: 'You turn it down. The world stage is a fine thing, but your stage is here, for a while longer at least.',
    executive: 'You pass on the boardroom and the noughts. The contacts book will keep, and so, for now, will City Hall.',
    university: 'You decline the robes, with real regret. Not yet. There is unfinished business in the city, and you mean to finish it.',
  };
  return { body: bodies[role], stay: 'Stay at City Hall', decline: declines[role] };
}
