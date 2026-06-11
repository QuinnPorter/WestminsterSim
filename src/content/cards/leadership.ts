import { DecisionCard } from '../../types/content';

/** Tier 5: party leader — PM or Leader of the Opposition. */
export const LEADERSHIP_CARDS: DecisionCard[] = [
  {
    id: 'pm_first_pmqs',
    title: 'Your despatch box now',
    body: 'Your first PMQs from the government side of the box. Six questions from the Leader of the Opposition, who has been preparing for this moment slightly longer than you have.',
    tags: ['westminster', 'media'],
    weight: 18, cooldownDays: 9999, oncePerCareer: true,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Command the chamber',
        effects: { stats: { profile: 4, partyStanding: 3 } },
        outcomeText: 'Your benches roar at the right moments, the folder stays closed, and question five — the dangerous one — is turned around and sent back with interest. The lobby verdict: "looked like a PM". The bar was on the floor; you cleared it anyway.',
      },
      {
        label: 'Kill it with substance',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You answer the actual questions with actual answers, a tactic so unusual the chamber doesn\'t know how to heckle it. The clips are unspectacular; the column inches are thoughtful. A long game begins.',
      },
    ],
  },
  {
    id: 'pm_strikes_wave',
    title: 'The winter of someone\'s discontent',
    body: 'Nurses, railways, border staff: a coordinated wave of public-sector strikes, and the unions have asked for a meeting with you personally — over the heads of three of your secretaries of state.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 12, cooldownDays: 450,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Take the meeting yourself',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'Six hours, no cameras, one genuinely creative deal on unsocial-hours pay. The wave recedes. Your undermined ministers are furious in a way they cannot express, which is the best kind of furious for them to be.',
      },
      {
        label: 'Refuse — ministers negotiate, not PMs',
        effects: { stats: { partyStanding: 3 }, pollingShock: { party: 'own', delta: -0.5 } },
        outcomeText: 'Constitutionally correct and politically expensive. The strikes roll on through the bulletins, attached nightly to your name. Process arguments rarely beat picket lines on the news.',
      },
      {
        label: 'Legislate minimum service levels',
        effects: { stats: { integrity: -3 }, pollingShock: { party: 'own', delta: 0.2 }, relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'The legislation is red meat for your benches and a red rag to the unions. The strikes get angrier and smaller. The courts will have views. Next year\'s problem, ruled next year\'s PM.',
      },
    ],
  },
  {
    id: 'pm_byelection_disaster',
    title: 'The by-election',
    body: 'A safe seat — YOUR safe seat, the kind the party weighs rather than counts — has fallen on a swing that has psephologists using words like "unprecedented" with visible enjoyment. The post-mortem lands on your desk along with the morning\'s knife-sharpening from your own benches.',
    tags: ['party', 'crisis'],
    weight: 11, cooldownDays: 500,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Own it — "we hear you"',
        effects: { stats: { integrity: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You front the morning round yourself and say the result was a message received. Contrition, performed competently, takes the sting out. The plotters return their knives to the drawer. The drawer stays unlocked.',
      },
      {
        label: 'Dismiss it — "midterm blues"',
        effects: { stats: { partyStanding: -4 } },
        outcomeText: 'Every government says it and no one has ever believed it. The clip of you saying "these things happen midterm" will be replayed beside every subsequent setback like a curse you cast on yourself.',
      },
      {
        label: 'Blame the candidate, quietly',
        effects: { stats: { integrity: -4, partyStanding: 2 } },
        outcomeText: 'The briefing operation is deniable and effective: "local factors", "a difficult campaign", a pointed leak about the candidate\'s expenses. The defeated candidate, who did everything your office asked, learns what the machine does to the fallen.',
      },
    ],
  },
  {
    id: 'pm_uturn_dilemma',
    title: 'The U-turn',
    body: 'Your flagship policy is dying in the polls, on your backbenches, and possibly in the courts. Strategy says reverse it now and eat two bad days; pride says a leader who U-turns is a leader who can be turned.',
    tags: ['policy', 'party', 'serious'],
    weight: 11, cooldownDays: 450,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Reverse it cleanly',
        effects: { stats: { integrity: 2 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: 'You stand up, say "we got this wrong", and reverse it without weasel words. Two brutal days of "humiliating climbdown" — then, strangely, relief. Voters, it turns out, quite like being listened to.',
      },
      {
        label: 'Double down',
        effects: { stats: { partyStanding: -3 } },
        outcomeText: [
          { weight: 1, text: 'You hold, the implementation improves, and eighteen months later the policy is quietly working. "The conviction politician" enters your press cuttings. Survivor bias, you privately note, but you\'ll take it.', extra: { pollingShock: { party: 'own', delta: 0.4 }, stats: { integrity: 3 } } },
          { weight: 1, text: 'You hold, and the policy fails in slow motion across a year of accumulating headlines, each one a small invoice addressed to your judgement. The eventual reversal costs five times what the early one would have.', extra: { pollingShock: { party: 'own', delta: -0.9 } } },
        ],
      },
    ],
  },
  {
    id: 'pm_public_inquiry',
    title: 'The inquiry reports',
    body: 'The public inquiry — the one into the thing your government would rather forget — reports on Thursday. You have the advance copy. It is worse than feared in two chapters and better in one, and the chair has a gift for quotable condemnation.',
    tags: ['scandal', 'serious'],
    weight: 10, cooldownDays: 600,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Accept every recommendation, full apology',
        effects: { stats: { integrity: 5 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You stand in the chamber and accept the report whole, including the chapter with your department\'s fingerprints on it. The apology is unhedged. The families in the gallery nod slowly. Some days the job is just standing where the blame lands, properly.',
      },
      {
        label: 'Accept "in principle", contest the worst',
        effects: { stats: { integrity: -3, competence: 2 } },
        outcomeText: 'The response is lawyered to a high gloss: accepted "in principle", "in due course", "where practicable". The families call it an insult on the steps of the QEII Centre. The news cycle takes their side, because their side is the side.',
      },
    ],
  },
  {
    id: 'pm_cost_of_living',
    title: 'The £90 weekly shop',
    body: 'Inflation has made the weekly shop a news genre. A supermarket worker asks you, live on a walkabout, if you know the price of milk. You do — you were briefed at 6am — but the deeper question is what your government does about it.',
    tags: ['policy', 'media', 'serious'],
    weight: 12, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Big intervention — caps and support',
        effects: { pollingShock: { party: 'own', delta: 0.6 }, stats: { competence: -1 } },
        outcomeText: 'The support package is enormous, popular, and — the Treasury notes in increasingly italic memos — unfunded. Relief now, reckoning later. The political calendar has voted, and it votes for now.',
      },
      {
        label: 'Targeted help, fiscal honesty',
        effects: { pollingShock: { party: 'own', delta: 0.1 }, stats: { integrity: 3, competence: 2 } },
        outcomeText: 'Help aimed at those drowning rather than everyone damp. Defensible, affordable, and impossible to fit on a front page. "PM: SOME OF YOU GET HELP" is not the headline of dreams.',
      },
    ],
  },
  {
    id: 'pm_knife_edge_vote',
    title: 'Carried by one',
    body: 'Tonight\'s vote on your signature bill is, the whips confirm with grey faces, on an absolute knife edge. Two of your MPs are wavering for honourable reasons and one for purchasable ones. The division bell rings in six hours.',
    tags: ['westminster', 'party', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Persuade the honourable two yourself',
        effects: { stats: { integrity: 3, partyStanding: 3 } },
        outcomeText: [
          { weight: 2, text: 'Ninety minutes each, no staff, real listening, one genuine amendment conceded. Both walk through your lobby. The bill passes by three, and the story of how becomes quiet legend in the tearoom.', extra: { relationships: [{ kind: 'chiefWhip', delta: 4 }] } },
          { weight: 1, text: 'One persuaded, one unmoved — principle is like that. The bill scrapes through by a single vote amid scenes. Government by cliff edge. Your cardiologist sends a card.' },
        ],
      },
      {
        label: 'Let the whips buy the third',
        effects: { stats: { integrity: -5 }, relationships: [{ kind: 'chiefWhip', delta: 6 }] },
        outcomeText: 'A trade envoy role materialises for the purchasable one, who discovers deep convictions in favour of your bill by teatime. It passes comfortably. The price is filed where prices are filed: everywhere, eventually.',
      },
    ],
  },
  {
    id: 'pm_honours_scandal',
    title: 'The honours list problem',
    body: 'Your resignation honours draft has leaked, and one name is detonating: a major donor whose company is under investigation. Withdrawing the name admits fault; keeping it feeds a week of sleaze coverage.',
    tags: ['scandal', 'party'],
    weight: 9, cooldownDays: 600,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Pull the name immediately',
        effects: { stats: { integrity: 3 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'The name vanishes from the list and the story shrinks to a diary item. The donor\'s displeasure arrives through three intermediaries. The party treasurer ages visibly. Cheap at the price.',
      },
      {
        label: 'Stand by it — due process',
        effects: { stats: { integrity: -4 }, pollingShock: { party: 'own', delta: -0.5 } },
        outcomeText: '"Innocent until proven guilty" is correct, principled, and absolutely no match for the phrase "cash for honours" in 72-point type. The week is long, and the investigation has only started.',
      },
    ],
  },
  {
    id: 'pm_succession_question',
    title: 'After you',
    body: 'A profile writer asks the question every leader pretends not to think about: who comes next? Around your cabinet table sit three answers, each of whom has noticed you noticing them.',
    tags: ['party', 'personal', 'serious'],
    weight: 8, cooldownDays: 600,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Anoint a favourite, quietly',
        effects: { relationships: [{ kind: 'ally', delta: 8 }, { kind: 'rival', delta: -6 }] },
        outcomeText: 'A word here, a plum brief there: the succession signal goes out on the frequency all politicians monitor. Your favourite rises; the passed-over begin, very carefully, to organise. You have started a clock you cannot stop.',
      },
      {
        label: 'Keep them all guessing',
        effects: { stats: { partyStanding: 2 } },
        outcomeText: 'You praise all three with identical warmth, a feat of calibration that takes actual rehearsal. The rivalry stays productive: three colleagues working brilliantly to impress you. Divide and rule, the renewable energy of politics.',
      },
    ],
  },
  {
    id: 'pm_world_summit',
    title: 'The summit',
    body: 'Your first major international summit. The agenda is trade, security and a group photograph in which everyone jostles politely for the centre. One leader, notoriously difficult, has requested a bilateral.',
    tags: ['westminster', 'media'],
    weight: 11, cooldownDays: 350,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Charm the difficult one',
        effects: { stats: { profile: 3, competence: 2 } },
        outcomeText: [
          { weight: 2, text: 'Forty minutes, two genuine laughs, one unexpected concession on the trade annex. The read-out calls it "constructive", and for once the word is true. Diplomats describe you to each other as "surprisingly effective", their highest honour.' },
          { weight: 1, text: 'The bilateral is a forty-minute monologue — theirs. You emerge with a headache and a commemorative pen. The annex remains unconceded. The pen is nice.' },
        ],
      },
      {
        label: 'Work the smaller rooms',
        effects: { stats: { competence: 3 } },
        outcomeText: 'You skip the theatre and spend the margins with the leaders who actually decide things at the official level. Three quiet agreements advance. The group photo catches you mid-blink, the traditional price of substance.',
      },
    ],
  },
  {
    id: 'pm_backbench_revolt',
    title: 'The letter writers',
    body: 'Your whips report a rebellion brewing on the flagship bill — thirty of your own MPs, enough to wound. Their ringleader wants a meeting. The whips want you to crush it. Your coffee wants drinking before it goes cold again.',
    tags: ['party', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Face the rebels yourself',
        effects: { stats: { partyStanding: 3, integrity: 2 } },
        outcomeText: 'Ninety minutes in a committee room with no staff and no notes. You give them two real concessions and keep the spine of the bill. Twenty-six of the thirty come back aboard. Leadership, it turns out, is mostly attendance.',
      },
      {
        label: 'Let the whips do whip things',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 5 }], stats: { integrity: -3 } },
        outcomeText: 'The machine does what the machine does: a trade envoy role here, a planning decision there, one strategically-timed select committee vacancy. The bill passes. The invoice for all this will arrive later, as invoices do.',
      },
    ],
  },
  {
    id: 'pm_scandal_minister',
    title: 'A minister problem',
    body: 'One of your cabinet has been caught in a scandal that is — your comms director\'s phrase — "survivable but expensive". The press pack is in full cry. Due process says wait; the polls say act.',
    tags: ['scandal', 'party', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'Sack them immediately',
        effects: { stats: { profile: 2 }, pollingShock: { party: 'own', delta: 0.3 }, relationships: [{ kind: 'ally', delta: -3 }] },
        outcomeText: 'Gone by the six o\'clock news. Decisive, says the press. Brutal, says the party, suddenly recalculating what your loyalty is worth. Both are right; that is the job.',
      },
      {
        label: 'Back them through it',
        effects: { relationships: [{ kind: 'ally', delta: 5 }] },
        outcomeText: [
          { weight: 1, text: 'The story burns out by the weekend and your minister survives, welded to you by gratitude. Loyalty flows downhill in politics so rarely that yours is now legend in the tearoom.' },
          { weight: 1, text: 'Day four brings new revelations and the resignation happens anyway — except now it costs you too. "PM\'s judgement questioned" writes itself. You knew the gamble when you took it.', extra: { pollingShock: { party: 'own', delta: -0.6 }, stats: { profile: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'lo_response_disaster',
    title: 'Leading the opposition',
    body: 'The government has had its worst week in months. The open goal gapes. Your office offers two scripts: statesmanlike restraint, or the full-throated attack the membership is howling for.',
    tags: ['westminster', 'party'],
    weight: 13, cooldownDays: 280,
    requires: { minTier: 5, inGovernment: false },
    choices: [
      {
        label: 'Statesmanlike — look like the next PM',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: 'You speak more in sorrow than in anger, offering competence where there is chaos. Swing voters — the only audience that matters — quietly take note. The membership grumbles that you lack fire. The polling suggests otherwise.',
      },
      {
        label: 'Full attack — feed the base',
        effects: { stats: { profile: 4, partyStanding: 4 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'The speech is a flame-thrower and the hall loves every second. Clips everywhere, membership up, morale soaring. Whether anyone outside the tent was persuaded is a question for quieter moments.',
      },
    ],
  },
  {
    id: 'pm_legacy_project',
    title: 'What it was all for',
    body: 'Between the boxes and the crises, a thought keeps surfacing: what is this premiership — or this leadership — actually for? Your team can clear space for one defining project. Only one.',
    tags: ['policy', 'serious'],
    weight: 8, cooldownDays: 700,
    requires: { minTier: 5 },
    choices: [
      {
        label: 'The generational project',
        effects: { stats: { integrity: 5, competence: 2 }, pollingShock: { party: 'own', delta: -0.3 } },
        outcomeText: 'You pick the thing that will not pay off before the next election — and might pay off for fifty years after it. The strategists despair. Somewhere, a future historian starts taking notes.',
      },
      {
        label: 'The visible win',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: 'Something the voters can see, touch, and credit you for within eighteen months. Cynical? The word you prefer is "deliverable". Re-election is, after all, a prerequisite for legacy.',
      },
    ],
  },
  {
    id: 'pm_3am_call',
    title: 'The 3am call',
    body: 'The phone by your bed rings at 3:04am. A situation is developing overseas involving British nationals. The duty clerk talks fast; the options are all bad; the decision window is measured in hours and it is yours alone.',
    tags: ['crisis', 'serious'],
    weight: 9, cooldownDays: 600,
    requires: { minTier: 5, inGovernment: true },
    choices: [
      {
        label: 'Authorise the risky extraction',
        effects: { stats: { integrity: 3 } },
        outcomeText: [
          { weight: 2, text: 'At 6:40am the confirmation comes through: everyone out, no casualties. The country never learns how close it was. You stand at the window watching the dawn, hands not quite steady, and understand the job completely for the first time.', extra: { stats: { profile: 3, competence: 3 } } },
          { weight: 1, text: 'It goes wrong in the ways the briefing warned it could. The statement you give at noon is the hardest of your life. You authorised it; you own it; you would — you make yourself say it — decide the same again on the same facts.', extra: { stats: { profile: -3, partyStanding: -3 } } },
        ],
      },
      {
        label: 'Hold and negotiate',
        effects: { stats: { competence: 2 } },
        outcomeText: 'You choose the slow path: channels, intermediaries, patience at 4am. Eleven days later it resolves quietly. No medals are given for the disasters that don\'t happen — but the duty clerks know, and they talk.',
      },
    ],
  },
];
