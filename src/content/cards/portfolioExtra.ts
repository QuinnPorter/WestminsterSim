import { DecisionCard } from '../../types/content';

/** More department-specific ministerial decisions, extending portfolio.ts.
 *  Same `dir_<dept>` direction→payoff pattern: a tier-4 direction card sets a
 *  strategy flag, a once-per-career payoff card later judges it, and tier-3
 *  tactical cards fire as the brief throws up crises. All government-only. */
export const PORTFOLIO_EXTRA_CARDS: DecisionCard[] = [
  // ===================== ENVIRONMENT =====================
  {
    id: 'pf_env_direction',
    title: 'The net-zero crossroads',
    body: 'The {department} brief lands on your desk with a single defining choice: throw everything at the net-zero transition now, or slow the timetable to spare households the cost. Both camps have the science and the focus groups.',
    tags: ['policy', 'serious'],
    weight: 17, cooldownDays: 900,
    requires: { inGovernment: true, department: ['environment'], minTier: 4, flags: { dir_environment: false } },
    choices: [
      {
        label: 'Accelerate the green transition',
        effects: { stats: { profile: 3, integrity: 2 }, setFlags: { dir_environment: 1 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You bring the targets forward and stake your reputation on the green prize. The future will thank you; the present sends you its energy bills.',
      },
      {
        label: 'Ease the burden on households',
        effects: { stats: { competence: 3, partyStanding: 2 }, setFlags: { dir_environment: 2 } },
        outcomeText: 'You stretch the timetable and talk about "proportionate, affordable" change. The forecourts are relieved; the campaigners chain themselves to your conscience.',
      },
    ],
  },
  {
    id: 'pf_env_payoff',
    title: 'The transition, judged',
    body: 'Two years on, your green acceleration faces its reckoning: jobs promised, bills paid, emissions counted. The verdict is coming in.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['environment'], minTier: 4, flags: { dir_environment: 1 } },
    choices: [
      {
        label: 'Defend the record',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: [
          { weight: 2, text: 'The green jobs materialise on schedule and you cut the ribbon on a gigafactory. A genuine legacy, and the numbers to prove it.' },
          { weight: 1, text: 'The transition is real but slower and dearer than promised; you spend the day explaining "teething problems" on the radio.', extra: { stats: { competence: -2 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Pre-brief the framing',
        effects: { stats: { integrity: -2, profile: 1 } },
        outcomeText: 'You teach the lobby how to read the numbers before they see them. Mixed figures, survivable coverage. Spin as a seatbelt.',
      },
    ],
  },
  {
    id: 'pf_env_flooding',
    title: 'The water rises',
    body: 'Towns across the {department} brief are under water, the agency is overwhelmed, and the cameras want to see a minister in wellingtons. Your diary says you are 200 miles away at a donor dinner.',
    tags: ['crisis', 'media', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { inGovernment: true, department: ['environment'], minTier: 3 },
    choices: [
      {
        label: 'Cancel everything and go',
        effects: { stats: { constituencyApproval: 4, profile: 3 } },
        outcomeText: 'You stand thigh-deep in a flooded high street looking suitably grim. It changes nothing on the ground, but the public forgives a minister who shows up.',
      },
      {
        label: 'Coordinate the response from the centre',
        effects: { stats: { competence: 4, profile: -2 } },
        outcomeText: 'You run the COBRA-style grid and get the pumps where they are needed. Effective, invisible, and the front pages run a photo of your empty wellingtons.',
      },
    ],
  },
  // ===================== WORK & PENSIONS =====================
  {
    id: 'pf_dwp_direction',
    title: 'The welfare settlement',
    body: 'The {department} budget is the second biggest in Whitehall and the choice is stark: tighten conditionality to drive people into work, or invest to lift the poorest. Either way, someone writes the angry headline.',
    tags: ['policy', 'serious'],
    weight: 17, cooldownDays: 900,
    requires: { inGovernment: true, department: ['dwp'], minTier: 4, flags: { dir_dwp: false } },
    choices: [
      {
        label: 'Tighten conditionality',
        effects: { stats: { partyStanding: 3, integrity: -2 }, setFlags: { dir_dwp: 1 } },
        outcomeText: 'You toughen the rules and talk about "fairness to the taxpayer". The benches behind you roar; the food banks brace.',
      },
      {
        label: 'Invest to cut poverty',
        effects: { stats: { integrity: 4, profile: 2 }, setFlags: { dir_dwp: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You put money in and dare them to call it soft. The charities applaud; the Treasury sharpens its red pen for the next spending round.',
      },
    ],
  },
  {
    id: 'pf_dwp_payoff',
    title: 'The conditionality verdict',
    body: 'Your tougher welfare regime has been running long enough to judge. The employment figures are in — and so are the case studies the other side will read out at PMQs.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['dwp'], minTier: 4, flags: { dir_dwp: 1 } },
    choices: [
      {
        label: 'Point to the jobs numbers',
        effects: { stats: { competence: 3, partyStanding: 3 } },
        outcomeText: [
          { weight: 1, text: 'Employment is up and you wield the statistic like a cudgel. The strategy is vindicated, if not loved.' },
          { weight: 1, text: 'A sanctions scandal breaks the same week and swamps the good numbers. You spend it apologising for a system you built.', extra: { stats: { integrity: -3 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Lead with the human stories',
        effects: { stats: { profile: 2, partyStanding: -1 } },
        outcomeText: 'You front the figures with case studies of people back in work. The data is mixed; the anecdotes are warm. It buys you the benefit of the doubt.',
      },
    ],
  },
  {
    id: 'pf_dwp_uprating',
    title: 'The uprating row',
    body: 'It is the annual decision nobody enjoys: by how much to uprate benefits and pensions. Inflation says one number, the Treasury says a smaller one, and pensioners vote.',
    tags: ['policy', 'westminster', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { inGovernment: true, department: ['dwp'], minTier: 3 },
    choices: [
      {
        label: 'Protect the triple lock',
        effects: { stats: { constituencyApproval: 4, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You face down the Treasury and keep the pensioners whole. They will remember at the ballot box; the Chancellor will remember at the next reshuffle.',
      },
      {
        label: 'Hold the line on cost',
        effects: { stats: { competence: 3, constituencyApproval: -3 } },
        outcomeText: 'You uprate by less than inflation and call it responsible. The grey vote grumbles; the bond market, for once, does not.',
      },
    ],
  },
  // ===================== BUSINESS =====================
  {
    id: 'pf_business_direction',
    title: 'Pick a winner, or pick none',
    body: 'The {department} desk presents the eternal question of British industrial policy: back national champions with subsidy and protection, or trust the market and let the chips fall.',
    tags: ['policy', 'serious'],
    weight: 16, cooldownDays: 900,
    requires: { inGovernment: true, department: ['business'], minTier: 4, flags: { dir_business: false } },
    choices: [
      {
        label: 'An active industrial strategy',
        effects: { stats: { competence: 3, profile: 2 }, setFlags: { dir_business: 1 } },
        outcomeText: 'You announce a strategy, a fund, and a slogan with the word "growth" in it. Industry cheers; the free-marketeers on your own side mutter about picking losers.',
      },
      {
        label: 'Let the market decide',
        effects: { stats: { integrity: 3, partyStanding: 2 }, setFlags: { dir_business: 2 } },
        outcomeText: 'You decline to subsidise and preach competitiveness. Purer, leaner — and a hostage to the first big factory that closes on your watch.',
      },
    ],
  },
  {
    id: 'pf_business_payoff',
    title: 'The strategy delivers (or doesn\'t)',
    body: 'The industrial strategy you championed has had time to work. Somewhere a ribbon is waiting to be cut — or a fund is waiting to be quietly written off.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['business'], minTier: 4, flags: { dir_business: 1 } },
    choices: [
      {
        label: 'Take the credit',
        effects: { stats: { competence: 4, profile: 3 } },
        outcomeText: [
          { weight: 2, text: 'The investment lands, the jobs are real, and the slogan looks like foresight. You are photographed in a hi-vis vest, beaming.' },
          { weight: 1, text: 'The flagship recipient folds and takes the subsidy with it. "Picking losers" is now a phrase that follows you around.', extra: { stats: { competence: -3 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Quietly bury the write-off',
        effects: { stats: { integrity: -2, competence: 1 } },
        outcomeText: 'You release the bad news on a busy day and lead the grid with something else. The loss is real; the headline is somebody else\'s problem.',
      },
    ],
  },
  {
    id: 'pf_business_closure',
    title: 'The plant is closing',
    body: 'A major employer in the {department} brief announces it is closing a plant — thousands of jobs, a whole town, and a board that wants a bailout to think again.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 12, cooldownDays: 380,
    requires: { inGovernment: true, department: ['business'], minTier: 3 },
    choices: [
      {
        label: 'Step in with a rescue package',
        effects: { stats: { constituencyApproval: 4, profile: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You find the money and save the jobs for now. The town is grateful; every other struggling firm in Britain now has your number.',
      },
      {
        label: 'Refuse to bail out a failing business',
        effects: { stats: { integrity: 3, competence: 2, constituencyApproval: -4 } },
        outcomeText: 'You decline, talk about "managed transition", and fund retraining instead. Principled and bleak — the local paper prints the redundancy figure in 72-point type.',
      },
    ],
  },
  // ===================== TRANSPORT =====================
  {
    id: 'pf_transport_direction',
    title: 'The megaproject decision',
    body: 'The {department} brief comes with a decision worth tens of billions: commit to the great rail project that will define a generation, or cancel it before it swallows the budget whole.',
    tags: ['policy', 'serious'],
    weight: 16, cooldownDays: 900,
    requires: { inGovernment: true, department: ['transport'], minTier: 4, flags: { dir_transport: false } },
    choices: [
      {
        label: 'Back it — build for the future',
        effects: { stats: { profile: 3, competence: 2 }, setFlags: { dir_transport: 1 } },
        outcomeText: 'You commit, spades in the ground, ribbon-cuttings for decades. A monument — or a money pit with your name on the plaque.',
      },
      {
        label: 'Cancel and bank the savings',
        effects: { stats: { competence: 3, integrity: 2 }, setFlags: { dir_transport: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You axe it and redirect the billions to a thousand smaller schemes. Prudent — and the cities at the cancelled end of the line will not forget.',
      },
    ],
  },
  {
    id: 'pf_transport_payoff',
    title: 'The project, overrun',
    body: 'The megaproject you greenlit is over budget and behind schedule — as they all are. The question is whether you defend it or distance yourself before the next costing leaks.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['transport'], minTier: 4, flags: { dir_transport: 1 } },
    choices: [
      {
        label: 'Hold your nerve and defend it',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: [
          { weight: 1, text: 'The first phase opens to genuine acclaim and the doubters go quiet. Vision, justified.' },
          { weight: 1, text: 'The overrun becomes a national joke and your name is attached to every headline. Expensive vindication, deferred.', extra: { stats: { profile: -2 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Announce a "reset" and new oversight',
        effects: { stats: { competence: 2, integrity: -1 } },
        outcomeText: 'You get ahead of the overrun with a tough-sounding review and a new delivery chief. The costs are unchanged; the optics buy you a quarter.',
      },
    ],
  },
  {
    id: 'pf_transport_strike',
    title: 'The network grinds to a halt',
    body: 'A {department} strike has stopped the trains and the country is furious — at the unions, at the operators, and increasingly at you. The union leader wants a meeting; the press wants blood.',
    tags: ['crisis', 'policy'],
    weight: 12, cooldownDays: 360,
    requires: { inGovernment: true, department: ['transport'], minTier: 3 },
    choices: [
      {
        label: 'Get round the table and settle',
        effects: { stats: { competence: 3, partyStanding: -2 } },
        outcomeText: 'You broker a deal and the trains run again. Commuters are relieved; your backbenchers ask why you "caved to the barons".',
      },
      {
        label: 'Face them down with new strike laws',
        effects: { stats: { partyStanding: 4, integrity: -2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You legislate for minimum service levels and dare them to defy it. The right of your party is delighted; the dispute drags on through the courts.',
      },
    ],
  },
  // ===================== CULTURE =====================
  {
    id: 'pf_culture_direction',
    title: 'The broadcaster question',
    body: 'The {department} in-tray is dominated by the national broadcaster: confront it over its funding and its bias, or defend it as a treasured institution. Your party has loud opinions on both sides.',
    tags: ['policy', 'media', 'serious'],
    weight: 15, cooldownDays: 900,
    requires: { inGovernment: true, department: ['culture'], minTier: 4, flags: { dir_culture: false } },
    choices: [
      {
        label: 'Confront it — freeze the funding',
        effects: { stats: { partyStanding: 4, profile: 2 }, setFlags: { dir_culture: 1 } },
        outcomeText: 'You freeze the licence fee and order a review. The base is thrilled; the luvvies are appalled, loudly, on every channel including the one you just froze.',
      },
      {
        label: 'Defend it and modernise gently',
        effects: { stats: { integrity: 3, competence: 2 }, setFlags: { dir_culture: 2 } },
        outcomeText: 'You back the institution and talk about reform "with it, not at it". The arts world warms to you; a chunk of your own side files you under "wet".',
      },
    ],
  },
  {
    id: 'pf_culture_online',
    title: 'The online safety storm',
    body: 'A tragedy has put online harms on every front page and the {department} owns the bill. Campaigners demand you force the platforms to act; the tech giants and free-speech wing warn against overreach.',
    tags: ['policy', 'media', 'serious'],
    weight: 12, cooldownDays: 380,
    requires: { inGovernment: true, department: ['culture'], minTier: 3 },
    choices: [
      {
        label: 'Hit the platforms hard',
        effects: { stats: { profile: 4, constituencyApproval: 3 } },
        outcomeText: 'You announce tough new duties and fines. The bereaved families stand behind you; the tech lobby and the libertarians sharpen their amendments.',
      },
      {
        label: 'Tread carefully on free speech',
        effects: { stats: { integrity: 3, competence: 2, profile: -2 } },
        outcomeText: 'You water the duties down to protect expression. Considered and unpopular — "what is the government afraid of?" asks every interviewer.',
      },
    ],
  },
  // ===================== JUSTICE =====================
  {
    id: 'pf_justice_direction',
    title: 'The sentencing fork',
    body: 'With the prisons full and the {department} brief under pressure, you must set the direction: tougher sentences to satisfy the public, or a rehabilitation-first approach to cut reoffending and ease the crisis.',
    tags: ['policy', 'serious'],
    weight: 16, cooldownDays: 900,
    requires: { inGovernment: true, department: ['justice'], minTier: 4, flags: { dir_justice: false } },
    choices: [
      {
        label: 'Tougher sentencing',
        effects: { stats: { partyStanding: 4, integrity: -2 }, setFlags: { dir_justice: 1 } },
        outcomeText: 'You announce longer sentences and a prison-building programme. The tabloids cheer; the governors quietly ask where the cells are going to come from.',
      },
      {
        label: 'Rehabilitation first',
        effects: { stats: { integrity: 4, competence: 2 }, setFlags: { dir_justice: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You shift money into rehabilitation and community sentences. The evidence is on your side; the headline "soft on crime" is on everyone else\'s.',
      },
    ],
  },
  {
    id: 'pf_justice_payoff',
    title: 'The reoffending figures',
    body: 'Your justice strategy meets the data: reoffending rates, prison numbers, and at least one case the press will turn into a morality play about your judgement.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['justice'], minTier: 4, flags: { dir_justice: 2 } },
    choices: [
      {
        label: 'Stand by the evidence',
        effects: { stats: { integrity: 4, competence: 3 } },
        outcomeText: [
          { weight: 1, text: 'Reoffending falls and the prison pressure eases. Quiet, unglamorous success — the kind that wins arguments years later.' },
          { weight: 1, text: 'An offender on a community sentence commits a terrible crime and your approach is on trial in the court of opinion.', extra: { stats: { partyStanding: -4 }, pollingShock: { party: 'own', delta: -0.4 } } },
        ],
      },
      {
        label: 'Toughen the message, keep the policy',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'You keep the evidence-led policy but wrap it in law-and-order language. The reform survives; your principles need a wash afterwards.',
      },
    ],
  },
  // ===================== FILLING EXISTING CHAINS =====================
  {
    id: 'pf_home_payoff_smart',
    title: 'The smart-policing verdict',
    body: 'Your "smart, not just tough" approach at the {department} has had time to bed in. The crime statistics and the front pages are about to deliver their verdict.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['home'], minTier: 4, flags: { dir_home: 2 } },
    choices: [
      {
        label: 'Make the case for the data',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: [
          { weight: 1, text: 'Neighbourhood crime falls and the approach is quietly copied by your successors. You were right; nobody throws a parade for right.' },
          { weight: 1, text: 'A spike in a headline crime lets the opposition brand you complacent for a fortnight.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
      {
        label: 'Announce a visible crackdown anyway',
        effects: { stats: { partyStanding: 2, integrity: -1 } },
        outcomeText: 'You bolt a high-visibility crackdown onto the smart approach to cover your flank. The data minister in you winces; the politician sleeps better.',
      },
    ],
  },
  {
    id: 'pf_health_payoff_lists',
    title: 'The waiting-list reckoning',
    body: 'You bet the {department} brief on blitzing the waiting lists. The quarterly figures are out today, and the whole government is watching whether your gamble paid off.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['health'], minTier: 4, flags: { dir_health: 1 } },
    choices: [
      {
        label: 'Publish and defend',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: [
          { weight: 2, text: 'The lists are down and you have the chart to prove it. A rare, clean win in the hardest brief in government.' },
          { weight: 1, text: 'The lists barely moved and the money is gone. "Where did the billions go?" is the only question anyone asks.', extra: { stats: { competence: -3 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Move the goalposts on the target',
        effects: { stats: { integrity: -3, profile: 1 } },
        outcomeText: 'You quietly redefine the waiting-list metric so the line bends the right way. The fact-checkers notice; the headline number, for now, behaves.',
      },
    ],
  },
  {
    id: 'pf_health_payoff_foundations',
    title: 'The foundations, tested',
    body: 'You chose to fix the {department}\'s foundations rather than chase the headline numbers. It was the brave call. Now a hard winter is here to test whether the plumbing holds.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true, department: ['health'], minTier: 4, flags: { dir_health: 2 } },
    choices: [
      {
        label: 'Hold the long-term line',
        effects: { stats: { integrity: 4, competence: 3 } },
        outcomeText: [
          { weight: 1, text: 'The reforms hold through the winter and the staff notice the difference. Patient, real, and almost impossible to put on a poster.' },
          { weight: 1, text: 'The headline numbers are still ugly and the public has no patience for "foundations". You take the hit for a slow-burning good.', extra: { stats: { partyStanding: -3 }, pollingShock: { party: 'own', delta: -0.2 } } },
        ],
      },
      {
        label: 'Find some quick wins for the cameras',
        effects: { stats: { profile: 2, competence: -1 } },
        outcomeText: 'You bolt a few visible quick wins onto the long-term plan to feed the news cycle. It muddies the strategy slightly, but buys the reforms time to work.',
      },
    ],
  },
  // ===================== GENERIC MINISTERIAL (any department) =====================
  {
    id: 'pfx_ministerial_broadcast',
    title: 'The interview that gets away',
    body: 'A pre-recorded set-piece interview about your brief turns hostile, and the presenter has found the one figure you cannot defend. The clip will be online before you reach the car.',
    tags: ['media', 'westminster'],
    weight: 12, cooldownDays: 300,
    requires: { inGovernment: true, minTier: 3 },
    choices: [
      {
        label: 'Hold the line, stay disciplined',
        effects: { stats: { partyStanding: 2 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'You repeat the agreed words until the clock runs out. No gaffe, no clip, no glory — exactly what Number 10 wanted.',
      },
      {
        label: 'Concede the point honestly',
        effects: { stats: { profile: 3, integrity: 3 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You admit the figure is bad and say what you will do about it. The public warms to the candour; the grid people do not.',
      },
    ],
  },
  {
    id: 'pfx_spending_bid',
    title: 'The spending round',
    body: 'The Treasury wants every department to find savings, and your bid for {department} funding is in the pile. You can fight loudly for your budget or play the long game as a team player.',
    tags: ['westminster', 'policy'],
    weight: 12, cooldownDays: 400,
    requires: { inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Fight publicly for your budget',
        effects: { stats: { profile: 3, partyStanding: 2 }, relationships: [{ kind: 'rival', delta: -3 }] },
        outcomeText: 'You brief the lobby that your department is being raided and win a partial reprieve. The Chancellor adds you to a list you do not want to be on.',
      },
      {
        label: 'Take the hit and bank the goodwill',
        effects: { stats: { competence: 2, partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 4 }] },
        outcomeText: 'You absorb the cut quietly and become "sound". The goodwill is real currency — spendable at the next reshuffle.',
      },
    ],
  },
  {
    id: 'pfx_agency_failure',
    title: 'The agency that failed',
    body: 'An arm\'s-length body in your {department} has failed spectacularly — lost data, blown budget, a damning report. It is technically independent. It is, today, entirely your problem.',
    tags: ['scandal', 'westminster', 'serious'],
    weight: 11, cooldownDays: 380,
    requires: { inGovernment: true, minTier: 3 },
    choices: [
      {
        label: 'Sack the chief and grip it',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'You remove the chief executive and announce a turnaround plan within the day. Decisive — and the unions and the Lords will pick over the dismissal for months.',
      },
      {
        label: 'Defend the arm\'s-length principle',
        effects: { stats: { integrity: 2, competence: -1 } },
        outcomeText: 'You decline to interfere and let the board act. Constitutionally proper; the public hears "the minister did nothing".',
      },
    ],
  },
  {
    id: 'pfx_despatch_box_uq',
    title: 'The urgent question',
    body: 'The Speaker has granted an urgent question on a {department} failing and you are the minister on duty. The chamber is full, the opposition is circling, and your brief has gaps.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { inGovernment: true, minTier: 3 },
    choices: [
      {
        label: 'Master the detail and own it',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You answer every supplementary with figures and a fix. The sketch-writers call it "a quietly impressive performance" — high praise from people paid to be unkind.',
      },
      {
        label: 'Stonewall with process',
        effects: { stats: { competence: 1, integrity: -2 } },
        outcomeText: 'You deploy "ongoing review" and "in due course" for forty minutes. The question survives unanswered; so, narrowly, do you.',
      },
    ],
  },
  {
    id: 'pfx_lords_amendment',
    title: 'The Lords dig in',
    body: 'The other place has amended your flagship bill — three times — and will not back down. You can compromise, or invoke the will of the elected house and force it through.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Compromise on the substance',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You accept a softened amendment and get the bill on the books. Pragmatic; your backbenchers grumble that the Lords ran the country today.',
      },
      {
        label: 'Force it through with the Parliament Act',
        effects: { stats: { partyStanding: 3, profile: 2 }, relationships: [{ kind: 'rival', delta: -2 }] },
        outcomeText: 'You ram it through unamended and make a point about democratic mandates. The bill passes intact; the constitutional commentators reach for their thesauruses.',
      },
    ],
  },
  {
    id: 'pfx_spad_leak',
    title: 'Your own adviser leaks',
    body: 'A spiky internal memo from one of your own special advisers has reached a journalist, and it makes your {department} look chaotic. The leaker is almost certainly someone you hired.',
    tags: ['scandal', 'westminster'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: true, minTier: 3 },
    choices: [
      {
        label: 'Clear out the team and start clean',
        effects: { stats: { competence: 2, profile: 1 }, relationships: [{ kind: 'ally', delta: -4 }] },
        outcomeText: 'You move the suspects on and rebuild. The leaks stop; so does some of the loyalty you had banked.',
      },
      {
        label: 'Ride it out and trust your people',
        effects: { stats: { integrity: 2 }, relationships: [{ kind: 'ally', delta: 3 }] },
        outcomeText: 'You back your team publicly and refuse a witch-hunt. They repay the loyalty — mostly. The memo is forgotten by Thursday.',
      },
    ],
  },
  {
    id: 'pfx_regulator_defies',
    title: 'The regulator says no',
    body: 'An independent regulator in your {department} has publicly rejected the government\'s direction of travel. You can respect its independence or make clear, on the record, who sets policy in this country.',
    tags: ['westminster', 'policy'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Respect its independence',
        effects: { stats: { integrity: 4, partyStanding: -2 } },
        outcomeText: 'You bite your tongue and let the regulator regulate. Constitutionally sound; the briefing against you for "weakness" begins within the hour.',
      },
      {
        label: 'Slap it down publicly',
        effects: { stats: { partyStanding: 3, integrity: -2 }, relationships: [{ kind: 'journalist', delta: -2 }] },
        outcomeText: 'You remind everyone that ministers, not quangos, answer to the voters. The base loves it; the markets dislike a government that leans on its referees.',
      },
    ],
  },
  {
    id: 'pfx_petition_recall',
    title: 'A bill in your name',
    body: 'A backbench colleague offers to put your pet reform on the {department} brief into a private member\'s bill — your idea, their name, a real chance of law. Or you could wait and do it properly yourself.',
    tags: ['policy', 'party'],
    weight: 11, cooldownDays: 420,
    requires: { inGovernment: true, minTier: 3 },
    choices: [
      {
        label: 'Let them carry it',
        effects: { stats: { integrity: 3, competence: 2 }, relationships: [{ kind: 'ally', delta: 4 }] },
        outcomeText: 'The reform reaches the statute book under someone else\'s name, and you make a friend for life. The change is what mattered; the credit was always borrowed.',
      },
      {
        label: 'Hold it back for a government bill',
        effects: { stats: { partyStanding: 2, profile: 2 } },
        outcomeText: 'You keep the idea in-house for a flagship moment. The colleague is disappointed; the reform waits for a slot in a crowded legislative year.',
      },
    ],
  },
];
