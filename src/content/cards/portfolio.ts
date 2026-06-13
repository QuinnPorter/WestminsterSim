import { DecisionCard } from '../../types/content';

/** Department-specific decisions for ministers and secretaries of state.
 *  Direction choices set `dir_<dept>` flags that later cards pay off. */
export const PORTFOLIO_CARDS: DecisionCard[] = [
  // ---------- TREASURY ----------
  {
    id: 'pf_treasury_direction',
    title: 'The spending review',
    body: 'The Treasury\'s great steering wheel is in your hands. Officials present the fork in the road: borrow to invest and bet on growth, or balance the books and bet on credibility. Whole careers — and governments — have died on both paths.',
    tags: ['policy', 'serious'],
    weight: 18, cooldownDays: 900,
    requires: { inGovernment: true,department: ['treasury'], minTier: 4, flags: { dir_treasury: false } },
    choices: [
      {
        label: 'Borrow to invest — go for growth',
        effects: { setFlags: { dir_treasury: 1 }, stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'Cranes, rail lines, laboratories: the investment programme is the biggest in a generation. The bond markets twitch but hold. Now the bet needs time — the one thing chancellors are never given.',
      },
      {
        label: 'Balance the books — credibility first',
        effects: { setFlags: { dir_treasury: 2 }, stats: { competence: 3 }, pollingShock: { party: 'own', delta: -0.3 } },
        outcomeText: 'Discipline, rules, and a fiscal headroom chart you will come to know like a family photograph. The markets purr; the spending departments howl. You have chosen the long, unglamorous road.',
      },
    ],
  },
  {
    id: 'pf_treasury_payoff_invest',
    title: 'The growth numbers',
    body: 'Eighteen months after your investment budget, the quarterly figures land on your desk an hour before the world sees them. Your private secretary\'s face gives nothing away, which is itself information.',
    tags: ['policy', 'serious'],
    weight: 20, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true,department: ['treasury'], minTier: 4, flags: { dir_treasury: 1 } },
    choices: [
      {
        label: 'Open the envelope',
        effects: {},
        outcomeText: [
          { weight: 3, text: 'Growth: revised up. The investment bet is paying out, and "the Chancellor\'s gamble" quietly becomes "the Chancellor\'s strategy" across three editorials. You allow yourself one (1) celebratory biscuit.', extra: { stats: { competence: 4, profile: 4 }, pollingShock: { party: 'own', delta: 0.8 } } },
          { weight: 2, text: 'Flat. The projects are real but the growth is late — and the borrowing costs are not. The opposition\'s "money pit" attack line writes itself. The bet needed time; the political clock disagrees.', extra: { stats: { partyStanding: -4 }, pollingShock: { party: 'own', delta: -0.7 } } },
        ],
      },
      {
        label: 'Pre-brief the framing first',
        effects: { stats: { integrity: -2 } },
        outcomeText: 'Whatever the numbers say, by the time they land the lobby has been taught how to read them. The figures are mixed; the coverage is survivable. Spin is a tool; today it was a seatbelt.',
      },
    ],
  },
  {
    id: 'pf_treasury_market_wobble',
    title: 'The markets are talking',
    body: 'Sterling slides on a rumour about your next statement. The Bank is watching, the front pages are sharpening, and a single wrong sentence from you tonight could cost billions by morning.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 12, cooldownDays: 500,
    requires: { inGovernment: true,department: ['treasury'], minTier: 4 },
    choices: [
      {
        label: 'Calm, boring reassurance',
        effects: { stats: { competence: 3 } },
        outcomeText: 'You deliver four sentences of weapons-grade dullness about fiscal frameworks. Sterling steadies. Being boring on purpose at the right moment is the most underrated skill in the building.',
      },
      {
        label: 'Face down the speculators',
        effects: { stats: { profile: 3 } },
        outcomeText: [
          { weight: 1, text: '"We will not be moved by people betting against Britain." The defiance lands, the slide reverses, and the clip is glorious. High-wire stuff — the net was never there.', extra: { pollingShock: { party: 'own', delta: 0.4 } } },
          { weight: 1, text: 'The markets call your bluff by lunchtime. The slide steepens, the Bank intervenes, and "Chancellor picks fight with bond market, loses" is exactly as bad a headline as it sounds.', extra: { pollingShock: { party: 'own', delta: -0.8 }, stats: { competence: -3 } } },
        ],
      },
    ],
  },

  // ---------- FOREIGN ----------
  {
    id: 'pf_foreign_direction',
    title: 'The crisis abroad',
    body: 'A regional conflict is escalating and allies are on the phone hourly. The department wants a doctrine, not a reaction: is Britain, under your Foreign Office, a power that intervenes, sanctions, or brokers?',
    tags: ['policy', 'crisis', 'serious'],
    weight: 18, cooldownDays: 900,
    requires: { inGovernment: true,department: ['foreign'], minTier: 4, flags: { dir_foreign: false } },
    choices: [
      {
        label: 'Lead the intervention coalition',
        effects: { setFlags: { dir_foreign: 1 }, stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'Britain steps forward and others fall in behind — for now. The flags look magnificent outside the summit. The commitments underneath them will own your diary for years.',
      },
      {
        label: 'Sanctions and isolation',
        effects: { setFlags: { dir_foreign: 2 }, stats: { competence: 3 } },
        outcomeText: 'The sanctions package is forensic — assets, shipping, the discreet London enablers no one likes to mention. Slower than airstrikes, safer than airstrikes, and the lawyers love you.',
      },
      {
        label: 'Broker — the honest middleman',
        effects: { setFlags: { dir_foreign: 3 }, stats: { integrity: 3 } },
        outcomeText: 'You offer London as the table everyone can sit at. Allies grumble about fence-sitting; the belligerents, crucially, both keep taking your calls. Quiet rooms, long game.',
      },
    ],
  },
  {
    id: 'pf_foreign_payoff',
    title: 'The doctrine is tested',
    body: 'Six months on, the crisis you set Britain\'s course on reaches its hinge point. The outcome will be read — fairly or not — as the verdict on your doctrine.',
    tags: ['policy', 'crisis', 'serious'],
    weight: 20, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true,department: ['foreign'], minTier: 4, flags: { dir_foreign: 1 } },
    choices: [
      {
        label: 'Hold the coalition together',
        effects: {},
        outcomeText: [
          { weight: 2, text: 'The intervention holds, the ceasefire sticks, and the photo of you between two presidents becomes the one your team uses for everything. History will quibble; tonight, it worked.', extra: { stats: { profile: 5, competence: 3 }, pollingShock: { party: 'own', delta: 0.5 } } },
          { weight: 1, text: 'An ally wobbles, the mission creeps, and the questions get harder: how long, how much, to what end? You defend the doctrine at the despatch box while quietly ordering the exit options paper.', extra: { stats: { profile: -2 }, pollingShock: { party: 'own', delta: -0.5 } } },
        ],
      },
      {
        label: 'Declare success and step back',
        effects: { stats: { integrity: -3, competence: 1 } },
        outcomeText: 'You bank the gains, define victory generously, and hand the file to the multilaterals. Cynics note the timing. Strategists note the avoided quagmire. Both are right.',
      },
    ],
  },
  {
    id: 'pf_foreign_ambassador_row',
    title: 'The undiplomatic cable',
    body: 'A friendly nation\'s government is furious: a leaked Foreign Office cable describes their leader as "a vain mediocrity surrounded by worse". The ambassador who wrote it is excellent at their job. The summit is next month.',
    tags: ['crisis', 'westminster'],
    weight: 12, cooldownDays: 500,
    requires: { inGovernment: true,department: ['foreign'], minTier: 3 },
    choices: [
      {
        label: 'Defend your ambassador',
        effects: { stats: { integrity: 4 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You refuse to feed a good diplomat to a news cycle. The aggrieved government huffs for a fortnight and then, having tested you and found bedrock, quietly moves on. The diplomatic service notices who stood firm.',
      },
      {
        label: 'Recall them quietly',
        effects: { stats: { competence: 1, integrity: -3 } },
        outcomeText: 'The ambassador comes home to a dignified role and a knighthood-shaped apology. The summit proceeds smoothly. Somewhere in the service, a hundred honest cables get rewritten in beige.',
      },
    ],
  },

  // ---------- HOME ----------
  {
    id: 'pf_home_direction',
    title: 'The Home Office fork',
    body: 'Crime stats, small boats, police numbers: the Home Office brief is a wall of fires. Your officials need to know which Home Secretary you are — the iron fist the base wants, or the cool head the courts will tolerate.',
    tags: ['policy', 'serious'],
    weight: 18, cooldownDays: 900,
    requires: { inGovernment: true,department: ['home'], minTier: 4, flags: { dir_home: false } },
    choices: [
      {
        label: 'Tough — enforcement first',
        effects: { setFlags: { dir_home: 1 }, pollingShock: { party: 'own', delta: 0.4 }, stats: { integrity: -2 } },
        outcomeText: 'Raids, removals, mandatory minimums: the package is as hard as the lawyers will let it be, and then a little harder. The base roars approval. The legal challenges begin filing before the press release finishes.',
      },
      {
        label: 'Smart — evidence and prevention',
        effects: { setFlags: { dir_home: 2 }, stats: { competence: 3, integrity: 3 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'Early intervention, treatment, neighbourhood policing — everything that works and nothing that headlines. "SOFT TOUCH" says the front page, above a story that will be wrong in three years.',
      },
    ],
  },
  {
    id: 'pf_home_payoff',
    title: 'The verdict on your watch',
    body: 'A year of your Home Office direction, and the annual figures are out tomorrow. Tonight you get the advance copy and a glass of something while you decide how to meet the morning.',
    tags: ['policy', 'serious'],
    weight: 20, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: true,department: ['home'], minTier: 4, flags: { dir_home: 1 } },
    choices: [
      {
        label: 'Read the numbers',
        effects: {},
        outcomeText: [
          { weight: 1, text: 'The enforcement surge shows up exactly where you promised: the headline numbers fall, the tabloids purr, and the courts have struck down only one flagship measure out of four. In this brief, that is a triumph.', extra: { stats: { profile: 3, partyStanding: 4 }, pollingShock: { party: 'own', delta: 0.5 } } },
          { weight: 1, text: 'The headline numbers are stubborn, the flagship scheme is in court, and a documentary crew has found the case that breaks hearts. The iron fist made you famous; tonight it makes you the story.', extra: { stats: { profile: -2, integrity: -2 }, pollingShock: { party: 'own', delta: -0.6 } } },
        ],
      },
      {
        label: 'Get ahead with a new announcement',
        effects: { stats: { competence: 1, integrity: -2 } },
        outcomeText: 'You launch tomorrow\'s initiative an hour before today\'s figures. The Home Office two-step: always be announcing. The numbers land in paragraph six, where numbers belong.',
      },
    ],
  },
  {
    id: 'pf_home_prison_crisis',
    title: 'No room at the prisons',
    body: 'The prison estate hits capacity on a Tuesday afternoon. By Thursday you must either authorise early releases, ship prisoners to police cells at vast cost, or watch the courts stop sentencing. There is no good option, only a least-bad one with your name on it.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 12, cooldownDays: 550,
    requires: { inGovernment: true,department: ['home', 'justice'], minTier: 3 },
    choices: [
      {
        label: 'Early release, carefully screened',
        effects: { stats: { competence: 3, integrity: 2 }, pollingShock: { party: 'own', delta: -0.4 } },
        outcomeText: 'You sign the scheme, own it at the despatch box, and pray nightly that the screening holds. The attack ads are instant. The alternative was worse, which is the epitaph of every Home Office decision ever taken.',
      },
      {
        label: 'Police cells and emergency portacabins',
        effects: { stats: { competence: -1 } },
        outcomeText: 'The most expensive option and the least visible — which is to say, the political one. The bill is astronomical, the chief constables are mutinous, and the can is successfully kicked eleven months down the road.',
      },
    ],
  },

  // ---------- HEALTH ----------
  {
    id: 'pf_health_direction',
    title: 'The NHS, your move',
    body: 'The waiting list chart on your office wall goes up and to the right. The department offers two genuine strategies: pour everything into emergency capacity for visible wins, or fund the unglamorous reform of community care that pays out after the next election.',
    tags: ['policy', 'serious'],
    weight: 18, cooldownDays: 900,
    requires: { inGovernment: true,department: ['health'], minTier: 4, flags: { dir_health: false } },
    choices: [
      {
        label: 'Blitz the waiting lists now',
        effects: { setFlags: { dir_health: 1 }, pollingShock: { party: 'own', delta: 0.4 }, stats: { profile: 2 } },
        outcomeText: 'Weekend surgeries, surgical hubs, eye-watering overtime: the numbers start moving within months and so do the headlines. The wonks mutter "unsustainable". The patients getting hips this year do not.',
      },
      {
        label: 'Fix the foundations quietly',
        effects: { setFlags: { dir_health: 2 }, stats: { competence: 4, integrity: 3 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'Community care, prevention, workforce pipelines — the dull machinery that decides whether the NHS exists in twenty years. Nothing announceable happens for ages. That was the deal you made with yourself.',
      },
    ],
  },
  {
    id: 'pf_health_winter',
    title: 'Winter comes for the NHS',
    body: 'The first cold snap and the system buckles on schedule: ambulances queuing, corridors full, one trust declaring a critical incident live on the lunchtime news. The cameras want a Health Secretary. Preferably contrite.',
    tags: ['crisis', 'media', 'serious'],
    weight: 13, cooldownDays: 360,
    requires: { inGovernment: true,department: ['health'], minTier: 3 },
    choices: [
      {
        label: 'Go to the worst hospital, on camera',
        effects: { stats: { integrity: 3, profile: 3 } },
        outcomeText: 'You stand in the corridor everyone is talking about and say the unsayable: "This is not acceptable, and it is my job to fix it." The staff, braced for a photo-op, get an actual conversation. The clip is human. Rare currency.',
      },
      {
        label: 'Command and control from the centre',
        effects: { stats: { competence: 3, profile: -1 } },
        outcomeText: 'Discharge taskforces, surge funding, military planners in by Thursday. The system steadies measurably. On screen, however, the empty chair where a Health Secretary should be is filling airtime.',
      },
    ],
  },

  // ---------- EDUCATION ----------
  {
    id: 'pf_education_strikes',
    title: 'Out at the gates',
    body: 'The teaching unions announce rolling strikes over pay. The pickets are sympathetic, the parents are furious, the Treasury is immovable, and you are the face in the middle of the Venn diagram.',
    tags: ['policy', 'crisis'],
    weight: 14, cooldownDays: 500,
    requires: { inGovernment: true,department: ['education'], minTier: 3 },
    choices: [
      {
        label: 'Get in the room and settle it',
        effects: { stats: { competence: 3 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'Forty hours of talks, one creative pension tweak the Treasury can live with, and a deal. The strikes end. Number 10 grumbles about "rewarding militancy" right up until the polling comes back positive.',
      },
      {
        label: 'Hold the line on pay',
        effects: { stats: { partyStanding: 3 }, pollingShock: { party: 'own', delta: -0.4 } },
        outcomeText: 'You hold, the strikes roll on, and every news bulletin opens with locked school gates. Fiscal discipline is real; so are two million parents arranging emergency childcare with your name in their mouths.',
      },
      {
        label: 'Go over the unions to the public',
        effects: { stats: { profile: 3, integrity: -2 } },
        outcomeText: [
          { weight: 1, text: 'Your direct appeal — open letter, morning round, a genuinely good assembly-hall speech — splits the room. Moderate teachers drift back; the union leadership looks isolated. A win on points.', extra: { pollingShock: { party: 'own', delta: 0.3 } } },
          { weight: 1, text: 'The appeal reads as union-bashing and the staff rooms harden. The dispute gains a month and you gain a nickname on the picket signs. Not the good kind.', extra: { pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
    ],
  },

  // ---------- DEFENCE ----------
  {
    id: 'pf_defence_procurement',
    title: 'The £4 billion question',
    body: 'The flagship procurement programme is late, over budget, and — a colonel tells you privately, at risk to his career — may not actually work. Cancelling it kills jobs in twenty constituencies. Continuing it feeds a fiasco.',
    tags: ['policy', 'scandal', 'serious'],
    weight: 14, cooldownDays: 600,
    requires: { inGovernment: true,department: ['defence'], minTier: 3 },
    choices: [
      {
        label: 'Cancel it and take the heat',
        effects: { stats: { integrity: 5, competence: 3, partyStanding: -4 } },
        outcomeText: 'You kill the programme in a statement that names the sunk-cost fallacy out loud in the chamber. Twenty MPs with affected constituencies form an orderly queue outside your office. The NAO report, two years later, calls it "the right decision, courageously taken". Cold comfort, warmly stored.',
      },
      {
        label: 'Restructure and carry on',
        effects: { stats: { competence: -2, partyStanding: 2 } },
        outcomeText: 'A "fundamental reset": new management, new milestones, same programme. The jobs survive, the fiasco continues at a slower burn, and the file gains another inch of paper for your successor.',
      },
      {
        label: 'Protect the whistleblower, order an inquiry',
        effects: { stats: { integrity: 4, profile: 2 } },
        outcomeText: 'The colonel keeps his career; the programme gets independent eyes. The inquiry will take a year and recommend most of what the colonel said for free. But the building learns that telling you the truth is survivable — which changes what you get told.',
      },
    ],
  },
  {
    id: 'pf_defence_deployment',
    title: 'The request for forces',
    body: 'An ally formally requests British forces for a peacekeeping deployment in a place most of the cabinet cannot point to on a map. The military advice is "feasible, not trivial". The political advice is a shrug in a suit.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 550,
    requires: { inGovernment: true,department: ['defence'], minTier: 4 },
    choices: [
      {
        label: 'Recommend the deployment',
        effects: { stats: { profile: 2 } },
        outcomeText: [
          { weight: 2, text: 'The deployment goes well — quiet, professional, genuinely stabilising. Nobody notices, which in defence is the definition of success. The ally remembers. Allies always remember.', extra: { stats: { competence: 3 } } },
          { weight: 1, text: 'Two months in, an incident: casualties, an urgent question, a grieving family on the news. You stand at the despatch box and own the recommendation that was yours. The hardest hour of the job so far.', extra: { stats: { profile: -2, integrity: 2 } } },
        ],
      },
      {
        label: 'Offer support, not soldiers',
        effects: { stats: { competence: 2 } },
        outcomeText: 'Airlift, intelligence, training — everything but boots. The ally is politely disappointed; the families of the soldiers who didn\'t go are unaware there was ever a question. You sleep fine. Mostly.',
      },
    ],
  },

  // ---------- JUSTICE ----------
  {
    id: 'pf_justice_backlog',
    title: 'The queue for justice',
    body: 'The court backlog has reached the point where victims wait years for trials and defence barristers schedule around retirements. The system is quietly failing, and quietly is the only reason it isn\'t the lead story.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 500,
    requires: { inGovernment: true,department: ['justice'], minTier: 3 },
    choices: [
      {
        label: 'Emergency courts, emergency money',
        effects: { stats: { competence: 3 } },
        outcomeText: 'Nightingale courts in conference centres, retired judges un-retired, a settlement with the criminal bar that costs less than everyone pretended it would. The queue starts moving. Justice, slightly delayed, slightly less denied.',
      },
      {
        label: 'Structural reform — fewer cases in court',
        effects: { stats: { competence: 2, integrity: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'Diversion, mediation, out-of-court disposals: the serious answer, and the attackable one. "JUSTICE ON THE CHEAP" writes itself. The backlog graph, alone among your critics, slowly concedes the point.',
      },
    ],
  },

  // ---------- GENERIC MINISTERIAL (any department) ----------
  {
    id: 'pf_generic_quango',
    title: 'The bonfire question',
    body: 'A review lands on your desk recommending the abolition of three {department} arm\'s-length bodies. One is useless, one is useful, and one is chaired by a former MP with excellent friends in the press.',
    tags: ['westminster', 'policy', 'funny'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: true,minTier: 3 },
    choices: [
      {
        label: 'Abolish all three',
        effects: { stats: { profile: 2, competence: 1 }, relationships: [{ kind: 'journalist', delta: -3 }] },
        outcomeText: 'A clean bonfire plays well — "minister cuts quangocracy" — right up until the well-connected chair begins their farewell tour of the comment pages. Three weeks of elegant poison, survivable but instructive.',
      },
      {
        label: 'Abolish the useless one only',
        effects: { stats: { competence: 2 } },
        outcomeText: 'Surgical, sensible, and absolutely no fun for anyone. The useful body survives to be useful; the connected chair sends an effusive thank-you note you file under "evidence".',
      },
    ],
  },
  {
    id: 'pf_generic_underspend',
    title: 'Use it or lose it',
    body: 'With six weeks left in the financial year, your {department} officials sheepishly reveal a £40 million underspend. Hand it back to the Treasury and look prudent, or spend it fast and look... fast.',
    tags: ['westminster', 'policy', 'funny'],
    weight: 11, cooldownDays: 450,
    requires: { inGovernment: true,minTier: 3 },
    choices: [
      {
        label: 'Blitz it on small, ready projects',
        effects: { stats: { constituencyApproval: 2, competence: 1 } },
        outcomeText: 'Forty million becomes four hundred small grants — roofs fixed, kit bought, pilots funded. Imperfectly targeted, imperfectly audited, and genuinely useful. The Treasury\'s disappointment is a bonus.',
      },
      {
        label: 'Hand it back with a flourish',
        effects: { stats: { partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 3 }] },
        outcomeText: 'You return the money with a pointed note about disciplined government. The Chancellor quotes you approvingly at cabinet. Your own officials look at you the way a family looks at someone who returns the bread basket.',
      },
    ],
  },
  {
    id: 'pf_generic_petition',
    title: 'The petition hits a million',
    body: 'An online petition demanding a change squarely within your {department} brief crosses a million signatures, propelled by a celebrity with more followers than the electorate of Wales. The policy is genuinely complicated. The petition is genuinely not.',
    tags: ['media', 'policy'],
    weight: 12, cooldownDays: 400,
    requires: { inGovernment: true,minTier: 3 },
    choices: [
      {
        label: 'Meet the celebrity, find the deal',
        effects: { stats: { profile: 4 } },
        outcomeText: 'The photo of you and the celebrity shaking hands does numbers beyond any policy launch in departmental history. The actual concession is modest and sensible. Nobody reads that far. Everybody wins.',
      },
      {
        label: 'Explain the complexity, hold position',
        effects: { stats: { integrity: 3, profile: -1 } },
        outcomeText: 'Your thread explaining the trade-offs is praised by forty policy professionals and read by little else. The celebrity calls you "part of the problem" to nine million people. Governing: occasionally a vocation, rarely a popularity contest.',
      },
    ],
  },
  {
    id: 'pf_generic_predecessor_bomb',
    title: 'The unexploded decision',
    body: 'Deep in the {department} files, your officials find it: a decision your predecessor signed, legally binding, quietly catastrophic, and timed to detonate within the year. They watched you read it. They are waiting.',
    tags: ['westminster', 'scandal', 'serious'],
    weight: 10, cooldownDays: 600,
    requires: { inGovernment: true,minTier: 3 },
    choices: [
      {
        label: 'Defuse it publicly — blame attached',
        effects: { stats: { competence: 3, integrity: 2 }, relationships: [{ kind: 'rival', delta: -4 }] },
        outcomeText: 'You unwind the decision in a statement that is scrupulously factual about whose signature is on it. Expensive, embarrassing, and over. Your predecessor\'s allies add you to a list. You were already on the list.',
      },
      {
        label: 'Defuse it quietly — absorb the cost',
        effects: { stats: { competence: 2, partyStanding: 2 } },
        outcomeText: 'The unwinding is buried in a written statement on the last day before recess, as tradition demands. The cost lands in your budget, invisibly. The party is spared a story. Your predecessor never knows what you did for them — which is, you reflect, the point of parties.',
      },
    ],
  },
  {
    id: 'pf_generic_select_committee_star',
    title: 'A star witness, against you',
    body: 'The select committee examining your {department} brief has found a devastating witness: a frontline worker, articulate and unimpeachable, whose testimony about your policy will lead the bulletins. You are up directly after them.',
    tags: ['westminster', 'media', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: true,minTier: 3 },
    choices: [
      {
        label: 'Concede what they got right',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: '"I watched that testimony, and much of it is true." The committee, loaded for evasion, has to reload entirely. Your candour shares the bulletin with their testimony rather than losing to it.',
      },
      {
        label: 'Rebut with your own numbers',
        effects: { stats: { competence: 1 } },
        outcomeText: [
          { weight: 1, text: 'Your statistics are solid and your delivery calm, and on points you probably win the session. On television, a minister with a spreadsheet loses to a nurse with a story every single time. Today is no exception.', extra: { stats: { profile: -2 } } },
          { weight: 1, text: 'One of your numbers turns out to be the witness\'s number, deployed better. The committee chair\'s eyebrow does the rest. A long afternoon.', extra: { stats: { competence: -1, profile: -1 } } },
        ],
      },
    ],
  },
];
