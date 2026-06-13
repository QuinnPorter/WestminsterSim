import { DecisionCard } from '../../types/content';

/** Tier 5: party leader — PM or Leader of the Opposition. */
export const LEADERSHIP_CARDS: DecisionCard[] = [
  // ----- Prime Minister: the burdens of office -----
  {
    id: 'pm_rival_resigns_radio',
    title: 'A resignation on the morning round',
    body: 'Your most senior cabinet rival has resigned live on the radio, citing "a failure of leadership at the top". The studio lights are still warm and the lobby is already writing your obituary. You have an hour to respond.',
    speaker: 'rival',
    tags: ['crisis', 'party', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Statesmanlike: thank them, move on fast',
        effects: { stats: { profile: 3, integrity: 2 }, pollingShock: { party: 'own', delta: -0.3 } },
        outcomeText: 'You praise their service through gritted teeth, name a successor by lunchtime, and deny the drama oxygen. The wound is real but you have closed it before it could bleed all day.',
      },
      {
        label: 'Hit back: brief against them hard',
        effects: { stats: { profile: 2, integrity: -4 }, relationships: [{ kind: 'rival', delta: -10 }], trigger: 'rebel' },
        outcomeText: 'Your operation guts them in the next edition. Satisfying — but it confirms the "chaos at the top" story, and a few more of their friends quietly join the awkward squad.',
      },
    ],
  },
  {
    id: 'pm_confidence_motion',
    title: 'They have the numbers — almost',
    body: 'The whips bring grim arithmetic: a chunk of your own side will abstain on tomorrow\'s flagship vote to send you a message. Lose it and your authority may not recover. The rebels want concessions; the press wants blood.',
    tags: ['party', 'crisis', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Make it a confidence issue — dare them',
        effects: { stats: { profile: 3 }, relationships: [{ kind: 'chiefWhip', delta: 4 }], trigger: 'rebel' },
        outcomeText: 'You stake your job on the vote and dare the rebels to bring you down. Most blink. You win — but the knowledge that you had to threaten them hangs in the air like cordite.',
      },
      {
        label: 'Concede enough to win the vote',
        effects: { stats: { integrity: -3, partyStanding: 3 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You water down the bill until the rebels can swallow it. The vote passes; the policy is a shadow of itself, and everyone now knows the price of a few dozen letters.',
      },
    ],
  },
  {
    id: 'pm_intelligence_briefing',
    title: 'The red folder at dawn',
    body: 'The intelligence chiefs wake you at 5am: a credible threat, a narrow window, and a choice only you can make. The advice is balanced, which is another way of saying the call is yours alone.',
    tags: ['crisis', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Authorise the operation',
        effects: { stats: { profile: 3, competence: 2 } },
        outcomeText: [
          { weight: 2, text: 'It works. The public never learns how close it came; only the handful in the room know what you carried that morning. You age a year by breakfast and tell no one.' },
          { weight: 1, text: 'It half-works, and the fallout is days of difficult statements. You defend the call because it was the right call on the information you had — the loneliest sentence in government.', extra: { stats: { profile: -2 }, pollingShock: { party: 'own', delta: -0.4 } } },
        ],
      },
      {
        label: 'Hold — gather more, act later',
        effects: { stats: { competence: 2, integrity: 2 } },
        outcomeText: 'You choose patience over the dramatic option. The window narrows but does not close, and the slower path holds. No medals for the disasters that never happen.',
      },
    ],
  },
  // ----- Leader of the Opposition: the long game -----
  {
    id: 'lo_government_in_waiting',
    title: 'A government in waiting',
    body: 'A think tank wants you to publish detailed costed plans — to look "ready for office". Your shadow chancellor is terrified: every promise becomes a target, every number a hostage. But vagueness invites the charge that you stand for nothing.',
    tags: ['policy', 'media'],
    weight: 12, cooldownDays: 360,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Publish bold, costed plans',
        effects: { stats: { competence: 4, integrity: 3 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'You put real numbers on the table and dare them to attack. Some land badly; most make you look like a government in waiting. Swing voters start picturing you behind the famous door.',
      },
      {
        label: 'Stay flexible — small target',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'You keep your powder dry and your options open. Harder to attack, easier to caricature as an empty suit. The election will decide whether the caution was wisdom or cowardice.',
      },
    ],
  },
  {
    id: 'lo_opposition_day_ambush',
    title: 'The opposition day trap',
    body: 'You can use your opposition day debate to lay a parliamentary trap — a motion crafted to split the government benches and tempt their rebels into the wrong lobby. It is procedural chess, and it could embarrass them or backfire as a gimmick.',
    tags: ['westminster', 'party'],
    weight: 12, cooldownDays: 320,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Spring the trap',
        effects: { stats: { profile: 3, competence: 2 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: [
          { weight: 2, text: 'The motion is irresistible to the government\'s rebels, and a dozen troop through your lobby. The "split party" footage runs for two days. Textbook opposition.' },
          { weight: 1, text: 'The whips see it coming and impose iron discipline. Your clever motion falls flat and the sketch writers call it a stunt. Cleverness, unrewarded.', extra: { stats: { profile: -1 } } },
        ],
      },
      {
        label: 'Use the day on a real issue instead',
        effects: { stats: { integrity: 3, competence: 1 } },
        outcomeText: 'You spend the day on something that actually matters to people rather than a Westminster game. Less drama, more substance — the campaigners, at least, remember who gave them a hearing.',
      },
    ],
  },
  {
    id: 'lo_unite_the_party',
    title: 'The faction summit',
    body: 'Your own party\'s factions are at each other\'s throats again, briefing the papers instead of fighting the government. As Leader of the Opposition you can knock heads together — or let them tire themselves out.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Bang heads together personally',
        effects: { stats: { partyStanding: 4, competence: 2 }, relationships: [{ kind: 'rival', delta: 4 }] },
        outcomeText: 'You lock the warring factions in a room and do not let them leave without a truce. Exhausting, but a disciplined opposition is an electable one, and the briefing — for now — stops.',
      },
      {
        label: 'Impose your will — purge the troublemakers',
        effects: { stats: { profile: 3, partyStanding: -2 }, relationships: [{ kind: 'rival', delta: -8 }], trigger: 'rebel' },
        outcomeText: 'You withdraw the whip from the worst offenders and dare the rest to complain. The party looks decisive and frightened in equal measure; the purged become a permanent, plotting rump.',
      },
    ],
  },
  {
    id: 'pm_first_pmqs',
    title: 'Your despatch box now',
    body: 'Your first PMQs from the government side of the box. Six questions from the Leader of the Opposition, who has been preparing for this moment slightly longer than you have.',
    tags: ['westminster', 'media'],
    weight: 18, cooldownDays: 9999, oncePerCareer: true,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
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
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
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
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
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
  {
    id: 'pm_confidence_vote',
    title: 'A confidence motion',
    body: 'The opposition has tabled a motion of no confidence in your government. You will almost certainly win it — but the margin, and the speech, will set the weather for months. Your own rebels are watching.',
    tags: ['westminster', 'crisis', 'serious'],
    weight: 12, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'A defiant, unifying despatch-box performance',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.6 }, relationships: [{ kind: 'chiefWhip', delta: 3 }] },
        outcomeText: 'You turn a defensive motion into a rallying cry; even the rebels troop through your lobby and mean it. The margin is comfortable, the speech leads the bulletins. Authority: reasserted.',
      },
      {
        label: 'Buy off the rebels beforehand',
        effects: { stats: { integrity: -3 }, relationships: [{ kind: 'chiefWhip', delta: 5 }] },
        outcomeText: 'A flurry of late concessions, a trade envoy role, a policy quietly shelved. You win handily — but everyone can count the price tags, and your authority now has a published rate card.',
      },
    ],
  },
  {
    id: 'pm_cabinet_resignation',
    title: 'A resignation on the desk',
    body: 'Your Chancellor — or someone nearly as load-bearing — has put a resignation letter on your desk over a policy you insisted on. Accept it and look weak; refuse it and look weaker; a third path is forming in your mind.',
    tags: ['party', 'crisis', 'serious'],
    weight: 11, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Accept it and promote a loyalist',
        effects: { stats: { partyStanding: 2 }, pollingShock: { party: 'own', delta: -0.5 }, relationships: [{ kind: 'ally', delta: 5 }] },
        outcomeText: 'You take the letter, thank them coolly, and move a loyalist into the great office by nightfall. Decisive — and a fortnight of "splits and chaos" coverage you could have done without.',
      },
      {
        label: 'Talk them down with a concession',
        effects: { stats: { competence: 2, integrity: -2 } },
        outcomeText: 'You give just enough ground to keep them in the tent. The crisis passes; the policy is now a compromise nobody loves. Unity bought on the never-never.',
      },
    ],
  },
  {
    id: 'pm_economy_shock',
    title: 'The markets lurch',
    body: 'A global shock hits and the markets are pricing in pain. Your Chancellor wants emergency measures; the cost is enormous either way. Whatever you say at the lectern in an hour will move money and votes.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 11, cooldownDays: 450,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'A big, costly intervention',
        effects: { pollingShock: { party: 'own', delta: 0.7 }, stats: { competence: -1 } },
        outcomeText: 'You announce support at a scale that steadies nerves and empties the reserves. The country exhales; the deficit hawks sharpen their pencils for the reckoning to come.',
      },
      {
        label: 'Hold the line, project stability',
        effects: { stats: { competence: 3, integrity: 2 }, pollingShock: { party: 'own', delta: -0.4 } },
        outcomeText: 'You resist the urge to spend and promise calm competence instead. The markets settle on your steadiness; the families feeling the squeeze are less impressed by your fiscal rectitude.',
      },
    ],
  },
  {
    id: 'pm_summit_walkout',
    title: 'The summit ultimatum',
    body: 'At a tense international summit, an ally delivers an ultimatum that would cost Britain dearly to accept and cost it diplomatically to refuse. The room — and the travelling press pack — waits on your answer.',
    tags: ['westminster', 'crisis', 'media'],
    weight: 10, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Stand firm — national interest first',
        effects: { stats: { profile: 4, integrity: 2 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: [
          { weight: 2, text: 'You say no, politely and immovably, and walk to your own press conference. It plays at home as strength; the ally, grumbling, comes back to the table within the week.' },
          { weight: 1, text: 'You hold firm and the talks collapse acrimoniously. Strong at home, isolated abroad — and the consequences of the failed deal will land later, on your desk.', extra: { pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Find the face-saving compromise',
        effects: { stats: { competence: 3 } },
        outcomeText: 'You broker a fudge that lets everyone claim victory and nobody examine the small print. Diplomats purr; one columnist back home calls it a sell-out. Such is the trade.',
      },
    ],
  },
  {
    id: 'pm_devolution_clash',
    title: 'The first minister picks a fight',
    body: 'A devolved first minister is staging a very public constitutional confrontation with your government — partly principle, mostly positioning. The cameras love it. Your unionist instincts and your strategists disagree on the response.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Refuse the fight, offer partnership',
        effects: { stats: { integrity: 3, competence: 2 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'You decline the grievance and offer joint funding and a summit instead. It deflates the drama and looks statesmanlike — denying your opponent the row they were campaigning for.',
      },
      {
        label: 'Meet fire with fire',
        effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You give as good as you get and your base roars approval. The clip war escalates; the union\'s actual problems are, as ever, left for another day.',
      },
    ],
  },
  {
    id: 'pm_spy_scandal',
    title: 'The security breach',
    body: 'The intelligence services brief you, ashen-faced, on a breach that is both a national security problem and — once it leaks, which it will — a political grenade. You control the timing of almost nothing here.',
    tags: ['crisis', 'scandal', 'serious'],
    weight: 8, cooldownDays: 600,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Get ahead of it — statement to the House',
        effects: { stats: { integrity: 4, profile: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You tell Parliament what you can before the leak tells the front pages. Sober, full, in command of the facts. A bad story, well handled, becomes a survivable one.',
      },
      {
        label: 'Contain it in the shadows',
        effects: { stats: { integrity: -3 } },
        outcomeText: [
          { weight: 1, text: 'The services do their quiet work and it never fully surfaces. Some things are genuinely better managed in the dark. You sleep uneasily but you sleep.' },
          { weight: 1, text: 'It leaks anyway, and now there are two stories: the breach, and the cover-up. "What did the PM know?" The grenade goes off in your hand.', extra: { pollingShock: { party: 'own', delta: -0.8 }, stats: { profile: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'pm_manifesto_delivery',
    title: 'The delivery stocktake',
    body: 'Halfway through the parliament, your delivery unit lays out the scorecard: the flagship pledges are amber-to-red, the money is tight, and the clock is loud. Where do you point the machine of government now?',
    tags: ['policy', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Ruthlessly prioritise one big pledge',
        effects: { stats: { competence: 4 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: 'You bet the second half on one deliverable promise and throw everything at it. The other pledges quietly fade; the one you chose actually happens, visibly, before the election.',
      },
      {
        label: 'Keep all the plates spinning',
        effects: { stats: { competence: -1 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You refuse to abandon any pledge and spread the effort thin. Everything advances a little; nothing completes. "Busy but directionless," sighs your delivery chief, off the record.',
      },
    ],
  },
  {
    id: 'pm_reshuffle_botch',
    title: 'The reshuffle that bit back',
    body: 'A minister you tried to move has refused to budge and gone to the papers; another you sacked is on the airwaves being magnanimous and wounded. A routine reshuffle is becoming a story about your authority.',
    tags: ['party', 'media', 'crisis'],
    weight: 9, cooldownDays: 450,
    requires: { minTier: 5, leaderRole: ['pm', 'lo'] },
    choices: [
      {
        label: 'Face it down — your gift, your call',
        effects: { stats: { profile: 2, partyStanding: 2 }, relationships: [{ kind: 'rival', delta: -4 }] },
        outcomeText: 'You assert, flatly, that hiring and firing is the PM\'s prerogative and dare anyone to disagree. The refusenik is isolated; the magnanimous martyr is yesterday\'s clip. Authority, narrowly, held.',
      },
      {
        label: 'Cut a face-saving deal',
        effects: { stats: { integrity: -2, partyStanding: -1 } },
        outcomeText: 'You let the refusenik keep a fig-leaf role and find the martyr a soft landing. The story dies — and the price of defying you is now publicly known to be: a soft landing.',
      },
    ],
  },
  {
    id: 'lo_government_collapsing',
    title: 'The government is wounded',
    body: 'The government is in visible trouble — splits, scandals, a stalling economy. As Leader of the Opposition this is your moment, but a wounded government can lash out, and an over-eager opposition can look like it\'s measuring the curtains.',
    tags: ['westminster', 'party'],
    weight: 12, cooldownDays: 350,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'A government-in-waiting prospectus',
        effects: { stats: { profile: 4, competence: 2 }, pollingShock: { party: 'own', delta: 0.7 } },
        outcomeText: 'You don\'t gloat — you reassure. A calm, costed prospectus for government that says: we are ready, we are serious, you can rest now. The grown-up contrast does the work.',
      },
      {
        label: 'Twist the knife daily',
        effects: { stats: { profile: 3, partyStanding: 3 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'You hammer them at every PMQs and in every clip. The base is delighted and morale soars. Whether the watching country wanted attack or alternative is a question for the exit poll.',
      },
    ],
  },
  {
    id: 'lo_internal_plot',
    title: 'Muttering on your own benches',
    body: 'You are Leader of the Opposition, the polls are flat, and a clutch of your own MPs are briefing that you "can\'t win". {rival} is conspicuously saying nothing, which says everything. Letters, it is whispered, are being written.',
    tags: ['party', 'crisis', 'serious'],
    weight: 10, cooldownDays: 450,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Confront the plotters head-on',
        effects: { stats: { profile: 3, partyStanding: -2 }, relationships: [{ kind: 'rival', delta: -6 }] },
        outcomeText: 'You call a meeting of the parliamentary party and dare the malcontents to put up or shut up. Most shut up. {rival} smiles and applauds with their fingertips. Bought time, not peace.',
      },
      {
        label: 'Reshuffle to bind them in',
        effects: { stats: { competence: 2 }, relationships: [{ kind: 'rival', delta: 5 }] },
        outcomeText: 'You hand the ringleaders jobs and responsibility — harder to brief against a strategy you now own. The plot dissolves into collective responsibility. Cynical; effective; classic.',
      },
      {
        label: 'Stake everything on a relaunch',
        effects: { stats: { profile: 5, partyStanding: -3 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'New team, new slogan, a big speech, a clear dividing line. A relaunch is a gamble that buys silence only if the polls move. Yours, this time, twitch upward. Just.',
      },
    ],
  },
  {
    id: 'lo_byelection_chance',
    title: 'A by-election to seize',
    body: 'A government seat has fallen vacant in exactly the kind of place you need to win to govern. As LO you can pour everything in and make it a referendum on the government — or manage expectations and protect yourself from a flop.',
    tags: ['party', 'media'],
    weight: 10, cooldownDays: 400,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Throw the kitchen sink at it',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.5 } },
        outcomeText: [
          { weight: 2, text: 'You all but move in. The seat falls to you on a thumping swing and the result becomes the story of the month — proof, the pundits agree, of a government in retreat.', extra: { stats: { partyStanding: 3 } } },
          { weight: 1, text: 'You go all in and fall agonisingly short. Having made it a test of your leadership, you now own the failure too. A long weekend of "is he up to it?" follows.', extra: { stats: { partyStanding: -3 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Manage expectations, campaign sensibly',
        effects: { stats: { competence: 2 } },
        outcomeText: 'You work it hard but briefed low. A solid result that you can spin as progress without having staked your authority on it. Unspectacular, survivable.',
      },
    ],
  },
  {
    id: 'pm_legacy_crossroads',
    title: 'The shadow of the exit',
    body: 'You have been PM long enough that the question has changed from "what next?" to "how will this end?". Go on too long and you\'ll be pushed; go too soon and the work is unfinished. A loyal ally asks, gently, if you\'ve thought about the timing.',
    tags: ['party', 'personal', 'serious'],
    weight: 7, cooldownDays: 700,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Name a departure on your own terms',
        effects: { stats: { integrity: 4, profile: 2 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'You signal, privately then publicly, that you will go at a time of your choosing — and suddenly you are a leader with a plan, not a hostage to one. Authority through the dignity of an exit date.',
      },
      {
        label: 'Govern as if forever',
        effects: { stats: { partyStanding: -2 } },
        outcomeText: 'You bat the question away and carry on. There is power in refusing to discuss your own ending — until there isn\'t, and the discussion happens without you in the room.',
      },
    ],
  },
  {
    id: 'pm_pandemic_call',
    title: 'A public health emergency',
    body: 'A fast-moving public health emergency lands on your desk with incomplete data and impossible trade-offs: act early and over-react, or wait for certainty that may arrive too late. The scientists give ranges, not answers. The decision is yours alone.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 8, cooldownDays: 700,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Act hard and early',
        effects: { stats: { integrity: 3, competence: 2 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: [
          { weight: 2, text: 'You move before the curve and take the economic and political hit early. It works: the worst is averted, and history — though not every front page — will record that you chose lives over comfort.', extra: { stats: { profile: 3 } } },
          { weight: 1, text: 'You move hard and the threat fizzles, leaving you to defend an "over-reaction" that cost livelihoods. You\'d do it again on the same evidence; explaining that is the hardest podium of your life.', extra: { pollingShock: { party: 'own', delta: -0.5 } } },
        ],
      },
      {
        label: 'Wait for the evidence',
        effects: { stats: { competence: -1 } },
        outcomeText: [
          { weight: 1, text: 'You hold your nerve, the data clarifies, and a proportionate response proves sufficient. Vindicated caution — the rarest and least-thanked kind.' },
          { weight: 1, text: 'The wait proves costly; by the time the evidence is undeniable, so is the scale of the crisis. The inquiry, years hence, will dwell on these lost weeks.', extra: { pollingShock: { party: 'own', delta: -0.9 }, stats: { profile: -2 } } },
        ],
      },
    ],
  },
];
