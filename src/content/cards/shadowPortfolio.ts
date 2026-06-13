import { DecisionCard } from '../../types/content';

/** Shadow-portfolio decisions, tiers 3-4, opposition only. These are about
 *  criticism, positioning and stance-taking — NOT governing. Opposition can't
 *  set policy, so polling shocks are smaller and the rewards lean toward
 *  partyStanding / integrity / profile rather than competence-in-office.
 *  A couple of cards persist a stance via `shdir_<dept>` flags. */
export const SHADOW_PORTFOLIO_CARDS: DecisionCard[] = [
  // ---------- SHADOW TREASURY (a stance chain) ----------
  {
    id: 'shp_treasury_stance',
    title: 'The fiscal dividing line',
    body: 'As shadow Chancellor you must decide the line you will hold for this Parliament. The {govparty} dare you to match their spending plans. Do you bind yourself to an iron fiscal rule, or keep your hands free to promise more?',
    tags: ['policy', 'serious'],
    weight: 16, cooldownDays: 900,
    requires: { inGovernment: false, department: ['treasury'], minTier: 4, flags: { shdir_treasury: false } },
    choices: [
      {
        label: 'Adopt an iron fiscal rule',
        effects: { stats: { competence: 3, profile: 2 }, setFlags: { shdir_treasury: 1 } },
        outcomeText: 'You promise to match their spending totals to the penny and dare them to call you reckless. The City nods; your own activists mutter about "austerity-lite". Credibility bought, base unsettled.',
      },
      {
        label: 'Keep your hands free',
        effects: { stats: { partyStanding: 4 }, setFlags: { shdir_treasury: 2 } },
        outcomeText: 'You refuse to be boxed in: "We will set out our plans when we see the books." The party faithful cheer the ambition; the government brands you a blank cheque waiting to bounce.',
      },
    ],
  },
  {
    id: 'shp_treasury_payoff_rule',
    title: 'The rule, tested',
    body: 'Months on, an economic shock hits and your iron fiscal rule is suddenly a cage. Activists beg you to abandon it and promise a rescue package. The cameras want to know if your discipline survives contact with reality.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: false, department: ['treasury'], minTier: 4, flags: { shdir_treasury: 1 } },
    choices: [
      {
        label: 'Hold the line',
        effects: { stats: { integrity: 5, competence: 2 } },
        outcomeText: [
          { weight: 2, text: 'You hold firm and look like a government-in-waiting. When the dust settles, "the grown-ups" is the phrase that sticks — to you.' },
          { weight: 1, text: 'You hold the line and the line holds you: a brutal fortnight of "heartless" headlines before the markets vindicate you.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
      {
        label: 'Quietly bin the rule',
        effects: { stats: { competence: -3, profile: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You drop the rule with a flurry of clauses nobody reads. The rescue promise lands well — until a clip of your old "iron rule" speech goes viral beside it.',
      },
    ],
  },
  {
    id: 'shp_treasury_payoff_free',
    title: 'Show us the money',
    body: 'Your "hands free" approach has worked a treat — until now. Every interview ends the same way: "Where, precisely, is the money coming from?" The fudge is running out of road.',
    tags: ['media', 'policy'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { inGovernment: false, department: ['treasury'], minTier: 4, flags: { shdir_treasury: 2 } },
    choices: [
      {
        label: 'Finally publish the costings',
        effects: { stats: { competence: 4, integrity: 3, partyStanding: -2 } },
        outcomeText: 'You put real numbers on the table. Two pledges quietly vanish in the process, but the "blank cheque" line dies overnight. Painful, and overdue.',
      },
      {
        label: 'Keep the dream alive',
        effects: { stats: { profile: 2, integrity: -3 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You dodge again, beautifully. The base stays happy; the credibility gap, now visible from space, becomes the government\'s favourite attack line.',
      },
    ],
  },
  // ---------- OTHER SHADOW DEPARTMENTS (stateless stance/criticism) ----------
  {
    id: 'shp_home_uq',
    title: 'The crime figures',
    body: 'Bad {department} numbers have landed mid-morning. You can table an Urgent Question and savage the Home Secretary across the despatch box this afternoon — or hold your fire for a forensic takedown when you have the full data.',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 320,
    requires: { inGovernment: false, department: ['home'], minTier: 3 },
    choices: [
      {
        label: 'Table the Urgent Question now',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You are on your feet by 3:30 and on every bulletin by six. The minister stonewalls; the clip of you demanding answers does the rest. Opposition is theatre, and you played the house.',
      },
      {
        label: 'Wait and build the case',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'A week later your dossier cross-references three years of buried tables. It runs and runs. Slower, but the government never quite shakes it off.',
      },
    ],
  },
  {
    id: 'shp_home_stance',
    title: 'Tough or fair?',
    body: 'A grim {department} case dominates the news and your party is split down the middle. Half want you to outflank the government on toughness; half want you to defend due process. The cameras are waiting for your line.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: false, department: ['home'], minTier: 3 },
    choices: [
      {
        label: 'Outflank them on the right',
        effects: { stats: { profile: 3, integrity: -2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You go harder than the Home Secretary and dominate the phone-ins. Your liberal wing is appalled; the red-wall seats you lost are suddenly listening again.',
      },
      {
        label: 'Defend due process',
        effects: { stats: { integrity: 5 }, relationships: [{ kind: 'journalist', delta: 3 }] },
        outcomeText: 'You make the unfashionable case for the rule of law, calmly, and take the hits. The commentariat calls it principled; the tabloids call it soft. Both are right.',
      },
    ],
  },
  {
    id: 'shp_foreign_national_interest',
    title: 'Country before party?',
    body: 'The government is mid-crisis on the world stage and asks the opposition to hold the line in the national interest. Backing them looks statesmanlike — and lets them off the hook for the mess that got us here.',
    tags: ['policy', 'serious'],
    weight: 10, cooldownDays: 420,
    requires: { inGovernment: false, department: ['foreign'], minTier: 3 },
    choices: [
      {
        label: 'Back them in the national interest',
        effects: { stats: { integrity: 4, competence: 2 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You stand at the despatch box and offer support, no caveats. It looks like a government-in-waiting. Your attack-dogs grumble that you handed the Foreign Secretary a free pass.',
      },
      {
        label: 'Support the aim, savage the handling',
        effects: { stats: { profile: 3, partyStanding: 3 } },
        outcomeText: 'You thread the needle: "We support our forces and we condemn the incompetence that endangered them." The clip is sharp, the position defensible, the Foreign Secretary furious.',
      },
    ],
  },
  {
    id: 'shp_health_winter',
    title: 'Weaponising winter',
    body: 'The {department} service is in its annual winter crisis and the human stories are heartbreaking. Your team has a devastating ad ready built around one family — powerful, and a little exploitative.',
    tags: ['media', 'policy'],
    weight: 11, cooldownDays: 360,
    requires: { inGovernment: false, department: ['health'], minTier: 3 },
    choices: [
      {
        label: 'Run the emotional ad',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.3 }, relationships: [{ kind: 'journalist', delta: -2 }] },
        outcomeText: 'The ad is everywhere within hours and the government is on the back foot for a week. A few commentators tut about using a real family; the focus groups do not tut at all.',
      },
      {
        label: 'Lead with a credible plan',
        effects: { stats: { competence: 4, integrity: 3 } },
        outcomeText: 'You resist the tearjerker and publish a costed workforce plan instead. Worthy, less viral — but it is the document the government quietly steals from in the spring.',
      },
    ],
  },
  {
    id: 'shp_education_whitepaper',
    title: 'The white paper response',
    body: 'A 200-page {department} white paper lands and you have until the morning round to respond. There is genuinely good stuff buried in it. Do you welcome the good and propose better, or oppose the lot on principle?',
    tags: ['policy', 'westminster'],
    weight: 10, cooldownDays: 380,
    requires: { inGovernment: false, department: ['education'], minTier: 3 },
    choices: [
      {
        label: 'Welcome the good, demand better',
        effects: { stats: { competence: 3, integrity: 3 }, relationships: [{ kind: 'chiefWhip', delta: -2 }] },
        outcomeText: 'You credit the sensible bits and skewer the gaps. Grown-up, persuasive — and your own whips wish you would just oppose things like a normal opposition.',
      },
      {
        label: 'Oppose it root and branch',
        effects: { stats: { partyStanding: 4, profile: 2 } },
        outcomeText: 'You call it a sticking plaster on a self-inflicted wound and vote against the lot. The base loves the clarity; a few teachers wonder why you opposed the bit that would have helped them.',
      },
    ],
  },
  {
    id: 'shp_defence_action',
    title: 'The vote on action',
    body: 'The government brings a motion authorising military action on the {department} brief. The intelligence is contested, the cause arguable, and your party remembers the last time it trusted a despatch box on this.',
    tags: ['policy', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { inGovernment: false, department: ['defence'], minTier: 3 },
    choices: [
      {
        label: 'Vote with the government',
        effects: { stats: { integrity: 3, competence: 2 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You judge it on the merits and back the action. Half your benches abstain in fury. History will decide whether the conviction was courage or a millstone.',
      },
      {
        label: 'Demand answers, then oppose',
        effects: { stats: { partyStanding: 4, profile: 2 } },
        outcomeText: 'You refuse to be rushed, list the unanswered questions, and lead your party through the No lobby. Cautious, popular with the membership, and a hostage to whatever happens next.',
      },
    ],
  },
  {
    id: 'shp_business_strikes',
    title: 'Whose side are you on?',
    body: 'A wave of strikes is biting and your {department} brief puts you in the middle. The unions fund you and expect solidarity; the public wants the trains to run. There is no answer that pleases both.',
    tags: ['policy', 'party', 'serious'],
    weight: 9, cooldownDays: 420,
    requires: { inGovernment: false, department: ['business', 'transport'], minTier: 3 },
    choices: [
      {
        label: 'Stand on the picket line',
        effects: { stats: { partyStanding: 5, profile: 2 }, pollingShock: { party: 'own', delta: -0.2 } },
        outcomeText: 'You join the workers in the cold and mean it. The membership is electrified; the government runs your picture beside the word "chaos" for a fortnight.',
      },
      {
        label: 'Call for both sides to talk',
        effects: { stats: { competence: 3, integrity: 2 }, relationships: [{ kind: 'ally', delta: -3 }] },
        outcomeText: 'You refuse to pick a side and demand negotiation. Statesmanlike to the commentators; "spineless" to the union barons whose cheques you will now have to chase.',
      },
    ],
  },
  // ---------- GENERIC OPPOSITION POSITIONING (no department) ----------
  {
    id: 'shp_opposition_day',
    title: 'The opposition day',
    body: 'You have been handed a rare opposition day debate — a whole afternoon of the Commons agenda is yours. Pick the wrong topic and it sinks; pick the right one and you set the week\'s narrative.',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 300,
    requires: { inGovernment: false, minTier: 3 },
    choices: [
      {
        label: 'A wedge motion to split their benches',
        effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You craft a motion their own rebels can\'t vote against, and the government\'s discipline cracks live on camera. Cynical, effective, deeply enjoyable.',
      },
      {
        label: 'A serious motion on a real failure',
        effects: { stats: { competence: 3, integrity: 3 } },
        outcomeText: 'You use the day to forensically expose a genuine scandal. No fireworks, but the select committee picks it up and it haunts a minister for months.',
      },
    ],
  },
  {
    id: 'shp_steal_or_oppose',
    title: 'They stole your idea',
    body: 'The government has just announced a popular policy — one you have been demanding for two years. Do you welcome the U-turn and claim the credit, or attack the detail to deny them the win?',
    tags: ['media', 'policy'],
    weight: 11, cooldownDays: 340,
    requires: { inGovernment: false, minTier: 3 },
    choices: [
      {
        label: 'Claim credit graciously',
        effects: { stats: { integrity: 3, profile: 2 } },
        outcomeText: '"Welcome, if a little late" — you smile, claim paternity, and look like the author of the agenda. The government hates that more than any attack.',
      },
      {
        label: 'Trash the small print',
        effects: { stats: { partyStanding: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You find the funding gap in the fine print and call it a con. The attack lands, but a few voters wonder why you\'re against the thing you used to be for.',
      },
    ],
  },
  {
    id: 'shp_dividing_line',
    title: 'The dividing line',
    body: 'Your strategists want one clean dividing line to run from now to the election — the single contrast that defines you against the {govparty}. The whole shadow team is arguing about what it should be.',
    tags: ['party', 'media', 'serious'],
    weight: 10, cooldownDays: 450,
    requires: { inGovernment: false, minTier: 3 },
    choices: [
      {
        label: 'Competence: "they broke it, we\'ll fix it"',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'Boring, durable, and quietly lethal. You hammer the same word — competence — until even the government\'s own backbenchers start using it about themselves.',
      },
      {
        label: 'Change: "time for something completely different"',
        effects: { stats: { profile: 4, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You bet everything on the mood for change. Exciting, and a hostage to fortune: if the public decides the devil they know is safer, the line cuts both ways.',
      },
    ],
  },

  // ========== OFFICIAL-OPPOSITION SCRUTINY (minorParty:false) ==========
  // Holding the government to account as the party of alternative government —
  // distinct from the third-party experience. minorParty:false keeps these off
  // the smaller parties' benches.
  {
    id: 'sho_urgent_question',
    title: 'The forensic urgent question',
    body: 'A government department has buried a damning report on a Friday afternoon. As shadow {department} you can demand an urgent question on Monday — and you have until then to build a case the minister cannot wriggle out of.',
    tags: ['westminster', 'media'],
    weight: 13, cooldownDays: 300,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Build the forensic case',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You walk in with three documents and a date the minister cannot deny. The exchange leads the bulletins and a junior minister spends the week explaining themselves.',
      },
      {
        label: 'Go for the emotional broadside',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You skip the forensics and channel the public anger. Less watertight, more shareable — the clip travels further than the facts would have.',
      },
    ],
  },
  {
    id: 'sho_select_committee',
    title: 'In the committee chair',
    body: 'You sit on a select committee scrutinising the government, and a powerful witness is before you who has dodged every other forum. The chair has given you ten minutes. Use them well and the clip runs all day.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 340,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Land the patient, lethal questions',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You build the trap question by question and spring it on the tenth minute. The witness\'s pause becomes the evening\'s most-replayed silence.',
      },
      {
        label: 'Go for the viral confrontation',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'journalist', delta: 2 }] },
        outcomeText: 'You skip the build-up and go straight for the jugular. It trends within the hour; the wonks tut that you let the witness off the substance.',
      },
    ],
  },
  {
    id: 'sho_foi_dig',
    title: 'The document they didn\'t want released',
    body: 'A Freedom of Information haul has landed on your desk — buried in it is proof a {department} programme is failing far worse than ministers admit. Release it now, or hold it for maximum damage?',
    tags: ['media', 'scandal'],
    weight: 12, cooldownDays: 360,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Drip-feed it for a week of headlines',
        effects: { stats: { profile: 3, competence: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You release a damaging document a day and keep the story alive for a week. The government bleeds; the lobby learns to wait for your morning email.',
      },
      {
        label: 'Hand it to a paper for a single big splash',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'journalist', delta: 4 }] },
        outcomeText: 'You give one outlet the lot for a front-page exclusive. A bigger bang, a grateful editor — and you have spent the ammunition in one shot.',
      },
    ],
  },
  {
    id: 'sho_public_inquiry',
    title: 'The demand for an inquiry',
    body: 'A scandal has engulfed the government and the families want answers. As the official Opposition you can demand a full public inquiry — a powerful weapon, but one that takes years and could one day report on your own time in office.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Demand a full statutory inquiry',
        effects: { stats: { integrity: 4, profile: 2 } },
        outcomeText: 'You stand with the families and force the issue onto the floor. The government stalls, but the demand is now a millstone it cannot shake off.',
      },
      {
        label: 'Press for faster, narrower answers',
        effects: { stats: { competence: 3, integrity: 2 } },
        outcomeText: 'You resist the years-long inquiry and demand action now instead. Less cathartic, more deliverable — and you avoid setting a precedent that might bite you later.',
      },
    ],
  },
  {
    id: 'sho_government_in_waiting',
    title: 'Look like a government',
    body: 'The polls have turned and people are starting to imagine you in office. Your team says it is time to look like a government-in-waiting: serious, costed, ready. The risk is that you become a target instead of a critic.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Publish serious, costed plans',
        effects: { stats: { competence: 4, integrity: 2 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You put real numbers on the table and look ready to govern. The government finally has something to shoot at — but the grown-up framing sticks.',
      },
      {
        label: 'Stay a small target a while longer',
        effects: { stats: { partyStanding: 3 } },
        outcomeText: 'You keep the powder dry and the government guessing. Disciplined, frustrating to the wonks, and exactly what a cautious lead demands.',
      },
    ],
  },
  {
    id: 'sho_minister_gaffe',
    title: 'The minister\'s gaffe',
    body: 'A cabinet minister has said something indefensible on camera. The clip is everywhere. As the official Opposition you can demand the sacking — or let the minister twist, a daily liability the government dare not move.',
    tags: ['media', 'westminster'],
    weight: 12, cooldownDays: 320,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Demand the sacking',
        effects: { stats: { profile: 3, partyStanding: 2 } },
        outcomeText: 'You call for the head and dominate the cycle. The PM, infuriatingly, obliges and removes the problem — handing you a win and taking away your target.',
      },
      {
        label: 'Keep them in post and bleeding',
        effects: { stats: { competence: 3, profile: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You "graciously" say it is for the PM to decide, knowing a wounded minister is worth more in post than out. Cynical, patient, effective.',
      },
    ],
  },
  {
    id: 'sho_opposition_motion',
    title: 'The binding opposition motion',
    body: 'You have an opposition day and a clever idea: a motion crafted so the government\'s own rebels cannot vote against it without humiliation. Pull it off and you split their benches on camera.',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 300,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Set the trap',
        effects: { stats: { competence: 3, profile: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'The motion does its work: a dozen government MPs abstain and the discipline cracks live in the chamber. Theatre, weaponised.',
      },
      {
        label: 'Use the day for a serious cause',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'You spend the rare slot on a genuine injustice rather than a trap. No fireworks, but the campaigners get their day and remember who gave it to them.',
      },
    ],
  },
  {
    id: 'sho_pmqs_prep',
    title: 'Six questions for the Leader',
    body: 'Your job this week is to prep the Leader of the Opposition\'s six questions at PMQs. Go for the killer blow on the crisis of the day, or build a patient, inescapable trap across all six?',
    tags: ['westminster', 'party'],
    weight: 11, cooldownDays: 320,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Build a six-question trap',
        effects: { stats: { competence: 4 }, relationships: [{ kind: 'leader', delta: 4 }] },
        outcomeText: 'You script a sequence that closes every escape route by question five. The Leader lands it, and your stock in the Leader\'s office quietly rises.',
      },
      {
        label: 'Go for the single knockout line',
        effects: { stats: { profile: 3 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'You write one devastating line and bet the session on it. It either defines the week or dies on contact — high risk, high clip-count.',
      },
    ],
  },
  {
    id: 'sho_forced_uturn',
    title: 'The U-turn you forced',
    body: 'A relentless campaign you led has pushed the government to the brink of a U-turn on a flagship policy. They will cave by the weekend. Do you claim the scalp loudly, or let them save face to lock the change in?',
    tags: ['media', 'policy'],
    weight: 11, cooldownDays: 360,
    requires: { inGovernment: false, minorParty: false, minTier: 3 },
    choices: [
      {
        label: 'Claim the scalp loudly',
        effects: { stats: { profile: 4, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You declare victory from the rooftops. The win is real and visible — though a cornered government, denied its face-saver, finds the change a little harder to make.',
      },
      {
        label: 'Let them save face to bank the win',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'You hold your fire and let the government dress up its retreat. The policy changes for good; you forgo the headline to make sure it sticks.',
      },
    ],
  },
];
