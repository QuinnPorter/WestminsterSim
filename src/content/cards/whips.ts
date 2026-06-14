import { DecisionCard } from '../../types/content';
import { CauseId } from '../../types/game';

const ALL_CAUSES: CauseId[] = [
  'economy', 'inequality', 'publicServices', 'environment', 'immigration',
  'defence', 'foreignAffairs', 'housing', 'lawAndOrder', 'education',
];

/** Active whipping: the recurring "toe the line vs rebel" decision that defines a
 *  backbencher. Rebelling reuses the engine's `rebel` trigger, which already feeds
 *  the leadership-contest support maths and the player's rebellion count. */
export const WHIP_CARDS: DecisionCard[] = [
  {
    id: 'whip_three_line',
    title: 'A three-line whip',
    body: 'The whips have laid a three-line whip on a bill you find hard to stomach. {whip} has made it personal — be there, vote the right way, no exceptions. Your inbox says one thing; the pager says another.',
    speaker: 'chiefWhip',
    tags: ['party', 'serious'],
    weight: 13, cooldownDays: 240,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Toe the line',
        effects: {
          stats: { partyStanding: 4, integrity: -2 },
          relationships: [{ kind: 'chiefWhip', delta: 5 }],
        },
        outcomeText: 'You walk through the right lobby and swallow your doubts. The whips tick your name with quiet satisfaction; a small part of you files the compromise away with all the others.',
      },
      {
        label: 'Abstain — find a reason to be away',
        effects: {
          stats: { integrity: 1, partyStanding: -1 },
          relationships: [{ kind: 'chiefWhip', delta: -2 }],
        },
        outcomeText: 'A long-standing constituency engagement materialises with suspicious convenience. The whips are not fooled, but a missed vote is not a vote against. Noted, not underlined.',
      },
      {
        label: 'Rebel — vote your conscience',
        effects: {
          stats: { integrity: 4, profile: 3, partyStanding: -4 },
          relationships: [{ kind: 'chiefWhip', delta: -7 }, { kind: 'leader', delta: -4 }],
          trigger: 'rebel',
        },
        outcomeText: 'You vote against your own side and the tellers read it out for all to hear. The lobby has your name within minutes; the whips have it underlined twice, in a book that is never thrown away.',
      },
    ],
  },
  {
    id: 'whip_agenda_clash',
    title: 'Whipped against your cause',
    body: "Tonight's whipped vote cuts directly against the cause you came into politics to fight for. {whip} insists it is loyalty time. Your constituents — and your conscience — are both watching.",
    speaker: 'chiefWhip',
    tags: ['party', 'policy', 'serious'],
    weight: 13, cooldownDays: 320,
    requires: { maxTier: 3, causeIn: ALL_CAUSES },
    choices: [
      {
        label: 'Hold the line for the party',
        effects: {
          stats: { partyStanding: 4, integrity: -3, constituencyApproval: -2 },
          relationships: [{ kind: 'chiefWhip', delta: 4 }],
        },
        outcomeText: 'You vote the way you are told and tell yourself there will be other days, better bills. The cause you championed takes the hit; the whips remember a loyal soldier.',
      },
      {
        label: 'Rebel for what you believe',
        effects: {
          stats: { integrity: 5, profile: 4, constituencyApproval: 3, partyStanding: -5 },
          relationships: [{ kind: 'chiefWhip', delta: -8 }, { kind: 'leader', delta: -4 }],
          trigger: 'rebel',
        },
        outcomeText: 'You stand up for the thing you actually believe, and the rebellion makes the news because it is principled rather than tactical. The grassroots love it. The leadership does not.',
      },
    ],
  },
  {
    id: 'whip_payroll_test',
    title: 'The loyalty test',
    body: 'A wrecking amendment from your own backbenches threatens to embarrass the leadership. {whip} is hunting for reliable names to speak against it and kill it in committee. It would be a visible favour to the people who hand out jobs.',
    speaker: 'chiefWhip',
    tags: ['party', 'westminster'],
    weight: 10, cooldownDays: 360,
    requires: { maxTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Speak against it — earn your stripes',
        effects: {
          stats: { partyStanding: 5, profile: 2 },
          relationships: [{ kind: 'chiefWhip', delta: 6 }, { kind: 'leader', delta: 3 }],
        },
        outcomeText: 'You make the loyal case with just enough conviction to be believed. The whips file you under "sound" — the single most promotable adjective in the building.',
      },
      {
        label: 'Stay out of someone else\'s fight',
        effects: {},
        outcomeText: 'You decline to be anyone\'s attack dog today. No marks gained, none lost — though the whips have long memories for who answered the call and who was suddenly busy.',
      },
    ],
  },
];
