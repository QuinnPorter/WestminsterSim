import { DecisionCard } from '../../types/content';

/** Rare, spicy cards — scandals and pressure moments, some chained via flags. */
export const CRISIS_CARDS: DecisionCard[] = [
  {
    id: 'cr_expenses_story',
    title: 'The receipts',
    body: '{journalist} calls with the tone they reserve for ambushes: a story is running tomorrow about your office expenses. It is technically all within the rules. It does not, they note cheerfully, *look* within the rules.',
    speaker: 'journalist',
    tags: ['scandal', 'media'],
    weight: 6, cooldownDays: 900,
    choices: [
      {
        label: 'Repay it all today, publicly',
        effects: { stats: { integrity: 4, profile: 1, constituencyApproval: -2 } },
        outcomeText: 'You repay before the story prints, turning "MP CAUGHT" into "MP REPAYS". A one-day story. The rules-were-followed purists call you weak; the public, who never read the rules, call it fair enough.',
      },
      {
        label: 'Stand on the rules',
        effects: { stats: { integrity: -2 } },
        outcomeText: [
          { weight: 2, text: '"All expenses were within the rules" — true, defensible, and printed beside a photograph of the item in question. The story limps through two news cycles and dies. Your inbox is vivid for a week.', extra: { stats: { constituencyApproval: -3 } } },
          { weight: 1, text: 'A second receipt surfaces, then a third. "Within the rules" becomes the year\'s most mocked phrase, with your face attached. The scandal flag will follow you into the next reshuffle.', extra: { setFlags: { scandal: true }, stats: { constituencyApproval: -6, partyStanding: -5 } } },
        ],
      },
    ],
  },
  {
    id: 'cr_lobby_dinner_returns',
    title: 'That dinner resurfaces',
    body: 'Remember the lobbying-firm dinner your old friend expensed? A transparency campaign has published the firm\'s hospitality register. Your name is on page two, and {journalist} has noticed.',
    tags: ['scandal', 'media'],
    weight: 20, cooldownDays: 9999, oncePerCareer: true,
    requires: { flags: { lobbyDinner: true } },
    choices: [
      {
        label: 'Full transparency, immediate apology',
        effects: { stats: { integrity: 2, profile: -1 }, setFlags: { lobbyDinner: false } },
        outcomeText: 'You publish the date, the menu, and a slightly excruciating apology. The story is over by Thursday. The old friend texts: "sorry x". You do not reply for a dignified 48 hours.',
      },
      {
        label: 'It was just dinner with a friend',
        effects: { stats: { integrity: -4 }, setFlags: { lobbyDinner: false } },
        outcomeText: [
          { weight: 1, text: 'Technically true, and the story lacks the documents to go further. It fades — though "just dinner" joins the lexicon your opponents reach for when they want to needle you.' },
          { weight: 1, text: 'The firm\'s internal notes leak: you are described as "warm to our client\'s position". You weren\'t — but proving a negative takes a month of headlines you can\'t spare.', extra: { setFlags: { scandal: true }, stats: { partyStanding: -4, profile: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'cr_deepfake',
    title: 'That isn\'t you',
    body: 'A video is spreading: you, apparently, saying something career-ending at a private event. It is synthetic — a fake — but it has half a million views and your denial is somehow the less interesting story.',
    tags: ['media', 'crisis', 'serious'],
    weight: 5, cooldownDays: 900,
    choices: [
      {
        label: 'Fight it with evidence, fast',
        effects: { stats: { competence: 2, profile: 2 } },
        outcomeText: 'Timestamped receipts: you were at a school fete, on camera, holding a tombola drum. The debunk outruns the fake by teatime, and the episode becomes a case study in rapid response. The tombola photo is, separately, excellent.',
      },
      {
        label: 'Refuse to dignify it',
        effects: { stats: { integrity: 2 } },
        outcomeText: [
          { weight: 2, text: 'You say one sentence — "It\'s fake, and the people spreading it know it" — and move on. The dignity plays well; the fake withers without the oxygen of outrage.' },
          { weight: 1, text: 'Silence reads as confirmation in the worse corners of the internet. The fake gets a second wind and a conspiracy theory attached. Eventually it passes, leaving a faint stain that fact-checks can\'t quite scrub.', extra: { stats: { profile: -2, constituencyApproval: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'cr_friend_scandal',
    title: 'Guilt by association',
    body: '{ally} is in serious trouble — a story breaking tonight, the career-threatening kind. They call you first. "I need you to vouch for me on the record. You\'re the only one they\'ll believe."',
    speaker: 'ally',
    tags: ['scandal', 'party', 'serious'],
    weight: 6, cooldownDays: 800,
    choices: [
      {
        label: 'Vouch for them publicly',
        effects: { relationships: [{ kind: 'ally', delta: 12 }], stats: { integrity: 2 } },
        outcomeText: [
          { weight: 2, text: 'You stake your credibility on theirs — and they turn out to deserve it. The story collapses under scrutiny within the week. Some debts can never be called in; this is one.' },
          { weight: 1, text: 'More emerges. They were not entirely honest with you, and your on-the-record defence is now part of the story. Loyalty has a price; today it invoices you.', extra: { stats: { profile: -3, partyStanding: -4 } } },
        ],
      },
      {
        label: 'Sympathy in private, distance in public',
        effects: { relationships: [{ kind: 'ally', delta: -10 }], stats: { partyStanding: 2 } },
        outcomeText: 'Your statement is a masterwork of warm nothing. {ally} survives anyway — diminished, and with a precise new understanding of your friendship\'s load-bearing capacity.',
      },
    ],
  },
  {
    id: 'cr_dark_arts_returns',
    title: 'The folder remembers',
    body: 'Years on, an inquiry into whips\' office practices is taking evidence. Your name appears in one diary entry, next to one word: "folder". You know exactly which day that was.',
    tags: ['scandal', 'serious'],
    weight: 20, cooldownDays: 9999, oncePerCareer: true,
    requires: { flags: { darkArts: true } },
    choices: [
      {
        label: 'Testify honestly',
        effects: { stats: { integrity: 6, partyStanding: -5 }, setFlags: { darkArts: false } },
        outcomeText: 'You tell the inquiry what the folder was and how the office worked. The evidence session is uncomfortable, the headlines worse — but yours is the testimony the final report calls "credible", an adjective that outlasts news cycles.',
      },
      {
        label: 'Recall nothing specific',
        effects: { stats: { integrity: -5 }, setFlags: { darkArts: false } },
        outcomeText: [
          { weight: 2, text: '"I don\'t recall the specific document." The inquiry, drowning in non-recollection from every witness, moves on. The word "folder" stays in one diary, unexplained, forever.' },
          { weight: 1, text: 'Another witness recalls it vividly, including your role. The contrast with your amnesia is noted in the report\'s sharpest paragraph. The scandal flag attaches.', extra: { setFlags: { scandal: true }, stats: { partyStanding: -6, profile: -2 } } },
        ],
      },
    ],
  },
  // ---- the scandal arc: a story that unfolds over several turns ----
  // break (sets scandal_stage: 1, scandal: true) → investigation (→ 2) →
  // resolution (→ clears). The scheduler surfaces each beat promptly.
  {
    id: 'cr_arc_break',
    title: 'The story breaks',
    body: '{journalist} calls, not for comment but as a courtesy: a serious story about you runs tomorrow, splashed across the front page. This is not a one-day item. They want to know if you have anything to say before the presses roll.',
    speaker: 'journalist',
    tags: ['scandal', 'media', 'serious'],
    weight: 5, cooldownDays: 1500,
    requires: { maxTier: 5, flags: { scandal_stage: false } },
    choices: [
      {
        label: 'Deny everything, flatly',
        effects: {
          setFlags: { scandal_stage: 1, scandal: true, scandal_denied: true },
          stats: { profile: -1 },
          relationships: [{ kind: 'journalist', delta: -5 }],
        },
        outcomeText: 'You issue a categorical denial. It buys you the morning — but a flat denial is a hostage to the next document, and {journalist} now has a personal stake in finding it.',
      },
      {
        label: 'Get ahead of it — explain yourself',
        effects: {
          setFlags: { scandal_stage: 1, scandal: true, scandal_denied: false },
          stats: { integrity: 2, partyStanding: -2 },
          relationships: [{ kind: 'journalist', delta: 3 }],
        },
        outcomeText: 'You put out your own account before the splash lands, ugly details and all. It hurts to read it in your own words — but it is harder to ambush someone who has already confessed.',
      },
    ],
  },
  {
    id: 'cr_arc_investigation',
    title: 'The inquiry opens',
    body: 'The story has legs. A formal investigation is now under way — standards commissioner, party machine, the lot — and every colleague you pass is calculating whether to be seen with you. How you handle the process is the story now.',
    tags: ['scandal', 'serious'],
    weight: 30, cooldownDays: 2,
    requires: { flags: { scandal_stage: 1 } },
    choices: [
      {
        label: 'Cooperate fully and openly',
        effects: {
          setFlags: { scandal_stage: 2 },
          stats: { integrity: 3, partyStanding: -1 },
          relationships: [{ kind: 'journalist', delta: 2 }],
        },
        outcomeText: 'You hand over everything and answer every question. It is a miserable fortnight — but "fully cooperated" is a phrase that does quiet work in the final report.',
      },
      {
        label: 'Stonewall — lawyer up',
        effects: {
          setFlags: { scandal_stage: 2, scandal_stonewall: true },
          stats: { integrity: -3, profile: -1 },
          relationships: [{ kind: 'journalist', delta: -4 }],
        },
        outcomeText: 'You retreat behind expensive silence. It slows the inquiry — and confirms, in the public mind, that there is something worth the lawyers\' fees.',
      },
    ],
  },
  {
    id: 'cr_arc_resolution',
    title: 'The reckoning',
    body: 'The inquiry is ready to report and the leadership wants the matter closed. There are two ways this ends: you tough it out and dare them to move against you, or you take responsibility and try to write the final paragraph yourself.',
    tags: ['scandal', 'serious'],
    weight: 30, cooldownDays: 2,
    requires: { flags: { scandal_stage: 2 } },
    choices: [
      {
        label: 'Tough it out — refuse to go',
        effects: {
          setFlags: { scandal_stage: 0, scandal: false, scandal_denied: false, scandal_stonewall: false },
          stats: { partyStanding: -4, profile: -2, integrity: -1 },
          relationships: [{ kind: 'leader', delta: -4 }],
        },
        outcomeText: [
          { weight: 2, text: 'You stare them down and survive — battered, diminished, but still standing. The story finally burns itself out, leaving a scar the cartoonists will reach for whenever they need one.' },
          { weight: 1, text: 'You cling on, but the cost is real: colleagues who once sought you out now keep their distance, and the leader\'s office files you under "liability".', extra: { stats: { partyStanding: -3 } } },
        ],
      },
      {
        label: 'Take responsibility and step back',
        effects: {
          setFlags: { scandal_stage: 0, scandal: false, scandal_denied: false, scandal_stonewall: false },
          stats: { integrity: 5, partyStanding: 1 },
          trigger: 'resignOffice',
        },
        outcomeText: 'You make a full and contrite statement, and where you hold an office, you lay it down. Painful in the moment — but a clean break the public can forgive, and a story that finally has its ending.',
      },
    ],
  },
  {
    id: 'cr_heckler_moment',
    title: 'The heckle',
    body: 'A public meeting in {constituency} turns hostile. One heckler — angry, articulate, and absolutely right about the thing they are angry about — will not stop. The cameras are rolling.',
    tags: ['constituency', 'media', 'crisis'],
    weight: 7, cooldownDays: 600,
    choices: [
      {
        label: 'Give them the microphone',
        effects: { stats: { integrity: 4, profile: 3, constituencyApproval: 3 } },
        outcomeText: 'You hand it over and sit down. Ninety seconds of furious eloquence later, you answer all of it — properly. The clip goes viral for the right reasons, a sentence rarely typed about politicians.',
      },
      {
        label: 'Talk over them, hold the room',
        effects: { stats: { profile: -2, constituencyApproval: -3 } },
        outcomeText: 'You raise your voice and win the room, narrowly. The footage, cut to thirty seconds, looks like exactly what it was. The heckler is invited onto the local radio breakfast show. They are excellent.',
      },
    ],
  },
];

/** the mid-arc beats (not the opening card) — the scheduler surfaces these
 *  promptly while a scandal is live so the story doesn't stall. */
export const SCANDAL_ARC_BEATS: DecisionCard[] = CRISIS_CARDS.filter(
  (c) => c.id === 'cr_arc_investigation' || c.id === 'cr_arc_resolution'
);
