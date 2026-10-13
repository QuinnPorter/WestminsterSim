import { DrawnCard, GameState, PartyId } from '../types/game';
import { partyNameIn, partyNameWithArticle } from '../data/parties';
import { inGovernmentBloc } from './executive';
import { partyPollingShare } from './polling';
import { playerMayoralty, servedFullTerm } from './mayor';
import { draftOdds } from './draftOdds';
import { characterName } from './relationships';
import { Rng, clamp } from './rng';

/**
 * Leading the party from outside the chamber: a sitting mayor drafted to lead
 * an opposition or minor party at Westminster without a Commons seat, who must
 * win one at the next general election or lose the leadership. The model and
 * the prose live here; the transitions (the win, the stand, the strip) live in
 * career.ts beside the mayor's, and the scheduler routes a seatless leader
 * through the ordinary turn with two gates opened and one deck swapped.
 *
 * Very rare and hard, by design: only a mayor with a full term behind them and
 * a national name is asked, only when their own party has a vacancy, once per
 * career unless the first attempt failed, and the members then vote at odds
 * below a Westminster draft's.
 */

export const OUTSIDE_MIN_PROFILE = 70;
/** per qualifying vacancy, at full party strength */
export const OUTSIDE_APPROACH_CHANCE = 0.25;
/** the members' vote runs this far below the devolved draft's odds */
export const OUTSIDE_ODDS_PENALTY = 0.15;
/** no approach this close to the mayoral poll or a general election */
export const OUTSIDE_CLEARANCE_DAYS = 120;
/** no second approach within this of the last */
export const OUTSIDE_APPROACH_COOLDOWN = 365 * 3;

/** a party leader with no seat in the chamber (a mayor who was drafted, until
 *  the next general election decides it); derived, so every path that ends a
 *  leadership ends this too */
export function isOutsideLeader(state: GameState): boolean {
  return state.player.officeId === 'leader' && !state.player.hasSeat && !state.player.mayor;
}

/** may `party`'s vacancy be filled by the player from City Hall */
export function outsideDraftEligible(state: GameState, party: PartyId): boolean {
  const p = state.player;
  const mayor = p.mayor;
  if (!mayor || mayor.standingForSeat || party !== p.partyId || party === 'ind' || p.flags._isSpeaker) return false;
  // a party in office cannot be led from outside the House
  if (inGovernmentBloc(state, party)) return false;
  if (p.stats.profile < OUTSIDE_MIN_PROFILE || !servedFullTerm(state)) return false;
  // once per career, unless the first attempt failed
  const attempts = Number(p.flags._outsideDraftAttempts ?? 0);
  if (attempts >= 2 || (attempts === 1 && !p.flags._outsideDraftFailed)) return false;
  const last = p.flags._lastOutsideApproach;
  if (typeof last === 'number' && state.day - last < OUTSIDE_APPROACH_COOLDOWN) return false;
  // not with a poll of either kind close enough to cut the chain short
  if (mayor.nextElection - state.day < OUTSIDE_CLEARANCE_DAYS) return false;
  if (state.nextElectionBy - state.day < OUTSIDE_CLEARANCE_DAYS) return false;
  return true;
}

/** the approach is made: it counts against the career's chances and starts the cooldown */
export function recordOutsideApproach(state: GameState): void {
  state.player.flags._outsideDraftAttempts = Number(state.player.flags._outsideDraftAttempts ?? 0) + 1;
  state.player.flags._lastOutsideApproach = state.day;
}

/** the members said no: a failed first attempt leaves one more */
export function recordOutsideDefeat(state: GameState): void {
  state.player.flags._outsideDraftFailed = true;
}

/** a party polling well asks; one on six per cent has other problems */
export function outsideApproachChance(state: GameState): number {
  return OUTSIDE_APPROACH_CHANCE * clamp(partyPollingShare(state, state.player.partyId) / 0.30, 0.3, 1);
}

/** the members' odds: the devolved draft's formula for a party out of office,
 *  less the penalty for asking them to choose somebody who cannot sit */
export function outsideDraftOdds(state: GameState): number {
  return clamp(draftOdds(state, true) - OUTSIDE_ODDS_PENALTY, 0.05, 0.6);
}

/** the shadow-cabinet member who takes the despatch box for a leader with no
 *  seat: the shadow Chancellor, or whoever sits first on the bench. Only an
 *  opposition leader is proxied (a governing party is never led from outside),
 *  so the bench is always the shadow one. */
export function deputyAtTheBox(state: GameState): string {
  const bench = state.government.shadowCabinet;
  const post = bench.find((p) => p.officeId === 'sos_treasury') ?? bench[0];
  return post ? characterName(state, post.characterId) : 'your deputy';
}

// ---------------------------------------------------------------------------
// the cards' prose
// ---------------------------------------------------------------------------

