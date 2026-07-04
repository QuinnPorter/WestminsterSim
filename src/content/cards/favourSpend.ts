import { DecisionCard } from '../../types/content';

/** Cashing in a banked favour to spike or soften a live story.
 *  Gated on any held favour plus a scandal actually in play, so the
 *  option only surfaces when there is something worth burning it on. Whoever
 *  owes you, a called-in debt can reach a friendly desk. Spending the favour
 *  is powerful but final — it costs a sliver of integrity and can never be
 *  called in again. */
export const FAVOUR_SPEND_CARDS: DecisionCard[] = [
  {
    id: 'fav_spike_breaking',
    title: 'The favour you saved',
    body: 'You are owed a favour, and you have never called it in. A story about you is being written up the corridor at the paper — you know because {journalist} told you, quietly, as a friend. Call in the debt and a word reaches the newsdesk before the morning conference; the story dies. That word costs you the favour.',
    speaker: 'journalist',
    tags: ['scandal', 'media', 'serious'],
    weight: 24, cooldownDays: 400,
    requires: { hasFavour: true, flags: { scandal_stage: 1 } },
    choices: [
      {
        label: 'Call it in — kill the story',
        effects: {
          spendFavour: true,
          setFlags: { scandal_stage: 0, scandal: false, scandal_denied: false },
          stats: { integrity: -3 },
          relationships: [{ kind: 'journalist', delta: -4 }],
        },
        outcomeText: 'The splash becomes a single paragraph on page nineteen, and then nothing. The debt is called in, the word goes where it needs to — and {journalist} looks at you differently afterwards, the way you look at a debt finally settled. The favour is gone, and so is the pretence that it was ever just goodwill.',
      },
      {
        label: 'Ask only that they soften it',
        effects: {
          spendFavour: true,
          setFlags: { scandal_denied: false },
          stats: { integrity: -1, partyStanding: 2 },
          relationships: [{ kind: 'journalist', delta: -1 }],
        },
        outcomeText: 'You do not ask for it to be buried — only written straight, without the adjectives that turn a lapse into a scandal. The debt is called in, and the desk agrees. The story runs, dull and survivable, and dies in a day. The favour is spent, but spent cleanly.',
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
    body: 'The inquiry into your affairs is the story now, and the coverage is setting the weather for the verdict. You are still holding the favour you have been hoarding, and calling it in could put a sympathetic framing on a friendly desk. A fortnight of "a process, not a scandal" would not save you, but it would stop the pile-on. It would also empty the account for good.',
    speaker: 'journalist',
    tags: ['scandal', 'media', 'serious'],
    weight: 20, cooldownDays: 400,
    requires: { hasFavour: true, flags: { scandal_stage: 2 } },
    choices: [
      {
        label: 'Spend it on friendlier coverage',
        effects: {
          spendFavour: true,
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
    body: 'The scandal that attached itself to your name keeps finding new legs — a follow-up here, a diary item there. {journalist} mentions that the next instalment is nearly filed. You are owed a favour, and calling in the debt could see the story quietly dropped. It would cost you the one favour you have been saving all this time.',
    speaker: 'journalist',
    tags: ['scandal', 'media'],
    weight: 16, cooldownDays: 500,
    requires: { hasFavour: true, flags: { scandal: true, scandal_stage: false } },
    choices: [
      {
        label: 'Ask them to let it drop',
        effects: {
          spendFavour: true,
          setFlags: { scandal: false },
          stats: { integrity: -2, profile: -1 },
          relationships: [{ kind: 'journalist', delta: -3 }],
        },
        outcomeText: 'The follow-up never runs, and without fresh oxygen the whole thing finally suffocates. A word from the right quarter reaches the desk, once, and it is made clear it was the last time. The scandal falls off your record. The favour falls off with it.',
      },
      {
        label: 'Endure it — the favour is worth more',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You let the story run its course rather than burn your one favour smothering it. It is a grim few weeks, but the account stays open — and a favour in the bank is a rare and appreciating asset.',
      },
    ],
  },
];
