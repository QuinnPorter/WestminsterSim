import { ArenaId, DrawnCard, GameDay, GameState } from '../types/game';
import { chamberAt } from '../data/chambers';

/**
 * Rewrite Commons-specific nouns into the live chamber's.
 *
 * Why a substitution and not several hundred rewritten strings: the forced
 * events and calendar set-pieces build their prose in code — reshuffle offers,
 * dismissals, leadership ballots, the Speaker's election, the wilderness years,
 * recess, conference — and there are several hundred of those strings across
 * career.ts and scheduler.ts. They are Westminster English throughout, and a
 * Holyrood player would otherwise meet "Number 10", a Speaker refereeing "the
 * Commons", and leadership ballots counted in "MPs".
 *
 * This runs ONLY on generated text. Deck cards are gated by `requires.arena` and
 * authored for the chamber they fire in — and a Holyrood card saying "Westminster"
 * usually means the UK government, which is correct and must not be touched.
 * `resolveTokens` handles those.
 *
 * Order matters: longer phrases first, so "the House of Commons" is consumed
 * before "the Commons", and "Deputy Prime Minister" before "Prime Minister". The
 * one trap: the Scottish NATIONAL Party. Any rule touching "national" must leave
 * the party's name alone, so the name is shielded before the pass and restored
 * after it.
 */