export function buildOutsideDraftCard(state: GameState, rng: Rng, payload: Record<string, unknown> | undefined): DrawnCard {
  const step = (payload?.step as number) ?? 1;
  const party = (payload?.party as PartyId) ?? state.player.partyId;
  const name = partyNameWithArticle(party, 'uk');
  const office = playerMayoralty(state)?.name ?? 'the mayoralty';
  const odds = Math.round(((payload?.winChance as number) ?? outsideDraftOdds(state)) * 100);
  if (step === 1) {
    return {
      cardId: `forced_outsidedraft1_${state.day}`,
      kind: 'outsideDraft',
      title: `${partyNameIn(party, 'uk')} wants you to lead`,
      body: `The leadership of ${name} is vacant and three people who matter have come to City Hall to ask whether you want it. Not a seat in the Commons: the leadership, from here, with a deputy taking Prime Minister’s Questions until the next general election gives you a seat or takes the job away. Nobody has done it. That, they say, is rather the point.`,
      choices: [
        { label: 'Put your name to the members', sublabel: `resign as ${office} if you win` },
        { label: 'The city comes first', sublabel: 'decline; the party chooses from the Commons' },
      ],
      payload: { ...payload, step: 1, advance: rng.int(7, 14) },
    };
  }
  return {
    cardId: `forced_outsidedraft2_${state.day}`,
    kind: 'outsideDraft',
    title: 'The members decide',
    body: `Six weeks of hustings against candidates who can actually vote in the House, and one question at every one: how do you lead a party you cannot sit with? The members are about ${odds > 45 ? 'split' : odds > 30 ? 'sceptical' : 'cool'} on you. The result is read out in a hall in Westminster you have not been inside for years.`,
    choices: [
      { label: 'Run on the record: you have actually run something', sublabel: 'the mayor who delivered' },
      { label: 'Run on the break: a leader from outside the bubble', sublabel: 'against Westminster, for the members' },
      { label: 'Spend every favour you have', sublabel: 'costly, and it moves members' },
    ],
    payload: { ...payload, step: 2, advance: rng.int(21, 35) },
  };
}

/** the general election: the seat to stand for, chosen before the campaign.
 *  The payload carries both seats' ids for the answer. */
export function buildStandForSeatCard(
  state: GameState, rng: Rng, seats: { regional: { id: string; name: string }; national: { id: string; name: string } }
): DrawnCard {
  return {
    cardId: `forced_standforseat_${state.day}`,
    kind: 'standForSeat',
    title: 'A seat to fight',
    body: `Parliament is dissolved and the leader of ${partyNameWithArticle(state.player.partyId, 'uk')} is not a candidate anywhere. The party has two seats in mind. One is in the region that elected you mayor, where your name is worth something; the other is the safest the party holds, where it is the rosette that wins. Win and you lead from the front bench. Lose and you lead nothing.`,
    choices: [
      { label: `Stand at home: ${seats.regional.name}`, sublabel: 'your own voters, a harder seat' },
      { label: `Take the safe seat: ${seats.national.name}`, sublabel: 'a parachute, and everybody will say so' },
    ],
    payload: { regional: seats.regional.id, national: seats.national.id, advance: rng.int(2, 5) },
  };
}

/** Prime Minister's Questions, taken by a deputy */
export function buildPmqsProxyCard(state: GameState): { title: string; body: string; choices: { label: string }[] } {
  const deputyName = deputyAtTheBox(state);
  return {
    title: 'Questions, by proxy',
    body: `Noon on Wednesday and the one duel that matters is happening without you. ${deputyName} takes the despatch box in your name; you take a chair in a studio across the river and watch the clips arrive. The party is watching too, and it is watching ${deputyName}.`,
    choices: [
      { label: 'Write the six questions yourself' },
      { label: 'Stage your own event at noon' },
      { label: 'Let the deputy have the day' },
    ],
  };
}

export function pmqsProxyOutcome(state: GameState, choiceIndex: number): string {
  const deputyName = deputyAtTheBox(state);
  if (choiceIndex === 0) return `The questions are yours and the answers are the Prime Minister’s, and the clip that travels is of ${deputyName} reading your best line. It lands. The credit splits, which is the price of a proxy.`;
  if (choiceIndex === 1) return `You hold your own press conference at twelve, in the city that elected you, and the lunchtime bulletins have to choose. Half pick you. The whips notice who the other half picked.`;
  return `You let ${deputyName} have the chamber and the day. It is generous, it is noticed, and by the evening two newspapers have decided ${deputyName} looks like a leader. That is what deputies are for, and what they are for is the problem.`;
}

/** the lost-seat card for a leader who never sat */
export function neverHeldProse(partyWon: boolean): { body: string; vow: string; retire: string } {
  return {
    body: partyWon
      ? 'The returning officer reads the numbers and the room goes quiet. Your party is entering Number 10 this morning and you are watching it on a television at a count you lost. A leader who cannot get into the House cannot lead it, and by lunchtime the party has said so.'
      : 'The returning officer reads the numbers and the room goes quiet. The count goes against you, and with it the leadership: a leader who cannot get into the House cannot lead it. Outside, a journalist asks what you will do now.',
    vow: 'You give a gracious speech, congratulate the party you led and the leader it will now choose, and promise the association you will fight the seat again. The wilderness years begin.',
    retire: 'You thank the party for the chance and the city for the years, and step away. Politics will carry on without you; it always does.',
  };
}
