import { DecisionCard } from '../../types/content';

/** Tier 4: cabinet / shadow cabinet. Bigger calls, sharper knives. */
export const SOS_CARDS: DecisionCard[] = [
  {
    id: 'sos_cabinet_row',
    title: 'Around the cabinet table',
    body: 'Cabinet. The Chancellor proposes a cut that lands squarely on the {department} budget — your budget. Half the table studies the woodgrain. The PM looks at you, mildly curious whether you will fight.',
    tags: ['westminster', 'party', 'serious'],
    weight: 14, cooldownDays: 300,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Fight for your budget',
        effects: { stats: { competence: 3, profile: 2 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: [
          { weight: 2, text: 'You came armed: three numbers and one example so vivid the room winces. Half the cut is restored. The Chancellor\'s look promises a rematch, but your officials greet you like a returning general.' },
          { weight: 1, text: 'You fight well and lose anyway — the spreadsheet was decided before the meeting. But the fight itself was noticed, and departments remember who bleeds for them.', extra: { stats: { partyStanding: 2 } } },
        ],
      },
      {
        label: 'Concede gracefully, bank the favour',
        effects: { relationships: [{ kind: 'leader', delta: 4 }], stats: { competence: -1 } },
        outcomeText: [
          {
            weight: 9,
            text: 'You take the cut "in the spirit of collective endeavour". The PM\'s glance says the favour is logged. Your department\'s glance, when you return, says something else entirely.',
            extra: { grantFavour: { kind: 'leader' } },
          },
          {
            weight: 1,
            text: 'You take the cut "in the spirit of collective endeavour". The PM is warm about it afterwards — genuinely — but warm words are not a ledger entry, and around this table memories are short.',
          },
        ],
      },
    ],
  },
  {
    id: 'sos_big_reform',
    title: 'The reform of a generation',
    body: 'Your officials present two versions of the great {department} reform: the bold one that could define a decade — or detonate your career — and the cautious one that will be praised, padded, and forgotten.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 600,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'The bold version',
        effects: { stats: { profile: 5, competence: 2 }, pollingShock: { party: 'gov', delta: -0.5 } },
        outcomeText: [
          { weight: 2, text: 'The launch is rocky, the headlines mixed, the implementation grinding. But eighteen months in, the early numbers turn — and "controversial" begins its slow migration towards "landmark".' },
          { weight: 1, text: 'It is a war on every front: the press, the unions, your own backbenches. You will win history\'s verdict, probably. The next reshuffle arrives sooner than history does.', extra: { stats: { partyStanding: -5 } } },
        ],
      },
      {
        label: 'The cautious version',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'The white paper is welcomed by all sides, which tells you everything. It changes little, offends no one, and is implemented smoothly into oblivion. Your name stays clean for the climb.',
      },
    ],
  },
  {
    id: 'sos_pmq_stand_in',
    title: 'Deputising at PMQs',
    body: 'The PM is abroad; you are deputising at PMQs against the opposition\'s sharpest performer. Thirty minutes, no safety net, two million viewers including everyone who decides your future.',
    tags: ['westminster', 'media'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 4, maxTier: 4 },
    choices: [
      {
        label: 'Prepare obsessively, play it safe',
        effects: { stats: { competence: 3, partyStanding: 2 } },
        outcomeText: 'Solid, fluent, zero clips for the highlight reels — yours or theirs. The lobby scores it a draw, which for a stand-in is a win. The PM texts a thumbs up from the summit.',
      },
      {
        label: 'Go in with a planned zinger',
        effects: { stats: { profile: 4 } },
        outcomeText: [
          { weight: 2, text: 'The line lands so cleanly the chamber takes a second to react before the roar. It leads every bulletin. Colleagues mime applause at you in the corridor. Leadership speculation begins, unbidden and not entirely unwelcome.', extra: { stats: { partyStanding: 3 } } },
          { weight: 1, text: 'The zinger collides with a better zinger coming the other way. The clip — not the one you wanted — does enormous numbers. There is always next time, you tell the mirror.', extra: { stats: { profile: -1, partyStanding: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'sos_crisis_cobra',
    title: 'COBRA',
    body: 'A national incident touches the {department} brief and you are summoned to the basement briefing room at 5am. The facts are thin, the demands for answers are not, and someone has to front the lunchtime press conference.',
    tags: ['crisis', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Front it yourself, honestly',
        effects: { stats: { profile: 4, integrity: 4, competence: 2 } },
        outcomeText: 'You say what is known, what is not, and when more will come — and then you do exactly that, on the hour, for three days. Competence under pressure is the rarest commodity in politics. The country notices.',
      },
      {
        label: 'Put the officials up front',
        effects: { stats: { profile: -2, partyStanding: 1 } },
        outcomeText: 'The chief scientific adviser takes the podium; you take the second row. Defensible — experts reassure. But crises mint leaders, and you just declined the minting.',
      },
    ],
  },
  {
    id: 'sos_leadership_whispers',
    title: 'The dinner invitation',
    body: 'A dozen colleagues invite you to a private dinner. By the cheese course it is unmistakable: this is a court in search of a monarch, and they are measuring you for the throne. {leader}\'s position, they murmur, "cannot last forever".',
    tags: ['party', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 4, maxTier: 4, stats: { profile: { min: 55 } } },
    choices: [
      {
        label: 'Listen, commit to nothing',
        effects: { stats: { profile: 2 }, setFlags: { courtedForLeadership: true } },
        outcomeText: 'You are warm, witty, and entirely unquotable. They leave believing you are with them; you leave having promised nothing. Both things will be useful, whichever way the wind turns.',
      },
      {
        label: 'Shut it down — loyalty, loudly',
        effects: { relationships: [{ kind: 'leader', delta: 8 }], stats: { profile: -1 } },
        outcomeText: 'You toast {leader} and mean at least most of it. Word travels, as you intended. The plotters cross your name off one list — and quietly add it to another, marked "tell them nothing".',
      },
      {
        label: 'Test the water yourself',
        effects: { stats: { profile: 3, integrity: -3 }, relationships: [{ kind: 'leader', delta: -6 }], trigger: 'leadershipChallenge' },
        outcomeText: 'You ask the room, hypothetically, what a campaign would need. The room tells you, unhypothetically. By the weekend, the lobby has the story minus your name — for now. The wheel begins to turn.',
      },
    ],
  },
  {
    id: 'sos_shadow_attack',
    title: 'Opposition day',
    body: 'You hold the opposition day debate on the government\'s record on {department} matters. A chance to land blows — or to look like you are enjoying the misery you describe.',
    tags: ['westminster', 'party'],
    weight: 12, cooldownDays: 300,
    requires: { minTier: 4, maxTier: 4, inGovernment: false },
    choices: [
      {
        label: 'Forensic demolition',
        effects: { stats: { competence: 4, profile: 3 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'No theatrics — just twelve minutes of numbers, names and dates, each one a nail. The minister\'s reply visibly shrinks. Three clips circulate with the caption "this is how it\'s done".',
      },
      {
        label: 'Moral fury',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: [
          { weight: 2, text: 'You speak for the people behind the statistics and the chamber goes quiet in the way it rarely does. Even the government benches stop scrolling. The speech travels far beyond Westminster.' },
          { weight: 1, text: 'The fury reads as performance to a chamber that has seen too much of it. The sketch writers reach for "synthetic". The cause was right; the register was off.', extra: { stats: { profile: -1 } } },
        ],
      },
    ],
  },
  {
    id: 'sos_policy_review',
    title: 'The policy review',
    body: 'As shadow {department} secretary you own the policy review that will define the next manifesto. The members want boldness; the polling wants reassurance; the leader wants, above all, no surprises.',
    tags: ['policy', 'party'],
    weight: 11, cooldownDays: 450,
    requires: { minTier: 4, maxTier: 4, inGovernment: false },
    choices: [
      {
        label: 'Write the bold version',
        effects: { stats: { profile: 3, integrity: 3 }, relationships: [{ kind: 'leader', delta: -4 }] },
        outcomeText: 'The review electrifies the membership and alarms the focus groups in equal measure. Half of it will be quietly shelved before the manifesto — but the half that survives will matter, and it is yours.',
      },
      {
        label: 'Write the electable version',
        effects: { stats: { partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 5 }] },
        outcomeText: 'Cautious, costed, and impossible to attack — the review is praised as "grown-up", the word the press uses for "unexciting but probably right". The leader\'s office is delighted. The members\' Facebook groups are not.',
      },
    ],
  },
  {
    id: 'sos_scandal_donor',
    title: 'The donor problem',
    body: 'A major party donor — whose name is on two {department} advisory panels you signed off — is suddenly all over the papers for the wrong reasons. The connection to you is one well-aimed FOI request away.',
    tags: ['scandal', 'serious'],
    weight: 8, cooldownDays: 700,
    requires: { minTier: 4, maxTier: 4 },
    choices: [
      {
        label: 'Get ahead of it — disclose everything',
        effects: { stats: { integrity: 5, profile: -1 }, setFlags: { scandal: false } },
        outcomeText: 'You publish the appointments, the meetings, and the correspondence before anyone asks. The story, robbed of the cover-up angle, dies in a day and a half. Transparency: occasionally a weapon.',
      },
      {
        label: 'Say nothing, hope it passes',
        effects: { stats: { integrity: -3 } },
        outcomeText: [
          { weight: 2, text: 'It passes. The news cycle, mercifully, has the attention span of a gnat in a strobe light. You delete a draft statement and pour something restorative.' },
          { weight: 1, text: 'The FOI lands. "WHAT DID THE MINISTER KNOW?" runs for four days, and the honest answer — "not much" — convinces no one. A scandal flag now follows you into the next reshuffle.', extra: { setFlags: { scandal: true }, stats: { profile: -2, partyStanding: -5 } } },
        ],
      },
    ],
  },
  {
    id: 'sos_conference_speech',
    title: 'The hall is yours',
    body: 'Your conference speech slot is the one the broadcasters carry live. The text in front of you is safe. The folded page in your pocket — the one your team begged you not to write — is not.',
    tags: ['party', 'media'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 4 },
    choices: [
      {
        label: 'Deliver the safe text',
        effects: { stats: { partyStanding: 3 } },
        outcomeText: 'Twelve applause lines, all of which arrive on schedule. A competent speech competently received — the political equivalent of a reliable estate car. The leadership notes your discipline.',
      },
      {
        label: 'The folded page',
        effects: { stats: { profile: 5 } },
        outcomeText: [
          { weight: 2, text: 'You go off-script for four minutes about why you are actually in politics. The hall rises. The clip becomes the conference\'s defining moment — and a problem for everyone whose name is not yours.', extra: { stats: { partyStanding: 2 }, relationships: [{ kind: 'leader', delta: -3 }] } },
          { weight: 1, text: 'The hall wanted the estate car. The standing ovation is polite rather than seismic, and the sketch writers diagnose "leadership ambitions, untreated". The folded page goes back in the drawer.', extra: { relationships: [{ kind: 'leader', delta: -4 }] } },
        ],
      },
    ],
  },
  {
    id: 'sos_spending_review',
    title: 'The spending review',
    body: 'The Treasury wants 10% from every department, and your settlement letter is brutal. You can fight it in the room with the Chancellor — at the cost of goodwill you may need later — or take the hit and protect what matters most.',
    tags: ['policy', 'serious'],
    weight: 14, cooldownDays: 720,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Fight the Chancellor for every penny',
        effects: { stats: { profile: 3, partyStanding: 2, competence: 1 }, relationships: [{ kind: 'rival', delta: -4 }] },
        outcomeText: 'You dig in, threaten to take it to the PM, and claw back half the cut. Your department is grateful; the Chancellor adds you to a list that is not the friendly one.',
      },
      {
        label: 'Take the settlement, protect the front line',
        effects: { stats: { competence: 4, integrity: 2, partyStanding: -1 } },
        outcomeText: 'You swallow the number and do the grim arithmetic of where it falls, shielding the things that matter most. Quietly responsible, entirely thankless, and noticed by the people who run the place.',
      },
    ],
  },
  {
    id: 'sos_budget_raid',
    title: 'The raid on your budget',
    body: 'Mid-year, the Treasury wants to claw back an underspend you were relying on for next year. It is technically theirs to take. Letting it go is the path of least resistance; fighting it means a cabinet-level row.',
    tags: ['policy', 'westminster'],
    weight: 11, cooldownDays: 600,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Make it a resignation-adjacent fight',
        effects: { stats: { profile: 4, partyStanding: -2 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You let it be known, loudly, that this is a line. The money mostly stays — but you have spent capital and signalled you will go to the brink, which the centre files away for later.',
      },
      {
        label: 'Trade it for a future favour',
        effects: { stats: { competence: 4 } },
        outcomeText: 'You give up the underspend in exchange for a written promise on next year. Less satisfying than a fight, more reliable than one — the difference between a minister and a martyr.',
      },
    ],
  },
  {
    id: 'sos_permsec_clash',
    title: 'The permanent secretary',
    body: 'Your permanent secretary is, with exquisite politeness, refusing to deliver your flagship the way you want it — too risky, too fast, too political. They have outlasted six of your predecessors. One of you is going to have to bend.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 540,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Move to replace them',
        effects: { stats: { profile: 3, competence: -1 }, relationships: [{ kind: 'leader', delta: 1 }] },
        outcomeText: 'You force the issue with the Cabinet Secretary. It works, eventually, and it teaches the building that you mean it — at the cost of a war the unions and the commentariat enjoy enormously.',
      },
      {
        label: 'Win them over to your delivery plan',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You spend the political capital to understand their objection, then redesign the plan around it. Slower, sturdier, and a partnership rather than a hostage situation. The flagship sails.',
      },
    ],
  },
  {
    id: 'sos_whitehall_leak',
    title: 'The cabinet leak',
    body: 'A confidential account of a cabinet discussion — including your blunt private view of a colleague\'s policy — is splashed across the papers. It is accurate, which is the problem. Number 10 wants to know how you will handle it.',
    tags: ['scandal', 'westminster', 'serious'],
    weight: 11, cooldownDays: 600,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Deny, deflect, demand an inquiry',
        effects: { stats: { profile: 1, integrity: -2 }, relationships: [{ kind: 'rival', delta: -5 }] },
        outcomeText: 'You disown the quote and call for the leaker\'s head. The denial fools no one but draws a line; the search poisons two departments and finds, as ever, nobody.',
      },
      {
        label: 'Own it, smooth it over privately',
        effects: { stats: { integrity: 3, competence: 1 } },
        outcomeText: 'You ring the colleague, take the hit, and refuse to feed the story. It costs you a wince and a favour, and it earns you the thing leaks usually destroy — a little trust.',
      },
    ],
  },
  {
    id: 'sos_lobby_register',
    title: 'The register of interests',
    body: 'A transparency group has cross-referenced your diary with an industry\'s donations and found a pattern that "raises questions". Nothing is illegal. Everything is awkward. The story runs on Sunday unless you get ahead of it.',
    tags: ['scandal', 'media'],
    weight: 10, cooldownDays: 700,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Publish everything first, pre-empt the story',
        effects: { stats: { integrity: 4, profile: 1, competence: 1 } },
        outcomeText: 'You release the diary, the meetings and a plain account of the decisions before the paper can frame them. The story lands as a damp squib; the transparency people, grudgingly, move on.',
      },
      {
        label: 'Tough it out and lawyer up',
        effects: { stats: { integrity: -3, profile: -1 }, setFlags: { scandal: true } },
        outcomeText: 'You retreat behind a stiff statement and an expensive solicitor. It slows the story and confirms it in the same breath — and the word "questions" now follows your name into every reshuffle.',
      },
    ],
  },
  {
    id: 'sos_interest_ultimatum',
    title: 'The ultimatum',
    body: 'A powerful sector — energy, farming, finance, take your pick — has delivered a quiet ultimatum: water down the reform, or they pull investment, jobs and a great deal of friendly briefing. The threat is real. So is the reform.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 640,
    requires: { minTier: 4, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Call the bluff and press on',
        effects: { stats: { integrity: 4, profile: 2, partyStanding: -1 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'You refuse to be governed by the threat and deliver the reform intact. Some of the investment really does wobble; most of it was always staying; and you have shown the sector who is minister.',
      },
      {
        label: 'Quietly soften it to keep the peace',
        effects: { stats: { competence: 2, integrity: -3 } },
        outcomeText: 'You take the edges off where the cameras aren\'t looking. The jobs stay, the briefing turns friendly, and a thinner reform limps onto the statute book. Pragmatic — and the campaigners noticed the climbdown.',
      },
    ],
  },
];