function rules(arena: ArenaId, day: GameDay): [RegExp, string][] {
  const c = chamberAt(arena, day);
  const houseNoArticle = c.house.replace(/^the /, '');
  const scottish = arena === 'scotland';
  const finance = 'Finance Secretary';
  return [
    // the polity, while no chamber name has been inserted yet
    [/\bnationwide\b/g, `${c.place}-wide`],
    [/\bacross the country\b/g, `across ${c.place}`],
    [/\b[Tt]he country\b/g, c.place],
    [/\b[Tt]he nation\b/g, c.place],
    [/\bBritain\b/g, c.place],
    [/\b[Tt]he British public\b/g, `the ${c.placeAdjective} public`],
    [/\bBritish voters\b/g, `${c.placeAdjective} voters`],

    // the head of government, and the building they work in
    [/\bDeputy Prime Minister\b/g, `Deputy ${c.head}`],
    [/\bFirst Secretary of State\b/g, `Deputy ${c.head}`],
    [/\bPrime Ministers\b/g, `${c.head}s`],
    [/\bPrime Minister[’']s Questions\b/g, `${c.head}’s Questions`],
    [/\bPrime Minister\b/g, c.head],
    [/\bPMQs\b/g, 'FMQs'],
    [/\b[Tt]he PM\b/g, `the ${c.head}`],
    [/\bPM\b/g, c.head],
    [/\bDowning Street\b/g, c.headOffice],
    [/\bNumber (?:10|Ten)\b/g, c.headOffice],
    [/\bNo\.? ?10\b/g, c.headOffice],
    [/\bWhitehall\b/g, scottish ? 'St Andrew’s House' : 'Cathays Park'],
    [/\b[Tt]he Treasury\b/g, scottish ? 'the Scottish Government’s finance directorate' : 'the Welsh Treasury'],
    [/\b[Tt]he Chancellor of the Exchequer\b/g, `the ${finance}`],
    [/\bChancellor of the Exchequer\b/g, finance],
    [/\b[Tt]he Chancellor\b/g, `the ${finance}`],
    [/\bShadow Chancellor\b/g, `Shadow ${finance}`],
    [/\bCabinet Office\b/g, scottish ? 'St Andrew’s House' : 'Cathays Park'],

    // the ranks
    [/\bSecretaries of State\b/g, 'Cabinet Secretaries'],
    [/\bSecretary of State\b/g, 'Cabinet Secretary'],
    [/\bMinisters of State\b/g, 'Ministers'],
    [/\bMinister of State\b/g, 'Minister'],
    [/\bParliamentary Private Secretar(y|ies)\b/g, scottish ? 'Parliamentary Liaison Officer$1' : 'parliamentary aide$1'],
    [/\bPPSs\b/g, scottish ? 'PLOs' : 'aides'],
    [/\bPPS\b/g, scottish ? 'PLO' : 'aide'],
    [/\bChief Whip\b/g, scottish ? 'Minister for Parliamentary Business' : 'Trefnydd'],
    [/\b[Tt]he Speaker\b/g, `the ${c.speakerTitle}`],
    [/\bSpeaker of the House of Commons\b/g, c.speakerTitle],
    [/\bMr Speaker\b/g, c.speakerTitle],
    [/\b[Tt]he 1922 Committee\b/g, 'the group'],
    [/\b[Tt]he 1922\b/g, 'the group'],
    [/\b[Tt]he parliamentary party\b/g, 'the group'],
    [/\b[Tt]he (?:Shadow )?Cabinet table\b/g, 'the Cabinet table'],

    // the chamber itself
    [/\b[Tt]he House of Commons\b/g, c.houseThe],
    [/\bHouse of Commons\b/g, houseNoArticle],
    [/\b[Tt]he Commons\b/g, c.houseThe],
    [/\b[Tt]he green benches\b/g, 'the benches'],
    [/\b[Tt]he despatch box\b/g, 'the lectern'],
    [/\b[Tt]he Lords\b/g, 'the other place'],
    [/\b[Tt]he other place\b/g, 'the Lords'],
    [/\bWestminster\b/g, c.seat],
    [/\bParliament Square\b/g, c.seat],
    [/\b[Tt]he tearoom\b/g, 'the members’ restaurant'],
    [/\bPortcullis House\b/g, scottish ? 'the Garden Lobby' : 'Tŷ Hywel'],
    // "Parliament is dissolved" -> "the Chamber is dissolved"; the article and
    // the capital are repaired by `tidy`. Scotland keeps the word, since the
    // Scottish Parliament IS a parliament.
    ...(scottish ? [] : [
      [/\b[Tt]he Parliament\b/g, c.houseThe] as [RegExp, string],
      [/\bParliament\b/g, c.houseThe] as [RegExp, string],
      [/\bparliaments\b/g, 'Senedd terms'] as [RegExp, string],
      [/\bparliament\b/g, 'Senedd term'] as [RegExp, string],
    ]),
    [/\bgeneral election\b/g, `${c.houseThe.replace(/^the /, '')} election`],
    [/\bGeneral election\b/g, `${c.houseThe.replace(/^the /, '')} election`],

    // the members
    [/\bMPs\b/g, c.members],
    [/\bMP\b/g, c.member],
    [/\bbackbench MPs\b/gi, `backbench ${c.members}`],
  ];
}

/** the Scottish National Party must survive a pass that rewrites "national" */
const SHIELD: [RegExp, string][] = [
  [/Scottish National Party/g, '\u0001SNPFULL\u0001'],
  [/National Assembly/g, '\u0001NATASM\u0001'],
];
const UNSHIELD: [RegExp, string][] = [
  [/\u0001SNPFULL\u0001/g, 'Scottish National Party'],
  [/\u0001NATASM\u0001/g, 'National Assembly'],
];

/** apply the chamber's voice to one string; a no-op in the Commons */
export function chamberVoice(arena: ArenaId, text: string, day: GameDay = Number.MAX_SAFE_INTEGER): string {
  if (arena === 'uk' || !text) return text;
  let out = text;
  for (const [pattern, replacement] of SHIELD) out = out.replace(pattern, replacement);
  for (const [pattern, replacement] of rules(arena, day)) out = out.replace(pattern, replacement);
  for (const [pattern, replacement] of UNSHIELD) out = out.replace(pattern, replacement);
  return tidy(out);
}

/** Repair the seams a phrase-level substitution leaves behind: a doubled
 *  article where the replacement already carried one, and a lost capital where
 *  the replaced word had started a sentence. */
function tidy(text: string): string {
  return text
    .replace(/\bthe the\b/g, 'the')
    .replace(/\bThe the\b/g, 'The')
    .replace(/\ba the\b/g, 'the')
    .replace(/\bin the Holyrood\b/g, 'at Holyrood')
    .replace(/\bin the Cardiff Bay\b/g, 'in Cardiff Bay')
    .replace(/^the\b/, 'The')
    .replace(/([.!?—]\s+|["“”]\s*)the\b/g, (_m, lead: string) => `${lead}The`);
}

/** Cards that are ABOUT the other chamber, and must keep its vocabulary.
 *  "Westminster is asking" is the whole point of a recruitment card; running it
 *  through the Holyrood voice turns it into "Holyrood is asking", which is both
 *  wrong and confusing. These build their own chamber nouns explicitly. */
const SPEAKS_FOR_ITSELF = new Set(['ukRecruit', 'devolvedDraft']);

export function exemptFromChamberVoice(kind: string | undefined): boolean {
  return !!kind && SPEAKS_FOR_ITSELF.has(kind);
}

/** apply it to every piece of prose on a generated card, in place */
export function speakAsChamber(state: GameState, card: DrawnCard): DrawnCard {
  const arena = state.arena ?? 'uk';
  if (arena === 'uk' || exemptFromChamberVoice(card.kind)) return card;
  const v = (t: string) => chamberVoice(arena, t, state.day);
  card.title = v(card.title);
  card.body = v(card.body);
  card.choices = card.choices.map((ch) => ({
    ...ch,
    label: v(ch.label),
    ...(ch.sublabel ? { sublabel: v(ch.sublabel) } : {}),
  }));
  if (card.outcome) card.outcome = { ...card.outcome, text: v(card.outcome.text) };
  return card;
}

/** apply it to a forced/calendar outcome before it is shown */
export function outcomeAsChamber<T extends { text: string }>(state: GameState, outcome: T): T {
  const arena = state.arena ?? 'uk';
  if (arena === 'uk') return outcome;
  return { ...outcome, text: chamberVoice(arena, outcome.text, state.day) };
}
