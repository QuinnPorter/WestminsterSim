import { DecisionCard } from '../../types/content';

/** Backbench Westminster life — tiers 0-2, both sides of the House. */
export const BACKBENCHER_CARDS: DecisionCard[] = [
  {
    id: 'bb_maiden_speech',
    title: 'The maiden speech',
    body: 'Your maiden speech is scheduled for Thursday. Convention demands warmth about {constituency} and kindness about your predecessor. Ambition suggests something quotable.',
    tags: ['westminster', 'serious'],
    weight: 30, cooldownDays: 9999, oncePerCareer: true,
    requires: { maxTier: 0 },
    advanceDays: [10, 20],
    choices: [
      {
        label: 'Charming and traditional',
        effects: { stats: { partyStanding: 4, constituencyApproval: 3 } },
        outcomeText: 'Gentle jokes, generous tributes, a lump in the throat at the right moment. Old hands nod approvingly. A solid start.',
      },
      {
        label: 'Bold and quotable',
        effects: { stats: { profile: 6 }, relationships: [{ kind: 'chiefWhip', delta: -2 }] },
        outcomeText: [
          { weight: 2, text: 'One line lands hard enough to make the evening bulletins. New MPs are rarely noticed. You have been noticed.' },
          { weight: 1, text: 'The bold line reads as cocky in print. The sketch writers have fun at your expense.', extra: { stats: { partyStanding: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'bb_three_line_whip',
    title: 'Three lines, one conscience',
    body: 'A three-line whip on a bill your inbox hates. {whip} catches your eye in the corridor and taps their folder meaningfully. The vote is at seven.',
    speaker: 'chiefWhip',
    tags: ['westminster', 'party', 'serious'],
    weight: 16, cooldownDays: 160,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Vote with the party',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 5, }, { kind: 'leader', delta: 2 }], stats: { constituencyApproval: -2 } },
        outcomeText: 'You file through the right lobby. The whip\'s nod is small but bankable. Forty-one constituents email to call you spineless; they will mostly forget.',
      },
      {
        label: 'Rebel',
        effects: { stats: { integrity: 4, profile: 3, constituencyApproval: 3 }, relationships: [{ kind: 'chiefWhip', delta: -8 }, { kind: 'leader', delta: -5 }], trigger: 'rebel' },
        outcomeText: 'You walk through the other lobby to raised eyebrows. The local paper calls you brave. The whips\' office calls you, full stop.',
      },
      {
        label: 'Be mysteriously absent',
        effects: { stats: { integrity: -3 }, relationships: [{ kind: 'chiefWhip', delta: -4 }] },
        outcomeText: 'A diplomatic illness. Nobody is fooled, but nobody can prove anything either. You feel grubby and un-shot-at.',
      },
    ],
  },
  {
    id: 'bb_pmq_question',
    title: 'Question number twelve',
    body: 'You have come up in the PMQs ballot. The whips want you to ask a planted softball. You could, instead, ask about the thing {constituency} actually cares about.',
    tags: ['westminster', 'media'],
    weight: 14, cooldownDays: 200,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Ask the planted question',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 4 }, { kind: 'leader', delta: 3 }] },
        outcomeText: '"Does the Prime Minister agree that things are going well?" The PM does agree. The chamber groans on schedule. Credit is quietly logged.',
      },
      {
        label: 'Ask the real question',
        effects: { stats: { constituencyApproval: 5, profile: 3 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'You name the hospital ward, the bus route, the closed factory. It is clipped, shared, and played on the local radio for two days. Home is pleased; the lectern-writers are not.',
      },
    ],
  },
  {
    id: 'bb_select_committee',
    title: 'The committee seat',
    body: 'A seat has opened on a select committee. It is unglamorous, diligent work — exactly the kind that either builds a reputation or buries one.',
    tags: ['westminster', 'policy'],
    weight: 12, cooldownDays: 400,
    requires: { maxTier: 1 },
    choices: [
      {
        label: 'Take it seriously',
        effects: { stats: { competence: 6, profile: 2 } },
        outcomeText: 'You read the evidence packs. All of them. Within months you are the member witnesses fear, in the politest possible way.',
      },
      {
        label: 'Coast — attendance optional',
        effects: { stats: { competence: -2, partyStanding: -1 } },
        outcomeText: 'You discover the committee corridor has excellent coffee and little else. The chair notices your empty chair.',
      },
    ],
  },
  {
    id: 'bb_tearoom_gossip',
    title: 'Tea room intelligence',
    body: '{ally} slides into the seat opposite with the face of someone carrying gossip. Apparently {rival} has been briefing against you to anyone who will listen.',
    speaker: 'ally',
    tags: ['party', 'westminster'],
    weight: 12, cooldownDays: 240,
    choices: [
      {
        label: 'Brief back, but better',
        effects: { relationships: [{ kind: 'rival', delta: -8 }], stats: { partyStanding: 2, integrity: -3 } },
        outcomeText: 'You deploy two well-placed anecdotes and one devastating compliment. By Thursday the tea room consensus has shifted in your favour. This is the game; you just played it.',
      },
      {
        label: 'Rise above it',
        effects: { stats: { integrity: 3 } },
        outcomeText: 'You change the subject loudly to the rugby. Some respect the restraint. {rival} reads it as weakness. Both things can be true.',
      },
      {
        label: 'Confront them directly',
        effects: { relationships: [{ kind: 'rival', delta: 4 }], stats: { profile: 1 } },
        outcomeText: 'You corner {rival} by the lifts and ask, pleasantly, if there is a problem. The directness startles them into something almost like respect. The briefings stop. For now.',
      },
    ],
  },
  {
    id: 'bb_late_night_sitting',
    title: 'The all-nighter',
    body: 'A marathon sitting on amendments runs past 2am. Half the intake has gone home. The whips are counting heads for a knife-edge division at 3.',
    tags: ['westminster'],
    weight: 10, cooldownDays: 180,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Stay to the bitter end',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 5 }], stats: { competence: 1 } },
        outcomeText: 'The division passes by four votes at 3:12am. The Chief Whip personally thanks the survivors. You learn two colleagues\' darkest secrets over vending-machine coffee — friendship, of a kind.',
      },
      {
        label: 'Slip home at midnight',
        effects: { relationships: [{ kind: 'chiefWhip', delta: -4 }] },
        outcomeText: 'You sleep beautifully. The vote scrapes through without you, which is both a relief and a mark in a ledger you cannot see.',
      },
    ],
  },
  {
    id: 'bb_journalist_lunch',
    title: 'Lunch with the lobby',
    body: '{journalist} invites you to lunch. "Just background," they say, which is journalist for "I am writing something and you can either be a source or a subject."',
    speaker: 'journalist',
    tags: ['media'],
    weight: 12, cooldownDays: 220,
    choices: [
      {
        label: 'Trade gossip carefully',
        effects: { relationships: [{ kind: 'journalist', delta: 8 }], stats: { profile: 2 } },
        outcomeText: 'You give them one safe morsel and a steer away from a wrong tree. They owe you now, slightly. That debt may matter someday.',
      },
      {
        label: 'Say absolutely nothing',
        effects: { relationships: [{ kind: 'journalist', delta: -4 }], stats: { integrity: 2 } },
        outcomeText: 'A pleasant lunch of weapons-grade blandness. They pay, annoyed. Your name appears in nothing, which is its own reward.',
      },
      {
        label: 'Overshare recklessly',
        effects: { relationships: [{ kind: 'journalist', delta: 5 }], stats: { partyStanding: -5, profile: 4 } },
        outcomeText: 'The story runs with "sources close to" doing heavy lifting. Everyone knows it was you. Everyone always knows.',
      },
    ],
  },
  {
    id: 'bb_mentor_advice',
    title: 'Wisdom in the smoking room',
    body: '{mentor} beckons you over to the good armchairs. "You are doing the thing all the new ones do," they say. "Working hard at the wrong things. Want the list?"',
    speaker: 'mentor',
    tags: ['party', 'personal'],
    weight: 10, cooldownDays: 300,
    requires: { maxTier: 1 },
    choices: [
      {
        label: 'Take the advice',
        effects: { stats: { competence: 4 }, relationships: [{ kind: 'mentor', delta: 6 }] },
        outcomeText: 'The list is short and brutal: pick two causes, learn the procedures, befriend the doorkeepers. You follow it. Things mysteriously get easier.',
      },
      {
        label: 'Nod and ignore it',
        effects: { relationships: [{ kind: 'mentor', delta: -3 }] },
        outcomeText: 'You smile, thank them, and carry on as before. Months later, one item on the list turns out to have been correct in an expensive way.',
      },
    ],
  },
  {
    id: 'bb_ten_minute_rule',
    title: 'Ten minutes of fame',
    body: 'You have won the right to introduce a Ten Minute Rule Bill. It will not become law, but the speech is yours alone — a shop window for whatever you choose.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 500,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'A worthy local cause',
        effects: { stats: { constituencyApproval: 5, profile: 1 } },
        outcomeText: 'The campaign group from {constituency} watches from the gallery in matching t-shirts as their cause is read into Hansard. There are tears. The bill dies, but the photo lives.',
      },
      {
        label: 'A clever national wedge',
        effects: { stats: { profile: 4, partyStanding: 2 } },
        outcomeText: 'You pick an issue that splits the other side and unites yours. The ten minutes are noted by people who plan candidate lists.',
      },
    ],
  },
];
