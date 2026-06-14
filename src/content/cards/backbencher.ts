import { DecisionCard } from '../../types/content';

/** Backbench Westminster life — tiers 0-2, both sides of the House. */
export const BACKBENCHER_CARDS: DecisionCard[] = [
  {
    id: 'bb_appg',
    title: 'The all-party group',
    body: 'A lobbyist offers to fund the secretariat of a new All-Party Parliamentary Group you would chair. Free research, foreign trips, a platform — and a quiet expectation about whose interests the group will champion.',
    tags: ['westminster', 'party'],
    weight: 11, cooldownDays: 360,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Chair it — declare everything',
        effects: { stats: { profile: 5, integrity: -2 } },
        outcomeText: 'You take the platform and the trips, and you register every penny. A useful profile-raiser that stays just the right side of the line — which is, after all, where the line is for.',
      },
      {
        label: 'Set one up with charity backing instead',
        effects: { stats: { integrity: 4, profile: 2, competence: 1 } },
        outcomeText: 'You find a charity to fund it with no strings. Slower to build, but it is genuinely yours, and the cause is real. The lobbyist moves on to a more biddable colleague.',
      },
      {
        label: 'Steer well clear',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You decline. One fewer line on the CV, one fewer entry in the register that a journalist might one day enjoy. A quiet, defensible nothing.',
      },
    ],
  },
  {
    id: 'bb_rebellion_letter',
    title: 'The round-robin letter',
    body: 'A knot of colleagues is circulating a letter demanding the leadership drop an unpopular policy. It is a soft rebellion — names on a page, not votes against — but names are remembered. Yours is requested.',
    speaker: 'rival',
    tags: ['party', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Sign it',
        effects: { stats: { profile: 3, integrity: 2 }, relationships: [{ kind: 'leader', delta: -5 }, { kind: 'chiefWhip', delta: -4 }] },
        outcomeText: 'Your name is on the letter the papers print. Backbench colleagues nod approvingly; the leader\'s office adds a small black mark by your name, in ink that takes years to fade.',
      },
      {
        label: 'Refuse, and tip off the whips',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 6 }, { kind: 'ally', delta: -5 }], stats: { integrity: -3 } },
        outcomeText: 'You hand the whips the list before it lands. Loyalty banked at the cost of friendships; the organisers never quite work out who talked, but they have suspicions, and the suspicions are correct.',
      },
      {
        label: 'Stay out of it entirely',
        effects: {},
        outcomeText: 'You develop a sudden, pressing interest in constituency casework and let the storm pass overhead. Neither hero nor villain — just absent, which is its own kind of choice.',
      },
    ],
  },
  {
    id: 'bb_viral_moment',
    title: 'Ninety seconds of fame',
    body: 'A clip of you skewering a minister in a half-empty chamber has, inexplicably, gone viral overnight. Two million views and counting. Your phone will not stop. Strike while it is hot, or let it cool?',
    tags: ['media'],
    weight: 10, cooldownDays: 320,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Ride the wave — every studio, today',
        effects: { stats: { profile: 7, competence: -2 } },
        outcomeText: 'You do six interviews before lunch. Your follower count rockets and your name recognition with it. Somewhere in the blur you say one slightly silly thing, but the wave carries you over it.',
      },
      {
        label: 'One careful follow-up, then back to work',
        effects: { stats: { profile: 4, competence: 1 } },
        outcomeText: 'A single, well-judged piece to camera and then a return to the day job. The moment is banked without the overexposure. Disciplined — the kind of thing that gets noticed upstairs.',
      },
    ],
  },
  {
    id: 'bb_private_members_bill',
    title: 'Top of the ballot',
    body: 'You have drawn high in the Private Members\' Bill ballot — a genuine, once-in-a-parliament chance to put something on the statute book. Charities, campaigners and one persistent government whip all have suggestions.',
    tags: ['westminster', 'policy'],
    weight: 9, cooldownDays: 600,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'A bold reform of your own',
        effects: { stats: { profile: 4, integrity: 4 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'You pick a cause that matters and dare the government to block it on the floor. It may not pass — most don\'t — but the campaign rallies behind you, and the issue now has your name welded to it.',
      },
      {
        label: 'A safe, government-friendly tidy-up',
        effects: { stats: { competence: 3 }, relationships: [{ kind: 'leader', delta: 3 }, { kind: 'chiefWhip', delta: 3 }] },
        outcomeText: 'You take the bill the whips quietly suggested: worthy, technical, certain to pass. No headlines, but a real change in the law with your name on it — and a favour banked with the people who write lists.',
      },
    ],
  },
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
  {
    id: 'bb_early_day_motion',
    title: 'The Early Day Motion',
    body: 'A campaign group wants you to table an Early Day Motion — a parliamentary sticky-note that changes nothing but signals everything. The cause is popular at home and faintly embarrassing to your front bench.',
    tags: ['westminster', 'party'],
    weight: 11, cooldownDays: 220,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Table it proudly',
        effects: { stats: { constituencyApproval: 3, partyStanding: -2 } },
        outcomeText: 'Forty colleagues sign within a week. The cause group sends a hamper; the whips send a look. A cheap win with a small invoice.',
      },
      {
        label: 'Quietly let it drop',
        effects: { stats: { partyStanding: 2, constituencyApproval: -1 } },
        outcomeText: 'You explain, gently, that EDMs are parliamentary confetti. The group is disappointed but the front bench is spared. Sensible; forgettable.',
      },
    ],
  },
  {
    id: 'bb_apsg_junket',
    title: 'The all-party group trip',
    body: 'An all-party parliamentary group offers a "fact-finding visit" somewhere sunny, funded by an industry with an obvious interest. It would be genuinely educational. It would also appear on a register.',
    tags: ['westminster', 'media'],
    weight: 10, cooldownDays: 300,
    choices: [
      {
        label: 'Go, and declare it fully',
        effects: { stats: { competence: 4, profile: 2, integrity: -3 } },
        outcomeText: 'You learn a great deal and register every penny. Months later a journalist lists it anyway under "MPs\' freebies" — accurately, and without context. Worth it, mostly.',
      },
      {
        label: 'Decline on principle',
        effects: { stats: { integrity: 4, competence: -1 } },
        outcomeText: 'You stay home and read the briefing pack instead. Less suntan, less knowledge, zero register entries. Your conscience is the only thing that travelled.',
      },
    ],
  },
  {
    id: 'bb_rebel_amendment',
    title: 'Your name on the amendment',
    body: '{ally} is gathering signatures for a backbench amendment that would genuinely improve a government bill — and genuinely embarrass the minister. They need a few brave names at the top of the list.',
    speaker: 'ally',
    tags: ['westminster', 'policy', 'party'],
    weight: 12, cooldownDays: 200,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Put your name to it',
        effects: { stats: { profile: 4, integrity: 3, partyStanding: -3 }, relationships: [{ kind: 'ally', delta: 6 }, { kind: 'chiefWhip', delta: -4 }] },
        outcomeText: 'The amendment forces a concession; the policy is better for it. Your name is now associated with "independent-minded", a phrase the whips file under "watch".',
      },
      {
        label: 'Sign only if it\'s winnable',
        effects: { stats: { competence: 2 } },
        outcomeText: 'You do the maths first. It isn\'t winnable, so you stay off — but you slip {ally} the procedural trick that wins a smaller concession later. Quiet craft.',
      },
      {
        label: 'Stay well clear',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 3 }, { kind: 'ally', delta: -4 }] },
        outcomeText: 'You like your name where it is: off lists. The whips notice the loyalty; {ally} notices the absence.',
      },
    ],
  },
  {
    id: 'bb_viral_clip',
    title: 'The accidental viral moment',
    body: 'A thirty-second clip of you patiently dismantling a pompous witness in committee has, overnight and inexplicably, gone viral. Eight million views. Your inbox is chaos and a producer wants you on the sofa tomorrow.',
    tags: ['media', 'westminster', 'funny'],
    weight: 10, cooldownDays: 350,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Ride the wave — do the rounds',
        effects: { stats: { profile: 7, competence: -1, constituencyApproval: -2 } },
        outcomeText: 'You become, for nine days, A Person From The Internet. The profile boost is real; so is the faint sense that you are now famous for a meme rather than a record.',
      },
      {
        label: 'Stay measured, decline the sofas',
        effects: { stats: { profile: 2, integrity: 2 } },
        outcomeText: 'You let the clip speak for itself and keep your head down. The serious people respect it; the algorithm moves on to a cat. A small, dignified bump.',
      },
    ],
  },
  {
    id: 'bb_whip_favour',
    title: 'A favour banked',
    body: '{whip} catches you after a vote with a rare warm smile. "You\'ve been solid. Anything you need — a debate slot, a committee, a word in the right ear — you ask." A favour from the whips\' office is a currency that doesn\'t inflate.',
    speaker: 'chiefWhip',
    tags: ['party', 'westminster'],
    weight: 9, cooldownDays: 400,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Cash it for a committee seat',
        effects: { stats: { competence: 4, profile: 1 }, relationships: [{ kind: 'chiefWhip', delta: -1 }] },
        outcomeText: 'You take the select committee seat you wanted. The work is meaty and visible. The favour is spent — but well.',
      },
      {
        label: 'Save it for a rainy day',
        effects: { relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'You thank them and bank it. An unspent favour with the Chief Whip is worth more in the having than the using — and they respect a colleague who understands that.',
      },
    ],
  },
  {
    id: 'bb_maiden_rebellion_regret',
    title: 'The morning after',
    body: 'You rebelled last night, and it felt righteous at 10pm. At 7am, {mentor} calls: "Good for the soul, bad for the career. Now — do you want it to mean something, or just to have happened?"',
    speaker: 'mentor',
    tags: ['party', 'personal'],
    weight: 9, cooldownDays: 300,
    requires: { maxTier: 3, flags: {} },
    choices: [
      {
        label: 'Build a cause around it',
        effects: { stats: { profile: 4, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You turn one vote into a campaign — op-eds, a backbench group, a clear ask. Rebellion with a purpose reads as conviction, not petulance. Mostly.',
      },
      {
        label: 'Mend fences fast',
        effects: { stats: { partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 3 }, { kind: 'chiefWhip', delta: 3 }] },
        outcomeText: 'You take the leader\'s PPS for coffee and make conciliatory noises. The breach heals. {mentor} approves; your principles file a quiet complaint.',
      },
    ],
  },
  {
    id: 'bb_constituency_vs_conscience',
    title: 'Whipped against your patch',
    body: 'The party line on this bill is actively unpopular in {constituency} — a local industry, specifically, will be hurt. The whip is on. Your inbox and your conscience are, for once, on the same side; the leadership is not.',
    tags: ['westminster', 'constituency', 'serious'],
    weight: 11, cooldownDays: 240,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Vote for the constituency',
        effects: { stats: { constituencyApproval: 5, integrity: 3, partyStanding: -4 }, relationships: [{ kind: 'chiefWhip', delta: -5 }], trigger: 'rebel' },
        outcomeText: 'You tell the whips you cannot look the workers in the eye and vote the other way. They\'ve heard it before, but the local paper\'s headline — "OUR MP STANDS UP" — is not nothing.',
      },
      {
        label: 'Win an exemption behind the scenes',
        effects: { stats: { competence: 4, constituencyApproval: 2 } },
        outcomeText: 'You vote with the party — but only after extracting a transition fund for the affected industry in a quiet ministerial corridor. Nobody gets a headline. The workers get a cushion.',
      },
      {
        label: 'Hold the line, explain later',
        effects: { stats: { partyStanding: 3, constituencyApproval: -4 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'You vote the line and send a carefully-worded letter to every affected business. Some understand. Some put it on the noticeboard with your name circled in red.',
      },
    ],
  },
  {
    id: 'bb_thinktank_pamphlet',
    title: 'The pamphlet',
    body: 'A think tank invites you to co-author a pamphlet setting out a bold new direction for the party. It would mark you as a thinker — or as someone with ideas above their station, depending on who reads it.',
    tags: ['policy', 'party', 'media'],
    weight: 9, cooldownDays: 400,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Write something genuinely bold',
        effects: { stats: { profile: 5, competence: 2, partyStanding: -2 } },
        outcomeText: 'The pamphlet gets reviewed, argued over, and cited. You are now A Person With A Tendency. Leadership-watchers add your name to a list you didn\'t ask to be on.',
      },
      {
        label: 'Co-sign something safe',
        effects: { stats: { competence: 2 } },
        outcomeText: 'You lend your name to a worthy, careful document about productivity. It is praised by three economists and read by none. No enemies made.',
      },
    ],
  },
  {
    id: 'bb_new_intake_mentor',
    title: 'The new intake look up to you',
    body: 'A by-election has brought in a nervous new colleague who has, alarmingly, started treating you as a wise old hand. They want advice, a drink, and possibly a faction to belong to.',
    tags: ['party', 'personal'],
    weight: 8, cooldownDays: 350,
    requires: { minTier: 1 },
    choices: [
      {
        label: 'Take them under your wing',
        effects: { stats: { partyStanding: 4 }, relationships: [{ kind: 'ally', delta: 4 }] },
        outcomeText: 'You become the gravitational centre of a small, loyal group of newer members. Building a base is how backbenchers become contenders. It starts with buying the drinks.',
      },
      {
        label: 'Be kind but keep your distance',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'You give them good, honest advice and no factional pitch. They are grateful and slightly adrift. Not everyone wants to run a court; some just want an early night.',
      },
    ],
  },
  {
    id: 'bb_cover_ally',
    title: 'Covering for a friend',
    body: '{ally} is double-booked — a select committee they cannot miss clashes with a chamber debate they are down to lead on. A little sheepishly, they ask whether you might take their slot.',
    speaker: 'ally',
    tags: ['party', 'westminster'],
    weight: 9, cooldownDays: 600,
    requires: { maxTier: 4 },
    choices: [
      {
        label: 'Step in — happy to help',
        effects: {
          stats: { profile: 2 },
          relationships: [{ kind: 'ally', delta: 6 }],
          grantFavour: { kind: 'ally', note: 'You covered a debate when it counted.' },
        },
        outcomeText: 'You take the slot at short notice and make a decent fist of it. {ally} is quietly, genuinely grateful — the kind of debt that gets repaid when it matters most.',
      },
      {
        label: 'Sorry — too much on',
        effects: { relationships: [{ kind: 'ally', delta: -3 }] },
        outcomeText: 'You beg off. {ally} says they understand, and mostly they do. A small coolness settles where some of the warmth used to be.',
      },
    ],
  },
  {
    id: 'bb_defend_mentor',
    title: "In the mentor's corner",
    body: 'A waspish profile of {mentor} is doing the rounds, and the lobby wants colleagues to twist the knife on the record. A loyal word from you would help them; silence would be the safer career move.',
    speaker: 'mentor',
    tags: ['media', 'party'],
    weight: 8, cooldownDays: 600,
    requires: { maxTier: 4 },
    choices: [
      {
        label: 'Defend them, on the record',
        effects: {
          stats: { profile: 2, integrity: 1 },
          relationships: [{ kind: 'mentor', delta: 6 }],
          grantFavour: { kind: 'mentor', note: 'You stood up for them when it was easier not to.' },
        },
        outcomeText: 'You give the warm, unguarded quote that turns the story. {mentor} does not forget who spoke up when the wind was against them.',
      },
      {
        label: 'Stay diplomatically silent',
        effects: {},
        outcomeText: 'You let the story run its course without your fingerprints on it. Prudent — and noticed, in the way that absences are.',
      },
    ],
  },
  {
    id: 'bb_committee_grilling',
    title: 'The committee corridor',
    body: 'Your select committee has a secretary of state in the chair this morning, sweating under the lights. You have four minutes and a folder of awkward facts. Do you go for the throat or the substance?',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 360,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Go for the viral takedown',
        effects: { stats: { profile: 5, partyStanding: -1 } },
        outcomeText: 'You land the sound bite and the clip flies. The minister\'s adviser learns your name; so do two million people who will never read the report. A name made.',
      },
      {
        label: 'Forensic, fair, and quietly devastating',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'No theatrics — just a sequence of questions the minister cannot answer. It makes no bulletin, but the committee clerks, the wonks and the next reshuffle\'s talent-spotters all notice.',
      },
    ],
  },
  {
    id: 'bb_pmb_ballot',
    title: 'You win the ballot',
    body: 'By the dumb luck of the Private Members\' Bill ballot, you have drawn a high number — a rare chance to put your own law on the statute book. Every charity and lobbyist in the building suddenly knows your name.',
    tags: ['westminster', 'policy'],
    weight: 11, cooldownDays: 9999, oncePerCareer: true,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'A worthy, winnable reform',
        effects: { stats: { competence: 3, integrity: 3, profile: 2 } },
        outcomeText: 'You pick something modest, popular and deliverable, and you actually get it through. A real, small change in the law with your name on it — more than most MPs manage in a decade.',
      },
      {
        label: 'A bold bill that probably dies',
        effects: { stats: { profile: 5, integrity: 1 } },
        outcomeText: 'You reach for the big, doomed, principled thing. It gets talked out on a Friday — but the campaign it launches outlives the bill, and so does your association with the cause.',
      },
    ],
  },
  {
    id: 'bb_urgent_question',
    title: 'The urgent question',
    body: 'A scandal is breaking and you could apply to the Speaker for an urgent question — dragging the responsible minister to the despatch box this afternoon to answer for it. The whips would much rather you didn\'t.',
    tags: ['westminster', 'media'],
    weight: 10, cooldownDays: 420,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Apply — make them account for it',
        effects: { stats: { profile: 4, integrity: 2 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'The Speaker grants it and you have your moment in a packed chamber. The whips are furious; the lobby files you under "ones to watch"; the minister files you under "trouble".',
      },
      {
        label: 'Let a frontbencher take the credit',
        effects: { stats: { partyStanding: 3 }, relationships: [{ kind: 'chiefWhip', delta: 2 }] },
        outcomeText: 'You hand the idea up the chain and let your side\'s big beast wield it. Less glory, more gratitude — a deposit in an account that pays out at reshuffle time.',
      },
    ],
  },
  {
    id: 'bb_chairman_letter',
    title: 'Letters to the chairman',
    body: '{rival} is quietly collecting letters to the backbench committee chairman — enough of them trigger a confidence vote in the leader. They slide a sheet across the tearoom table. The number is closer than anyone admits.',
    speaker: 'rival',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Put your letter in',
        effects: { stats: { profile: 3, integrity: 1 }, relationships: [{ kind: 'leader', delta: -8 }, { kind: 'chiefWhip', delta: -5 }], trigger: 'rebel' },
        outcomeText: 'Your name joins the pile. If it works you are an early mover in the new order; if it fails, the leader\'s office has a very short, very memorable list, and you are on it.',
      },
      {
        label: 'Refuse — and tip off the leader\'s team',
        effects: { relationships: [{ kind: 'leader', delta: 7 }, { kind: 'rival', delta: -8 }], stats: { integrity: -2 } },
        outcomeText: 'You warn Number 10 which way the wind is blowing. Loyalty banked at the price of friendships; the plotters never quite prove it was you, but they are not stupid.',
      },
      {
        label: 'Keep your head down',
        effects: {},
        outcomeText: 'You decide this is a fight for braver or more foolish people, and develop a sudden passion for a delegated-legislation committee. Neither hero nor villain — merely elsewhere.',
      },
    ],
  },
  {
    id: 'bb_whatsapp_group',
    title: 'The group chat',
    body: 'The backbench WhatsApp group is on fire again — three hundred messages overnight, half of them mutinous, and a screenshot of the worst ones is now, inevitably, with a journalist. You are in that group.',
    tags: ['party', 'media'],
    weight: 10, cooldownDays: 320,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Counsel calm and discretion',
        effects: { stats: { partyStanding: 3, integrity: 1 }, relationships: [{ kind: 'chiefWhip', delta: 3 }] },
        outcomeText: 'You are the voice of reason at 1am, reminding everyone that screenshots are forever. The whips clock a steadying hand — the kind of colleague they like to reward.',
      },
      {
        label: 'Pile in with the malcontents',
        effects: { stats: { profile: 3, partyStanding: -3 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You add your own incendiary contribution, which is of course the one the paper prints under your name. The awkward squad gains a member; the leadership loses any remaining illusions about you.',
      },
    ],
  },
  {
    id: 'bb_plot_from_back',
    title: 'A plot, seen from the back',
    body: 'From the cheap seats you can see it forming before the lobby can: a serious move against the leadership, a handful of big names testing the numbers. Nobody has asked you yet. They will. Where do you want to be standing when it breaks?',
    tags: ['party', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Get in early with the plotters',
        effects: { stats: { profile: 3 }, relationships: [{ kind: 'rival', delta: 6 }, { kind: 'leader', delta: -6 }], trigger: 'rebel' },
        outcomeText: 'You attach yourself to the rising faction while the attaching is cheap. A bet on the future, placed in public — and ruinous if the leader survives.',
      },
      {
        label: 'Stay conspicuously loyal',
        effects: { stats: { partyStanding: 4 }, relationships: [{ kind: 'leader', delta: 6 }] },
        outcomeText: 'You make a point of being seen on the leader\'s side of the tearoom. If they survive, you are a known loyalist; if they fall, you are a known loyalist, which is a different thing entirely.',
      },
    ],
  },
];
