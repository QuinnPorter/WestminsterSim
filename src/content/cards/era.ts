import { DecisionCard } from '../../types/content';

/** Era-specific flavour: events that capture the texture of each starting
 *  parliament. Gated by `requires.era`, so a 2019 game never sees 2024's cards. */
export const ERA_CARDS: DecisionCard[] = [
  // ---------------- 2010: the coalition, the crash, austerity ----------------
  {
    id: 'era10_austerity',
    title: 'The age of austerity',
    body: 'With the deficit at the heart of every argument, a fresh round of spending cuts reaches services in your patch — a library, a bus route, a youth centre. Small lines in a spreadsheet, large in a town.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 540,
    requires: { era: ['2010'], partyIn: ['con', 'ld'], arrangementIn: ['coalition'], firstParliament: true },
    choices: [
      {
        label: 'Defend deficit reduction',
        effects: { stats: { partyStanding: 3, constituencyApproval: -4 } },
        outcomeText: 'You make the case that there is no money left and hard choices cannot wait. The Treasury notes a reliable voice; the town notes a shuttered centre.',
      },
      {
        label: 'Fight to save the service',
        effects: { stats: { constituencyApproval: 5, partyStanding: -3 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'You lead the campaign and win a reprieve. Your constituents are grateful; the whips file you under "wobbly on the deficit".',
      },
    ],
  },
  {
    id: 'era10_tuition_fees',
    title: 'The tuition fees vote',
    body: 'The government moves to treble university tuition fees, and students are marching outside. For the Liberal Democrats it cuts deepest of all — a signed pledge now on a collision course with coalition discipline.',
    tags: ['party', 'serious'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { era: ['2010'], partyIn: ['con', 'ld'], arrangementIn: ['coalition'], firstParliament: true, maxTier: 4 },
    choices: [
      {
        label: 'Vote with the government',
        effects: { stats: { partyStanding: 4, constituencyApproval: -3 }, relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'You troop through the government lobby and take the placards on the chin. Loyalty banked — and, for some, a promise visibly broken.',
      },
      {
        label: 'Break ranks and vote against',
        effects: { stats: { profile: 4, integrity: 3, partyStanding: -4 }, relationships: [{ kind: 'chiefWhip', delta: -6 }], trigger: 'rebel' },
        outcomeText: 'You keep faith with the pledge and defy the whip. The campuses cheer; the leadership reddens; the rebellion is logged.',
      },
    ],
  },
  {
    id: 'era10_coalition_strains',
    title: 'The rose garden fades',
    body: 'The early warmth of the coalition is wearing thin. Backbenchers on both sides grumble that their party is being swallowed by the other, and the press is hunting for the seam where the partnership splits.',
    tags: ['party', 'westminster'],
    weight: 12, cooldownDays: 600,
    requires: { era: ['2010'], partyIn: ['con', 'ld'], arrangementIn: ['coalition'], firstParliament: true, maxTier: 4 },
    choices: [
      {
        label: 'Champion the coalition',
        effects: { stats: { partyStanding: 3, competence: 1, profile: -1 } },
        outcomeText: 'You defend the partnership as grown-up government in the national interest. Steady, unflashy, and quietly appreciated by the leadership.',
      },
      {
        label: 'Differentiate your party loudly',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'leader', delta: -3 }, { kind: 'chiefWhip', delta: -2 }], setFlags: { era_coalition_differentiator: true } },
        outcomeText: 'You stake out your own party\'s distinct ground in public. The base loves the clarity; the leadership wishes you had cleared it first.',
      },
    ],
  },

  // ---------------- 2015: Cameron majority, referendum looming ----------------
  {
    id: 'era15_referendum',
    title: 'Which way on the referendum?',
    body: 'The in–out referendum is coming, and colleagues are already counting heads. The whips want to know where you stand — and so, quietly, do the papers.',
    tags: ['party', 'serious'],
    weight: 14, cooldownDays: 9999, oncePerCareer: true,
    requires: { era: ['2015'], maxTier: 4 },
    choices: [
      {
        label: 'Campaign to Remain',
        effects: { stats: { profile: 4 }, setFlags: { era_ref_side: 1 } },
        outcomeText: 'You pin your colours to Remain. Half the activists cheer; the other half make a note. Either way, you are now on a side, and sides are remembered.',
      },
      {
        label: 'Campaign to Leave',
        effects: { stats: { profile: 5, partyStanding: -2 }, setFlags: { era_ref_side: 2 } },
        outcomeText: 'You come out for Leave. The grassroots love you; the leadership marks your card. A bet on the future, placed in public.',
      },
      {
        label: 'Keep your head down',
        effects: { stats: { integrity: -2 } },
        outcomeText: 'You discover urgent constituency business and say nothing quotable. Safe, for now — but a referendum is a poor place to have had no opinion.',
      },
    ],
  },
  {
    id: 'era15_austerity',
    title: 'The cuts come home',
    body: 'Another round of departmental savings lands on services in your patch. A library, a bus route, a Sure Start centre — small lines in a spreadsheet, large in a town.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 540,
    requires: { era: ['2015'] },
    choices: [
      {
        label: 'Defend the cuts as necessary',
        effects: { stats: { partyStanding: 3, constituencyApproval: -4 } },
        outcomeText: 'You make the difficult-decisions speech. The Treasury notices a reliable voice; the town notices a closed library.',
      },
      {
        label: 'Fight to save the service',
        effects: { stats: { constituencyApproval: 5, partyStanding: -3 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'You lead the campaign and win a stay of execution. Your constituents are grateful; the whips file you under "wobbly".',
      },
    ],
  },

  // ---------------- 2017: hung parliament, the DUP deal, Brexit talks ----------------
  {
    id: 'era17_dup',
    title: 'Confidence and supply',
    body: 'The numbers do not add up without ten DUP votes, bought with a billion-pound package for Northern Ireland. Your inbox fills with constituents asking where their billion is.',
    tags: ['westminster', 'party'],
    weight: 13, cooldownDays: 9999, oncePerCareer: true,
    requires: { era: ['2017'], maxTier: 4 },
    choices: [
      {
        label: 'Defend the arrangement',
        effects: { stats: { partyStanding: 3, profile: 2 } },
        outcomeText: 'You call it pragmatic government in the national interest. It holds the line, even if no one writes it on a banner.',
      },
      {
        label: 'Grumble on the record',
        effects: { stats: { profile: 3, partyStanding: -3 }, relationships: [{ kind: 'leader', delta: -4 }] },
        outcomeText: 'You tell a journalist what everyone thinks. It makes the splash; the leader\'s office makes a note.',
      },
    ],
  },
  {
    id: 'era17_meaningful_vote',
    title: 'The meaningful vote',
    body: 'A Brexit deal returns to the Commons for the third time, and the maths is on a knife-edge. The whips are working the corridors; the rebels are counting too.',
    tags: ['party', 'serious'],
    weight: 13, cooldownDays: 420,
    requires: { era: ['2017'], maxTier: 4 },
    choices: [
      {
        label: 'Back the deal — get it done',
        effects: { stats: { partyStanding: 4, competence: 1 }, relationships: [{ kind: 'chiefWhip', delta: 5 }] },
        outcomeText: 'You troop through the government lobby. Loyalty banked, whatever the deal\'s merits — and there will be a reckoning either way.',
      },
      {
        label: 'Hold out for something better',
        effects: { stats: { profile: 4, integrity: 2 }, relationships: [{ kind: 'chiefWhip', delta: -6 }], trigger: 'rebel' },
        outcomeText: 'You vote against, and the deal dies again. The purists hail you; the whips redden; the country waits.',
      },
    ],
  },

  // ---------------- 2019: Johnson majority, then the pandemic ----------------
  {
    id: 'era19_getbrexitdone',
    title: 'The eighty-seat majority',
    body: 'A thumping win has reshaped the benches. Red-wall seats that never voted your way are suddenly yours to keep — or lose. The new intake is hungry and watching.',
    tags: ['party', 'westminster'],
    weight: 12, cooldownDays: 720,
    requires: { era: ['2019'], maxTier: 4 },
    choices: [
      {
        label: 'Champion the new northern seats',
        effects: { stats: { profile: 4, constituencyApproval: 2 } },
        outcomeText: 'You become a voice for levelling-up. It plays well on the doorsteps and in the tearoom — promises now banked, to be cashed later.',
      },
      {
        label: 'Warn against complacency',
        effects: { stats: { competence: 3, partyStanding: -1 } },
        outcomeText: 'You counsel that landslides recede. Wise, unwelcome, and quietly logged by those who prefer the cheering.',
      },
    ],
  },
  {
    id: 'era19_pandemic',
    title: 'A virus changes everything',
    body: 'A novel virus is spreading, and the country is sliding toward lockdown. Hospitals brace, schools close, and every certainty of the political week dissolves overnight.',
    tags: ['crisis', 'serious'],
    weight: 16, cooldownDays: 9999, oncePerCareer: true,
    requires: { era: ['2019'] },
    choices: [
      {
        label: 'Throw yourself into the local response',
        effects: { stats: { constituencyApproval: 6, competence: 2, profile: 2 } },
        outcomeText: 'You spend the spring on food parcels, shielding lists and Zoom surgeries. Exhausting, unglamorous, and the truest work you have done.',
      },
      {
        label: 'Push the national argument',
        effects: { stats: { profile: 5, partyStanding: -2 } },
        outcomeText: 'You become a fixture on the broadcast round, pressing for faster, harder action. A bigger name, and a few enemies in high places.',
      },
      {
        label: 'Quietly question the rules',
        effects: { stats: { profile: 3, integrity: -2 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'You voice doubts about the restrictions. A constituency of the sceptical finds you; so does a less flattering kind of attention.',
      },
    ],
  },

  // ---------------- 2024: Labour majority, the inheritance ----------------
  {
    id: 'era24_blackhole',
    title: 'The fiscal inheritance',
    body: 'The books are opened and the numbers are worse than anyone admitted in the campaign. Every promise now collides with a hole the Treasury says must be filled.',
    tags: ['policy', 'serious'],
    weight: 14, cooldownDays: 9999, oncePerCareer: true,
    requires: { era: ['2024'], maxTier: 4 },
    choices: [
      {
        label: 'Back tough choices early',
        effects: { stats: { competence: 3, partyStanding: 2, constituencyApproval: -3 } },
        outcomeText: 'You argue for honesty now over pain later. The grown-ups nod; the doorstep is less forgiving.',
      },
      {
        label: 'Protect your people from the axe',
        effects: { stats: { constituencyApproval: 4, partyStanding: -3 } },
        outcomeText: 'You fight to spare a cherished commitment. Locally heroic, centrally inconvenient — and the hole is still there.',
      },
    ],
  },
  {
    id: 'era24_reform',
    title: 'The challenge from the right',
    body: 'A populist insurgency is eating into seats that used to be safe, peeling off voters with a simpler story. The pollsters are nervous; so is your local association.',
    tags: ['party', 'media'],
    weight: 12, cooldownDays: 540,
    requires: { era: ['2024'], maxTier: 4 },
    choices: [
      {
        label: 'Meet them head-on in the argument',
        effects: { stats: { profile: 4, competence: 1 } },
        outcomeText: 'You take the fight to them on the airwaves rather than ceding the ground. Bruising, but the base steadies.',
      },
      {
        label: 'Tack toward their voters',
        effects: { stats: { constituencyApproval: 3, integrity: -2 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You adjust your tone to win them back. Some return; colleagues mutter that you are chasing the tail you should be facing.',
      },
    ],
  },
];
