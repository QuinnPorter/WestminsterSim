import { DecisionCard } from '../../types/content';

/** Extra tier-5 leadership content that distinguishes the apex roles:
 *  - minor-party leaders (a role with no dedicated cards before)
 *  - coalition-life dilemmas (gated on the government arrangement)
 *  - additional PM and Leader-of-the-Opposition crises whose poor choices
 *    cascade (rebellions, scandal flags, polling shocks) into the pressure model.
 */
export const LEADER_EXTRA_CARDS: DecisionCard[] = [
  // =========================================================
  // MINOR-PARTY LEADER (leaderRole: ['minorLeader'])
  // =========================================================
  {
    id: 'ml_airtime',
    title: 'The airtime squeeze',
    body: 'The broadcasters have once again left your party out of the big debate, citing "the rules". Your supporters are incandescent. You can make a dignified legal complaint — or pull a stunt that forces your way onto the news.',
    tags: ['media', 'party'],
    weight: 13, cooldownDays: 320,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Pull a stunt they can\'t ignore',
        effects: { stats: { profile: 5, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You turn up anyway, with cameras, and turn exclusion into the story. It runs all evening. Undignified, irresistible, and worth more than any debate podium.',
      },
      {
        label: 'Fight it through the proper channels',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'You lodge the complaint and make the calm constitutional case. The regulator dithers for months. You look like the grown-up — to the small audience that was already listening.',
      },
    ],
  },
  {
    id: 'ml_single_issue',
    title: 'Your moment in the sun',
    body: 'The national conversation has swung, for one glorious week, onto the single issue your party was founded to champion. Everyone suddenly wants your view. Do you ride it for all it is worth, or use the spotlight to prove you are more than one idea?',
    tags: ['media', 'policy'],
    weight: 12, cooldownDays: 360,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Go all-in on the signature issue',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.4 } },
        outcomeText: 'You own the week completely. The polls tick up and your activists are euphoric. The risk — that you remain "the party that only cares about one thing" — is a problem for another day.',
      },
      {
        label: 'Broaden the pitch while they\'re watching',
        effects: { stats: { competence: 4, partyStanding: 2 } },
        outcomeText: 'You pivot from the cause to a rounded prospectus. The true believers grumble that you went off-message; the wider public starts, just slightly, to take you seriously.',
      },
    ],
  },
  {
    id: 'ml_electoral_pact',
    title: 'The stand-aside offer',
    body: 'A larger party quietly proposes a pact: they stand aside in a clutch of seats where you are strong, you return the favour elsewhere. It could win you your first real bloc of MPs — at the cost of your fierce independence.',
    tags: ['party', 'serious'],
    weight: 10, cooldownDays: 600,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Strike the pact',
        effects: { stats: { competence: 3, profile: 2, integrity: -2 } },
        outcomeText: 'You shake hands in a windowless room. A handful of winnable seats open up — and a chunk of your membership accuses you of selling out before a vote is even cast.',
      },
      {
        label: 'Go it alone, everywhere',
        effects: { stats: { integrity: 4, partyStanding: 3 } },
        outcomeText: 'You refuse to do deals and stand a candidate in every seat. Purists adore it. Your psephologist quietly weeps over the wasted votes it will scatter.',
      },
    ],
  },
  {
    id: 'ml_defector',
    title: 'A big fish wants in',
    body: 'A disillusioned MP from one of the big parties wants to cross the floor and sit with you — an instant boost to your tiny group, and an instant headache, because their politics only half-match yours.',
    tags: ['party', 'westminster', 'serious'],
    weight: 9, cooldownDays: 600,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Welcome them with open arms',
        effects: { stats: { profile: 5, partyStanding: -2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'The defection leads the news and doubles your Commons presence overnight. Your founding members mutter that the newcomer doesn\'t really believe a word of it. They\'re probably right.',
      },
      {
        label: 'Politely decline the flag of convenience',
        effects: { stats: { integrity: 5 } },
        outcomeText: 'You decide a borrowed MP is worth less than a coherent party, and say no. The press calls it a missed chance; your activists call it principle. Both, again, are right.',
      },
    ],
  },
  {
    id: 'ml_purity_vs_power',
    title: 'Purity or power',
    body: 'Your conference is split. One half wants to soften the hard edges and chase the votes that could make you a serious force; the other half would rather be right than be in government. As leader, you have to choose which party you lead.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Professionalise and broaden',
        effects: { stats: { competence: 3, profile: 3, partyStanding: -3 } },
        outcomeText: 'You sand off the edges and talk like a government-in-waiting. The polls reward you; a noisy faction storms out to found something purer.',
      },
      {
        label: 'Keep the faith',
        effects: { stats: { integrity: 5, partyStanding: 4 } },
        outcomeText: 'You tell the hall you would rather lose as yourselves than win as someone else. The room erupts. The electoral ceiling stays exactly where it was, but the soul is intact.',
      },
    ],
  },
  {
    id: 'ml_prop_the_government',
    title: 'The price of your votes',
    body: 'You are propping up a minority government on supply and confidence, and tonight they need you for an unpopular bill. You can extract a fresh concession for your trouble — or pull the rug and bring the whole thing down.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 11, cooldownDays: 300,
    requires: { minTier: 5, leaderRole: ['minorLeader'], arrangementIn: ['supplyConfidence'] },
    choices: [
      {
        label: 'Extract a concession and vote it through',
        effects: { stats: { competence: 3, integrity: -2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You name your price and they pay it. You bank a real win for your voters — and own a slice of a bill they hate. Power always costs something.',
      },
      {
        label: 'Pull your support',
        effects: { stats: { integrity: 4, profile: 3, partyStanding: 3 } },
        outcomeText: 'You walk away and dare them to govern without you. The arithmetic collapses and Westminster lurches toward crisis. Your members are thrilled; the markets, less so.',
      },
    ],
  },
  {
    id: 'ml_taken_seriously',
    title: 'The serious interview',
    body: 'A heavyweight presenter has finally booked you for the long, serious sit-down usually reserved for the big two. It is the chance to look prime-ministerial — or at least like a leader the country could imagine in the room.',
    tags: ['media', 'personal'],
    weight: 10, cooldownDays: 380,
    requires: { minTier: 5, leaderRole: ['minorLeader'] },
    choices: [
      {
        label: 'Master the detail, sound like a statesman',
        effects: { stats: { competence: 4, profile: 3 } },
        outcomeText: 'You are across every brief and refuse every trap. By the end the presenter is treating you like a contender. Clips circulate captioned "wait, they\'re actually good".',
      },
      {
        label: 'Play the insurgent outsider',
        effects: { stats: { profile: 4, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You skewer the cosy consensus and position yourself against the whole establishment. It thrills your base and a chunk of the disaffected; the gravitas question lingers.',
      },
    ],
  },
  // =========================================================
  // COALITION LIFE (inGovernment bloc + a given arrangement)
  // =========================================================
  {
    id: 'co_partner_walks',
    title: 'The partner threatens to walk',
    body: 'Your coalition partner has dug in over a flagship bill and is briefing that they will collapse the government rather than swallow it. Call their bluff, and you risk everything; fold, and your own side asks who is really in charge.',
    tags: ['westminster', 'serious'],
    weight: 14, cooldownDays: 300,
    requires: { minTier: 5, inGovernment: true, arrangementIn: ['coalition'] },
    choices: [
      {
        label: 'Call their bluff',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: [
          { weight: 6, text: 'They blink. The bill passes intact and your authority is enhanced — coalition is a game of nerve, and tonight you had more of it.' },
          { weight: 3, text: 'They do not blink. The partnership wobbles to the brink before a 3am fudge saves it — bruised, diminished, and visibly mortal.', extra: { stats: { partyStanding: -4 }, setFlags: { scandal: false } } },
          { weight: 1, text: 'They do not blink — and this time they mean it. The partner walks out of government overnight and the coalition is finished. You carry on, but as a bare minority now, exposed to every vote.', extra: { stats: { partyStanding: -3, profile: 2 }, trigger: 'coalitionBreak' } },
        ],
      },
      {
        label: 'Cut a quiet compromise',
        effects: { stats: { competence: 2, integrity: -2, partyStanding: -2 } },
        outcomeText: 'You water the bill down enough to keep the partner aboard. The government survives the week; your backbenchers grumble that the tail is wagging the dog.',
      },
    ],
  },
  {
    id: 'co_collective_responsibility',
    title: 'A minister breaks ranks',
    body: 'A minister from the other side of the coalition has gone on the radio and trashed a government policy as if they were not in the government at all. Collective responsibility is in tatters and the lobby is delighted.',
    tags: ['westminster', 'party', 'serious'],
    weight: 12, cooldownDays: 340,
    requires: { minTier: 5, inGovernment: true, arrangementIn: ['coalition'] },
    choices: [
      {
        label: 'Demand they retract or resign',
        effects: { stats: { profile: 3, partyStanding: 2 } },
        outcomeText: 'You enforce discipline publicly. The minister sullenly retracts and the partner leadership seethes at being made to grovel. Order restored, goodwill spent.',
      },
      {
        label: 'Let it go to keep the peace',
        effects: { stats: { integrity: -3 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You decide a public row is worse than a private humiliation and look the other way. The papers conclude your government will tolerate anything to survive — and test the theory daily thereafter.',
      },
    ],
  },
  {
    id: 'co_blamed_for_partner',
    title: 'Tarred with their brush',
    body: 'Your coalition partner pushed through a cut that is now deeply unpopular — and the voters are blaming the whole government, your party very much included. Do you publicly distance yourself, or own it as the price of being in power?',
    tags: ['media', 'serious'],
    weight: 12, cooldownDays: 320,
    requires: { minTier: 5, inGovernment: true, arrangementIn: ['coalition'] },
    choices: [
      {
        label: 'Distance yourself publicly',
        effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You make clear, on the record, that this was their idea. Your numbers recover a little — and the partnership grows a degree colder and a degree shorter-lived.',
      },
      {
        label: 'Own it as the price of power',
        effects: { stats: { integrity: 3, competence: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You take collective responsibility on the chin. It costs you in the polls but the coalition holds, and the grown-up reputation compounds quietly over time.',
      },
    ],
  },
  {
    id: 'co_renegotiation',
    title: 'The mid-term renegotiation',
    body: 'Halfway through the Parliament your coalition partner wants to reopen the agreement — more of their manifesto, a bigger department, a louder voice. Concede and you buy stability; refuse and you risk the lot.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 11, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, arrangementIn: ['coalition'] },
    choices: [
      {
        label: 'Give them more to lock them in',
        effects: { stats: { competence: 2, partyStanding: -4 } },
        outcomeText: 'You hand over a department and a slice of the programme. The government is secured to the next election — at the cost of your own side feeling like lodgers in their own house.',
      },
      {
        label: 'Hold the line and dare them',
        effects: { stats: { profile: 2, integrity: 2 } },
        outcomeText: [
          { weight: 2, text: 'You refuse to reopen the deal and they back down. Authority reasserted; the partnership a little more brittle for it.' },
          { weight: 1, text: 'You refuse, and the talks curdle. The coalition staggers on, but the trust is gone and the countdown has begun.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
    ],
  },
  {
    id: 'co_supply_renewal',
    title: 'Renewing the deal',
    body: 'The party propping up your minority government on confidence-and-supply wants to renegotiate the price of its continued support. Their new shopping list is long, and the alternative to paying it is a vote you might not survive.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { minTier: 5, inGovernment: true, arrangementIn: ['supplyConfidence'] },
    choices: [
      {
        label: 'Pay the price and renew',
        effects: { stats: { competence: 2, integrity: -2, partyStanding: -2 } },
        outcomeText: 'You meet most of their demands and the deal rolls on. Survival, bought by the quarter, on someone else\'s terms.',
      },
      {
        label: 'Refuse and govern on a knife-edge',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: [
          { weight: 1, text: 'You refuse, they keep supporting you anyway rather than face an election, and you have called their bluff for free.' },
          { weight: 1, text: 'You refuse, and the arrangement lapses. Every vote is now an adventure and the whips age a year a week.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
    ],
  },
  // =========================================================
  // EXTRA PM CRISES (leaderRole ['pm']) — failures cascade
  // =========================================================
  {
    id: 'pmx_currency_run',
    title: 'A run on the pound',
    body: 'The markets have lost their nerve overnight and sterling is in free-fall. The Governor is on line one, your Chancellor on line two, and the morning markets open in four hours. Whatever you say next moves billions.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 13, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Back the Bank, project calm',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: [
          { weight: 2, text: 'You let the Governor act and say less, not more. By lunchtime the pound steadies and "safe hands" becomes the verdict.' },
          { weight: 1, text: 'Calm is not enough this time; the markets need a fortnight and a painful rate rise to settle. You survive, scarred.', extra: { stats: { partyStanding: -3 }, pollingShock: { party: 'own', delta: -0.4 } } },
        ],
      },
      {
        label: 'Announce a dramatic intervention',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: -0.3 } },
        outcomeText: 'You seize the moment with a bold package. It either looks decisive or panicked, and the City has decided it is the latter. The rebellion that follows adds a name to the letters pile.',
        // a poor crisis response feeds the pressure model
      },
    ],
  },
  {
    id: 'pmx_public_sector_pay',
    title: 'The winter of strikes',
    body: 'Nurses, teachers and rail workers are walking out together and the public mood is turning. Your Chancellor says there is no money; the strikers say there is. The country wants the trains and the wards working again.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 13, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Hold firm — no inflationary deal',
        effects: { stats: { integrity: 3, competence: 2 }, setFlags: { scandal: false } },
        outcomeText: [
          { weight: 1, text: 'You stare them down and, after a grim month, the unions settle near your figure. Authority intact, knuckles white.' },
          { weight: 1, text: 'You hold firm and the strikes harden. Ambulances queue on the news for weeks and your own backbenchers start demanding a deal.', extra: { stats: { partyStanding: -4 }, pollingShock: { party: 'own', delta: -0.5 } } },
        ],
      },
      {
        label: 'Cave to a generous settlement',
        effects: { stats: { partyStanding: -2 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'You find the money after all. The strikes end and the relief is real — but the U-turn is total, the Chancellor is humiliated, and every other union has just learned exactly how to beat you.',
      },
    ],
  },
  {
    id: 'pmx_cabinet_leak',
    title: 'The cabinet leaks',
    body: 'A verbatim account of a tense cabinet meeting — including your own unguarded words — is splashed across the front pages. Someone around that table is briefing against you, and everyone now knows it.',
    tags: ['scandal', 'westminster'],
    weight: 12, cooldownDays: 380,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Hunt and sack the leaker',
        effects: { stats: { profile: 2 }, relationships: [{ kind: 'rival', delta: -6 }] },
        outcomeText: [
          { weight: 1, text: 'You find them and remove them ruthlessly. The cabinet falls silent and loyal — out of fear, but loyal.' },
          { weight: 1, text: 'You sack the wrong person and make a martyr. The real briefer is emboldened and the wound stays open.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
      {
        label: 'Rise above it publicly',
        effects: { stats: { integrity: 2, competence: -1 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You wave it away as Westminster gossip. The dignity plays well; the leaking, undeterred, becomes a weekly fixture that slowly corrodes your authority.',
      },
    ],
  },
  {
    id: 'pmx_signature_pledge',
    title: 'The pledge you can\'t keep',
    body: 'The defining promise of your premiership — the number you put on every poster — is, the latest figures confirm, going to be missed. The press has the data by morning. Your options range from honesty to creative accounting.',
    tags: ['media', 'policy', 'serious'],
    weight: 12, cooldownDays: 450,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Admit it and reset expectations',
        effects: { stats: { integrity: 5, profile: 2, partyStanding: -2 } },
        outcomeText: 'You front up, own the miss, and set a credible new course. A brutal news cycle — but the honesty buys you a longer leash than the spin ever would have.',
      },
      {
        label: 'Move the goalposts quietly',
        effects: { stats: { integrity: -5 }, pollingShock: { party: 'own', delta: -0.3 } },
        outcomeText: 'You redefine the metric so the pledge is technically met. The fact-checkers detonate within the hour, and "you can\'t trust a word they say" hardens into the story of your government.',
      },
    ],
  },
  {
    id: 'pmx_local_wipeout',
    title: 'The local elections wipeout',
    body: 'Your party has been hammered in the local elections — hundreds of councillors gone, a couple of flagship councils lost. The 1922 Committee corridor is full of long faces and the Sunday shows want to know if you will change course.',
    tags: ['party', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Reshuffle and relaunch',
        effects: { stats: { profile: 2, partyStanding: 2 } },
        outcomeText: 'You move the cabinet around and announce a "reset". It buys a few weeks of better headlines and gives the restless something to do other than write letters.',
      },
      {
        label: 'Insist the strategy is working',
        effects: { stats: { partyStanding: -4 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You tell the cameras you will not be blown off course. Steadfast, or deaf — the backbenches reach their own conclusion, and another tranche of letters goes in.',
      },
    ],
  },
  {
    id: 'pmx_loyalty_test',
    title: 'The indispensable ally',
    body: 'Your most powerful cabinet ally — the one who delivers the difficult votes — is demanding a great office of state, and hinting at the despatch box alternative if refused. Promote them and you anger three others; refuse and you may lose your enforcer.',
    tags: ['party', 'westminster', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Give them the job',
        effects: { stats: { partyStanding: -2 }, relationships: [{ kind: 'ally', delta: 6 }, { kind: 'rival', delta: -4 }] },
        outcomeText: 'You hand over the great office. Your enforcer is bound to you tighter than ever; two rivals you just leapfrogged begin, quietly, to count.',
      },
      {
        label: 'Refuse and hold the balance',
        effects: { stats: { profile: 2, integrity: 2 }, relationships: [{ kind: 'ally', delta: -8 }] },
        outcomeText: 'You decline, citing balance. Your ally\'s smile thins; within a month the difficult votes are a little harder to deliver, and you feel the difference.',
      },
    ],
  },
  {
    id: 'pmx_global_stage',
    title: 'The summit moment',
    body: 'At a fraught international summit the talks have stalled and the cameras are waiting for a breakthrough. There is a deal to be had if you spend your political capital brokering it — or you can protect yourself and let it fail on someone else\'s watch.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 460,
    requires: { minTier: 5, inGovernment: true, leaderRole: ['pm'] },
    choices: [
      {
        label: 'Broker the deal yourself',
        effects: { stats: { profile: 4, competence: 3 } },
        outcomeText: [
          { weight: 2, text: 'You shuttle between delegations until dawn and emerge with a communiqué bearing your fingerprints. Statesmanship, witnessed live.' },
          { weight: 1, text: 'You overreach, the deal you announced unravels within days, and the "humiliation abroad" headlines write themselves.', extra: { stats: { profile: -2 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
      {
        label: 'Play it safe and hedge',
        effects: { stats: { competence: 1 } },
        outcomeText: 'You keep your distance and let others fail. No glory, no scar — and a quiet sense, at home, that you were a spectator at your own summit.',
      },
    ],
  },
  // =========================================================
  // EXTRA OPPOSITION-LEADER CARDS (leaderRole ['lo'])
  // =========================================================
  {
    id: 'lox_shadow_budget',
    title: 'The alternative budget',
    body: 'On budget day you get the right of reply and a few minutes to set out what you would do differently. Your shadow Chancellor wants bold, fully-costed dividing lines; your strategists want a small target. The House goes quiet for your answer.',
    tags: ['policy', 'westminster'],
    weight: 13, cooldownDays: 360,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Set out a bold alternative',
        effects: { stats: { profile: 4, competence: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You lay out real numbers and real choices. It is brave, it is quotable, and it hands the government a fortnight of attack lines you will have to defend. Worth it — probably.',
      },
      {
        label: 'Keep it tight and safe',
        effects: { stats: { partyStanding: 2 } },
        outcomeText: 'You skewer their record and promise the details "in good time". Disciplined and unloseable, and faintly unsatisfying — the public still cannot quite say what you are for.',
      },
    ],
  },
  {
    id: 'lox_govt_own_goal',
    title: 'The government implodes',
    body: 'A genuine government crisis is unfolding live — a resignation, a scandal, a policy in flames. This is your moment. Do you go for the jugular, or rise above it and look like the calm government-in-waiting?',
    tags: ['media', 'westminster'],
    weight: 13, cooldownDays: 300,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Go for the jugular',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.3 } },
        outcomeText: 'You prosecute the case mercilessly across every studio. The government bleeds and your numbers jump. A few voters wonder if you protest a little too gleefully.',
      },
      {
        label: 'Be the calm alternative',
        effects: { stats: { competence: 3, integrity: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You decline to gloat and simply look ready to govern. The contrast does the work for you; "statesmanlike" attaches itself to your name without you having to claim it.',
      },
    ],
  },
  {
    id: 'lox_conference_speech',
    title: 'The conference speech',
    body: 'The leader\'s speech: an hour, no notes, the whole party and half the country watching for a reason to believe. Your speechwriters offer two drafts — the soaring vision, or the reassuring prospectus for government.',
    tags: ['party', 'media', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Reach for the soaring vision',
        effects: { stats: { profile: 5 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: [
          { weight: 2, text: 'You bring the hall to its feet and lead every bulletin. For one golden day you look unstoppable.' },
          { weight: 1, text: 'You overreach; the soaring passage tips into the ridiculous and the sketch-writers feast. A long flight home.', extra: { stats: { profile: -2, partyStanding: -2 } } },
        ],
      },
      {
        label: 'Make the case for competence',
        effects: { stats: { competence: 3, partyStanding: 3 } },
        outcomeText: 'You deliver a sober, detailed prospectus for government. No standing ovation, but the serious press takes you seriously, and that is the audience that matters now.',
      },
    ],
  },
  {
    id: 'lox_coalition_question',
    title: 'Ruling it in, ruling it out',
    body: 'With a hung parliament looking likely, the interviewers will not stop asking: who would you do a deal with? Rule everything out and you look rigid; leave doors open and the government screams "coalition of chaos".',
    tags: ['media', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Rule out all deals, demand a majority',
        effects: { stats: { partyStanding: 3, profile: 2 } },
        outcomeText: 'You insist you are fighting for a majority and will do no deals. Clean and disciplined — and a hostage to fortune if the voters hand you a hung parliament anyway.',
      },
      {
        label: 'Keep your options studiously open',
        effects: { stats: { competence: 2, integrity: 1 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You talk about "working with others in the national interest". Grown-up, honest — and a gift to the government\'s "vote for them, get chaos" posters.',
      },
    ],
  },
  {
    id: 'lox_big_lead',
    title: 'Don\'t mess it up',
    body: 'You are miles ahead in the polls and the only story in town is whether you can blow it. Every instinct in the party says play safe and run down the clock; every instinct in you says a big lead is a mandate to be bold.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Play it safe — protect the lead',
        effects: { stats: { partyStanding: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You offer a small target and let the government lose it for you. The lead holds; the cost is a thin mandate and a manifesto nobody can quite remember.',
      },
      {
        label: 'Use the lead to be bold',
        effects: { stats: { profile: 3, integrity: 3 } },
        outcomeText: [
          { weight: 2, text: 'You spend some capital on a genuinely big idea. It defines you, and the lead survives the gamble. A mandate worth having.' },
          { weight: 1, text: 'The bold idea gives the government a target it desperately needed. The gap narrows and the nervous briefing begins.', extra: { stats: { partyStanding: -3 }, pollingShock: { party: 'own', delta: -0.3 } } },
        ],
      },
    ],
  },
  {
    id: 'lox_go_negative',
    title: 'Make it personal?',
    body: 'Your strategists have focus-grouped a brutal personal attack on the Prime Minister — not their record, them. It tests through the roof. Your better angels, and a couple of your shadow cabinet, are queasy about it.',
    tags: ['media', 'party'],
    weight: 10, cooldownDays: 420,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Run the personal attack',
        effects: { stats: { profile: 3, integrity: -3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You go personal and it lands hard. The PM\'s numbers sag and yours firm up. Something faintly curdles, too, in the way the commentariat writes about you.',
      },
      {
        label: 'Keep it about the record',
        effects: { stats: { integrity: 4 }, relationships: [{ kind: 'ally', delta: 3 }] },
        outcomeText: 'You overrule the dark arts and keep the fight on policy. Slower going, and your shadow cabinet respects you for it. The attack ad stays in the drawer, for now.',
      },
    ],
  },
  {
    id: 'lox_defection_to_you',
    title: 'A government MP crosses over',
    body: 'A respected government backbencher wants to cross the floor and join you — a spectacular coup. But they will expect a soft landing, a safe seat and perhaps a frontbench role, and your own people have been queuing for those for years.',
    tags: ['party', 'westminster', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { minTier: 5, inGovernment: false, leaderRole: ['lo'] },
    choices: [
      {
        label: 'Roll out the red carpet',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'ally', delta: -4 }], pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'The defection detonates on the government\'s worst week and you milk it for all it is worth. Your own loyalists, passed over for the newcomer, file the grievance away carefully.',
      },
      {
        label: 'Welcome them to the back benches only',
        effects: { stats: { integrity: 3, partyStanding: 2 } },
        outcomeText: 'You take the win but make clear there are no instant rewards — they earn their place like everyone else. The newcomer is faintly deflated; your own side is quietly delighted.',
      },
    ],
  },
];
