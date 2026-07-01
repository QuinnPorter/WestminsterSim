import { DecisionCard } from '../../types/content';

/** Cashing in a banked journalist favour to spike or soften a live story.
 *  Gated on a held journalist favour plus a scandal actually in play, so the
 *  option only surfaces when there is something worth burning it on. Spending
 *  the favour is powerful but final — it costs the relationship, a sliver of
 *  integrity, and can never be called in again. */
export const FAVOUR_SPEND_CARDS: DecisionCard[] = [
  {
    id: 'fav_spike_breaking',
    title: 'The favour you saved',
    body: '{journalist} owes you one, and you have never called it in. A story about you is being written up the corridor at this very paper — you know because {journalist} told you, quietly, as a friend. One word from them to the newsdesk and it dies before the morning conference. That word costs you the favour.',
    speaker: 'journalist',
    tags: ['scandal', 'media', 'serious'],
    weight: 24, cooldownDays: 400,
    requires: { hasFavour: ['journalist'], flags: { scandal_stage: 1 } },
    choices: [
      {
        label: 'Call it in — kill the story',
        effects: {
          spendFavour: { kind: 'journalist' },
          setFlags: { scandal_stage: 0, scandal: false, scandal_denied: false },
          stats: { integrity: -3 },
          relationships: [{ kind: 'journalist', delta: -4 }],
        },
        outcomeText: 'The splash becomes a single paragraph on page nineteen, and then nothing. {journalist} does it — and looks at you differently afterwards, the way you look at a debt finally settled. The favour is gone, and so is the pretence that you two are on the same side.',
      },
      {
        label: 'Ask only that they soften it',
        effects: {
          spendFavour: { kind: 'journalist' },
          setFlags: { scandal_denied: false },
          stats: { integrity: -1, partyStanding: 2 },
          relationships: [{ kind: 'journalist', delta: -1 }],
        },
        outcomeText: 'You do not ask them to bury it — only to write it straight, without the adjectives that turn a lapse into a scandal. They agree. The story runs, dull and survivable, and dies in a day. The favour is spent, but spent cleanly.',
      },
      {
        label: 'Let it run — keep the favour',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You thank {journalist} for the warning and tell them to write what they must. Some favours are worth more unspent — a card you can still play, and the quiet knowledge that you did not flinch. Now to face the story on its merits.',
      },
    ],
  },
  {
    id: 'fav_soften_inquiry',
    title: 'A word to the lobby',
    body: 'The inquiry into your affairs is the story now, and the coverage is setting the weather for the verdict. {journalist} still owes you the favour you have been hoarding. A sympathetic framing over the next fortnight — "a process, not a scandal" — would not save you, but it would stop the pile-on. It would also empty the account for good.',
    speaker: 'journalist',
    tags: ['scandal', 'media', 'serious'],
    weight: 20, cooldownDays: 400,
    requires: { hasFavour: ['journalist'], flags: { scandal_stage: 2 } },
    choices: [
      {
        label: 'Spend it on friendlier coverage',
        effects: {
          spendFavour: { kind: 'journalist' },
          stats: { integrity: -2, partyStanding: 3 },
          relationships: [{ kind: 'journalist', delta: -2 }],
        },
        outcomeText: 'The paper\'s tone shifts from prosecution to sceptical curiosity, and the herd shifts with it. It does not change the facts, but it changes the volume, and volume is half of everything. The favour is spent. You will miss having it.',
      },
      {
        label: 'Save the favour for a worse day',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'You decide the inquiry will end how it ends, and a friendly headline now is a favour wasted on a battle already half-lost. Better to keep the card for a day you cannot yet see. You ride out the coverage on your own account.',
      },
    ],
  },
  {
    id: 'fav_spike_donor',
    title: 'The story that will not die',
    body: 'The scandal that attached itself to your name keeps finding new legs — a follow-up here, a diary item there. {journalist}, who owes you, mentions that the next instalment is nearly filed. You could ask them to let it drop. It would cost you the one favour you have been saving all this time.',
    speaker: 'journalist',
    tags: ['scandal', 'media'],
    weight: 16, cooldownDays: 500,
    requires: { hasFavour: ['journalist'], flags: { scandal: true, scandal_stage: false } },
    choices: [
      {
        label: 'Ask them to let it drop',
        effects: {
          spendFavour: { kind: 'journalist' },
          setFlags: { scandal: false },
          stats: { integrity: -2, profile: -1 },
          relationships: [{ kind: 'journalist', delta: -3 }],
        },
        outcomeText: 'The follow-up never runs, and without fresh oxygen the whole thing finally suffocates. {journalist} obliges, once, and makes clear it was the last time. The scandal falls off your record. The favour falls off with it.',
      },
      {
        label: 'Endure it — the favour is worth more',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You let the story run its course rather than burn your one favour smothering it. It is a grim few weeks, but the account stays open — and a favour with a journalist is a rare and appreciating asset.',
      },
    ],
  },
];
