import { DecisionCard } from '../../types/content';

/** Three procedural set-pieces: a committee member's dilemma (any backbencher
 *  on a committee, not chair-gated), a backbench debate you've secured and
 *  lead, and an emergency SO24 application the whips would rather you dropped. */
export const EVENTS_EXTRA_CARDS: DecisionCard[] = [
  {
    id: 'evx_committee_member_lean',
    title: 'A word before the report',
    body: 'You are a junior member of a select committee, not its chair — but the draft report has teeth, and the department it bites is run by your own side. {whip} finds you in the corridor with a friendly arm and an unfriendly ask: soften the recommendation, or at least abstain when the committee votes on it.',
    speaker: 'chiefWhip',
    tags: ['westminster', 'party', 'serious'],
    weight: 11, cooldownDays: 300,
    // backbenchers only: ministers (tier 1+) do not sit on departmental select committees
    requires: { maxTier: 0, inGovernment: true },
    choices: [
      {
        label: 'Hold the line — the report stands',
        effects: {
          stats: { integrity: 4, competence: 2, partyStanding: -3 },
          relationships: [{ kind: 'chiefWhip', delta: -5 }],
        },
        outcomeText: 'You tell the whip that a committee report the whips have edited is not worth the paper. The recommendation survives intact; the department squirms; your name is added to a list of members who cannot be leaned on, which is exactly the reputation you wanted.',
      },
      {
        label: 'Soften the wording, keep the substance',
        effects: {
          stats: { competence: 3, integrity: -1 },
          relationships: [{ kind: 'chiefWhip', delta: 2 }],
        },
        outcomeText: 'You broker a form of words that lands the criticism without the headline. The whip gets a quieter Tuesday; the report still says the thing that matters, just further down the page. A small, defensible compromise that nobody quite loves.',
      },
      {
        label: 'Abstain and stay out of it',
        effects: {
          stats: { integrity: -3, partyStanding: 2 },
          relationships: [{ kind: 'chiefWhip', delta: 4 }],
        },
        outcomeText: 'You find urgent constituency business on the morning of the vote. The report passes without your fingerprints either way. The whip is grateful; the chair notes the empty chair; you tell yourself it was the sensible thing, and mostly believe it.',
      },
    ],
  },
  {
    id: 'evx_westminster_hall_debate',
    title: 'Your debate, your empty chamber',
    body: 'Months of badgering the Backbench Business Committee have paid off: you have secured a debate in Westminster Hall on a cause you actually care about. The catch is the one every backbencher learns — you will be speaking, in effect, to the record. Three colleagues, a minister obliged to reply, and rows of green leather nobody is sitting on.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 360,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'A careful speech for Hansard',
        effects: { stats: { competence: 4, integrity: 2, constituencyApproval: 2 } },
        outcomeText: 'You deliver the forensic, unshowy case you came to make, and the minister is forced to give a real answer that campaigners will hold them to for years. Nobody clips it. But the argument is now on the record, in your name, where it can be cited long after the room has emptied.',
      },
      {
        label: 'Fight to make it land outside the room',
        effects: {
          stats: { profile: 5, competence: -1 },
          relationships: [{ kind: 'journalist', delta: 3 }],
        },
        outcomeText: 'You brief the lobby, cut the best ninety seconds for social, and stack the gallery with the campaign group in matching lanyards. The chamber is still half-empty, but the debate escapes it — a local bulletin, a broadsheet sidebar, a moment. Less parliamentary craft, more oxygen.',
      },
      {
        label: 'Turn it into a coalition of the willing',
        effects: {
          stats: { profile: 2, partyStanding: 2 },
          relationships: [{ kind: 'ally', delta: 4 }],
        },
        outcomeText: 'You spend your speech generously — naming the handful who turned up, folding in their asks, building the beginnings of a cross-party group around the cause. The debate changes nothing tonight, but you leave the chamber with three allies you did not have this morning.',
      },
    ],
  },
  {
    id: 'evx_so24_application',
    title: 'The emergency debate',
    body: 'A scandal has broken overnight and the House is in no mood to wait for the usual channels. You could go to the Speaker under Standing Order 24 and apply for an emergency debate this afternoon — three minutes at the despatch box to argue the case is urgent, and a chamber vote if the Speaker agrees. {whip} has already made it plain the party would much rather the story died quietly over the weekend.',
    speaker: 'chiefWhip',
    tags: ['westminster', 'media', 'serious'],
    weight: 10, cooldownDays: 420,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Make the application — dare the Speaker to refuse',
        effects: {
          stats: { profile: 5, integrity: 3, partyStanding: -3 },
          relationships: [{ kind: 'chiefWhip', delta: -4 }],
          pollingShock: { party: 'gov', delta: -0.3 },
        },
        outcomeText: 'You make the three-minute case with the chamber filling behind you, and the Speaker grants it. The debate runs; the minister answers under duress; the story lives another news cycle instead of dying in one. The whips are furious, which is a cost you priced in before you stood up.',
      },
      {
        label: 'Apply, but keep it strictly procedural',
        effects: {
          stats: { competence: 3, profile: 2 },
          relationships: [{ kind: 'chiefWhip', delta: -1 }],
        },
        outcomeText: 'You stand on the narrow ground of urgency and process, not partisan attack — a request the Speaker can grant without it looking like a stitch-up. You get your debate on the merits, and the whips can hardly say you played games when you so visibly didn\'t.',
      },
      {
        label: 'Let it go — this is not your fight',
        effects: {
          stats: { partyStanding: 2 },
          relationships: [{ kind: 'chiefWhip', delta: 3 }],
        },
        outcomeText: 'You decide a backbencher has only so much powder to burn and this is not the day. The story fades over the weekend, as these things do; the whips log a colleague who reads the room. Somewhere a braver version of the afternoon goes unlived.',
      },
    ],
  },
];
