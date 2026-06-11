import { DecisionCard } from '../../types/content';

/** Tier 1-2: PPS bag-carrying and whips' office enforcement. */
export const WHIP_PPS_CARDS: DecisionCard[] = [
  {
    id: 'wp_ministers_diary',
    title: 'The minister\'s shadow',
    body: 'As PPS you are the minister\'s eyes and ears on the backbenches. Tonight they ask you, casually, who among your intake is "sound" and who is trouble. It is a test, and an opportunity, and a small betrayal.',
    speaker: 'leader',
    tags: ['party', 'westminster'],
    weight: 12, cooldownDays: 280,
    requires: { minTier: 1, maxTier: 1 },
    choices: [
      {
        label: 'Give an honest, useful read',
        effects: { relationships: [{ kind: 'leader', delta: 6 }], stats: { partyStanding: 3, integrity: -2 } },
        outcomeText: 'You deliver a shrewd, fair assessment of the intake. The minister is impressed by your antennae and files you under "useful". Your colleagues would be less delighted to know how closely you watch them.',
      },
      {
        label: 'Protect your colleagues, stay vague',
        effects: { relationships: [{ kind: 'ally', delta: 5 }, { kind: 'leader', delta: -3 }], stats: { integrity: 3 } },
        outcomeText: '"Honestly, a good bunch." The minister knows a non-answer when they hear one, and notes that you will not inform on friends — a trait they find admirable and inconvenient in equal measure.',
      },
    ],
  },
  {
    id: 'wp_three_line_enforcer',
    title: 'On the door',
    body: 'You are the whip on the door tonight, and a colleague is wavering on a three-line whip over a genuine constituency conscience issue. The numbers are tight. They look at you, hoping for mercy.',
    tags: ['party', 'serious'],
    weight: 12, cooldownDays: 260,
    requires: { minTier: 2, maxTier: 2 },
    choices: [
      {
        label: 'Lean on them — the line is the line',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 6 }, { kind: 'ally', delta: -4 }], stats: { competence: 2 } },
        outcomeText: 'You remind them, warmly, of the favours owed and the careers made and ended on nights like this. They vote with the party. The Chief Whip notices an enforcer in the making.',
      },
      {
        label: 'Quietly grant them a pass',
        effects: { relationships: [{ kind: 'ally', delta: 6 }, { kind: 'chiefWhip', delta: -5 }], stats: { integrity: 3 } },
        outcomeText: 'You find them an unobtrusive way to abstain and square it later. They will remember the kindness. The Chief Whip, when the numbers come up one short, will also remember.',
      },
    ],
  },
  {
    id: 'wp_pps_resign_temptation',
    title: 'The bag or the cause',
    body: 'The government is about to do something your conscience cannot abide — and as a PPS, the most junior rung of the payroll vote, you are expected to support it without a word. Resigning the unpaid role would be a tiny gesture that makes a surprising amount of noise.',
    tags: ['party', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 1, maxTier: 2 },
    choices: [
      {
        label: 'Resign the role on principle',
        effects: { trigger: 'resignOffice' },
        outcomeText: 'You hand back the bag and your conscience with it. A small resignation, but the first rung is the easiest to jump from — and people remember who jumped first.',
      },
      {
        label: 'Swallow it — you are just starting out',
        effects: { stats: { integrity: -4, partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 3 }] },
        outcomeText: 'You stay loyal and tell yourself the bigger fights are still ahead. The leadership marks you as reliable; the mirror is less complimentary for a week or so.',
      },
    ],
  },
  {
    id: 'wp_carry_the_bag',
    title: 'The bag',
    body: 'As PPS you carry the folder, fetch the water, and sit behind your minister radiating loyalty for the cameras. Today the minister is about to give a wrong answer to a select committee — you know, because you wrote the brief they ignored.',
    tags: ['westminster', 'serious'],
    weight: 14, cooldownDays: 250,
    requires: { minTier: 1, maxTier: 1 },
    choices: [
      {
        label: 'Slip them a corrective note',
        effects: { stats: { competence: 3 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'The note lands mid-sentence; the minister course-corrects without missing a beat. Afterwards they grip your shoulder: "Good catch." Careers are built on good catches.',
      },
      {
        label: 'Let them own the error',
        effects: { stats: { integrity: -2 }, relationships: [{ kind: 'rival', delta: 2 }] },
        outcomeText: 'The wrong answer makes the trade press. Not your circus, technically. But ministers remember who was sitting behind them, and what they didn\'t do.',
      },
    ],
  },
  {
    id: 'wp_count_the_votes',
    title: 'The count is wrong',
    body: 'Whips\' office, 6pm. Your spreadsheet says the government loses tomorrow\'s vote by two. The Chief Whip asks, without looking up: "Names?" You have them. Both are friends.',
    tags: ['party', 'serious'],
    weight: 14, cooldownDays: 250,
    requires: { minTier: 2, maxTier: 2 },
    choices: [
      {
        label: 'Give up the names',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 7 }, { kind: 'ally', delta: -6 }], stats: { integrity: -3 } },
        outcomeText: 'The two waverers receive the full treatment — flattery, threats, and a hint about an upcoming trade envoy role. The vote passes by one. The Chief Whip nods at you like a fellow professional. You feel like one, mostly.',
      },
      {
        label: 'Talk them round yourself',
        effects: { stats: { competence: 3 }, relationships: [{ kind: 'ally', delta: 3 }] },
        outcomeText: [
          { weight: 2, text: 'Two pints, one promised intervention on a constituency matter, and a genuinely good listen. They both vote with the party — and still take your calls.' },
          { weight: 1, text: 'One comes round. The other abstains and the vote scrapes through. The Chief Whip wonders aloud why the office wasn\'t told. A lesson in freelancing.', extra: { relationships: [{ kind: 'chiefWhip', delta: -4 }] } },
        ],
      },
    ],
  },
  {
    id: 'wp_dark_arts',
    title: 'The little black book',
    body: 'A colleague is wobbling on a crucial vote. The Chief Whip slides you a folder of their... indiscretions. "Persuade them," they say. The folder is heavier than it should be.',
    tags: ['party', 'scandal', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 2, maxTier: 2 },
    choices: [
      {
        label: 'Use the folder',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 8 }], stats: { integrity: -7 }, setFlags: { darkArts: true } },
        outcomeText: 'You never open it. You simply place it on the table between you and let gravity do the work. The vote is won. Something in your reflection has changed slightly.',
      },
      {
        label: 'Refuse — persuade honestly or not at all',
        effects: { relationships: [{ kind: 'chiefWhip', delta: -5 }], stats: { integrity: 6 } },
        outcomeText: 'You slide the folder back. "Not like this." The Chief Whip studies you for a long moment — disappointment, or possibly respect filed for later. The vote is won anyway, by other hands.',
      },
    ],
  },
  {
    id: 'wp_minister_overheard',
    title: 'Loose lips',
    body: 'At a reception, you overhear your minister describing the leader\'s flagship policy as "unworkable nonsense we\'ll be rid of by spring". {journalist} is four feet away, visibly developing antennae.',
    speaker: 'journalist',
    tags: ['media', 'party'],
    weight: 11, cooldownDays: 300,
    requires: { minTier: 1, maxTier: 2 },
    choices: [
      {
        label: 'Steer the journalist away',
        effects: { relationships: [{ kind: 'journalist', delta: 3 }], stats: { competence: 2 } },
        outcomeText: 'You intercept with a better story — a genuinely good tip about a select committee report. The minister\'s indiscretion evaporates. They owe you and don\'t even know it.',
      },
      {
        label: 'Report it up the chain',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 5 }, { kind: 'leader', delta: 3 }], stats: { integrity: -2 } },
        outcomeText: 'The whips\' office knows by morning. The minister\'s reshuffle prospects quietly curdle. Information is currency, and you just made a deposit.',
      },
      {
        label: 'Stay out of it entirely',
        effects: {},
        outcomeText: 'Not your monkeys. The quote surfaces in a diary column a month later, sourced to someone else entirely. Westminster\'s plumbing remains a mystery even to those inside it.',
      },
    ],
  },
  {
    id: 'wp_late_favour',
    title: 'A favour is asked',
    body: '{rival} corners you near the lifts. They need to miss tomorrow\'s vote — family thing, they say, eyes flicking sideways — and want you to square it with the whips. You happen to know there is no family thing.',
    speaker: 'rival',
    tags: ['party'],
    weight: 10, cooldownDays: 350,
    requires: { minTier: 2, maxTier: 2 },
    choices: [
      {
        label: 'Cover for them',
        effects: { relationships: [{ kind: 'rival', delta: 8 }], stats: { integrity: -3 } },
        outcomeText: 'You log it as a bereavement-adjacent absence. {rival} is now in your debt, a sentence you intend to read aloud to them at a moment of maximum usefulness.',
      },
      {
        label: 'Tell them to vote or own it',
        effects: { relationships: [{ kind: 'rival', delta: -5 }], stats: { integrity: 3 } },
        outcomeText: 'They vote, glaring at you across the lobby. The "family thing" turns out to have been a television audition. Your instincts remain in good working order.',
      },
    ],
  },
  {
    id: 'wp_first_red_box_envy',
    title: 'Watching the door',
    body: 'A reshuffle is rumoured. From the whips\' office you can see the ministerial corridor, where colleagues your vintage are starting to collect titles. {ally} asks if you ever think about what\'s next.',
    speaker: 'ally',
    tags: ['party', 'personal'],
    weight: 9, cooldownDays: 400,
    requires: { minTier: 1, maxTier: 2 },
    choices: [
      {
        label: 'Make your ambitions known upstairs',
        effects: { stats: { partyStanding: 3, profile: 1 } },
        outcomeText: 'A word here, a well-timed paper there, one strategic appearance at the leader\'s drinks. Nothing so vulgar as asking — just making sure that when lists are drawn up, your name suggests itself.',
      },
      {
        label: 'Keep your head down and serve',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 4 }], stats: { competence: 2 } },
        outcomeText: 'The work is the campaign, you tell yourself. And in fairness, the whips\' office does notice the ones who don\'t agitate. Usually. Mostly. You hope.',
      },
    ],
  },
  {
    id: 'wp_pairing_scandal',
    title: 'The broken pair',
    body: 'An opposition MP missed last night\'s vote under a pairing arrangement — and your side, allegedly by accident, voted anyway and won by one. Their whips are incandescent. Yours are avoiding eye contact.',
    tags: ['westminster', 'scandal'],
    weight: 8, cooldownDays: 500,
    requires: { minTier: 2, maxTier: 2 },
    choices: [
      {
        label: 'Defend it as a mix-up',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 4 }], stats: { integrity: -4, profile: 2 } },
        outcomeText: '"An honest administrative error," you tell the cameras, with a face you practised in the mirror. Nobody believes it, but it holds. The conventions creak a little more.',
      },
      {
        label: 'Push for the vote to be re-run',
        effects: { relationships: [{ kind: 'chiefWhip', delta: -6 }], stats: { integrity: 6, profile: 3 } },
        outcomeText: 'You argue, internally and then not-so-internally, that the win is poisoned. The vote is re-run and lost — but three opposition MPs buy you drinks, and trust, it turns out, compounds.',
      },
    ],
  },
  {
    id: 'wp_minister_breakdown',
    title: 'Behind the door',
    body: 'You find your minister sitting on the floor of their office at 11pm, surrounded by red-box papers, clearly at the end of their rope. "I can\'t do this," they say quietly. Tomorrow is their big statement.',
    tags: ['personal', 'serious'],
    weight: 8, cooldownDays: 550,
    requires: { minTier: 1, maxTier: 1 },
    choices: [
      {
        label: 'Stay and get them through it',
        effects: { stats: { competence: 3, integrity: 3 } },
        outcomeText: 'You order food, triage the box, and rebuild the statement line by line until 3am. The next day it lands well. Nobody ever knows. The minister never forgets.',
      },
      {
        label: 'Quietly alert the whips',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 3 }], stats: { integrity: -3 } },
        outcomeText: 'Support is arranged, of the official kind, and the statement is shuffled to a colleague. Sensible, defensible — and yet the look the minister gives you afterwards says they know exactly who called it in.',
      },
    ],
  },
];
