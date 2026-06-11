import { DecisionCard } from '../../types/content';

/** Constituency life — any tier, any side. */
export const CONSTITUENCY_CARDS: DecisionCard[] = [
  {
    id: 'con_bypass',
    title: 'The bypass saga',
    body: 'The {constituency} bypass has been "coming soon" since before you were born. A new feasibility study lands on your desk: build it and anger the valley campaigners, or kill it and anger everyone stuck on the A-road.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 600,
    choices: [
      {
        label: 'Champion the bypass',
        effects: { stats: { constituencyApproval: 4, profile: 1 } },
        outcomeText: 'You front the campaign with a hard hat and a hopeful face. Commuters cheer; the valley society puts your photo on a dartboard. On balance, the maths works.',
      },
      {
        label: 'Side with the campaigners',
        effects: { stats: { constituencyApproval: -1, integrity: 3 } },
        outcomeText: 'You stand in the rain with the protest group and a thermos. The A-road remains terrible, but the valley is saved, and so — say the campaigners — is your soul.',
      },
      {
        label: 'Call for "further consultation"',
        effects: { stats: { integrity: -2 } },
        outcomeText: 'A masterclass in saying nothing for forty minutes. The issue is successfully postponed until it becomes someone else\'s problem, possibly yours again.',
      },
    ],
  },
  {
    id: 'con_surgery_hard_case',
    title: 'Friday surgery',
    body: 'Last appointment of the day: a constituent whose disability assessment has gone catastrophically wrong. The system says no. The file says no. The person in front of you is crying.',
    tags: ['constituency', 'serious'],
    weight: 14, cooldownDays: 300,
    choices: [
      {
        label: 'Take the case on personally',
        effects: { stats: { constituencyApproval: 5, competence: 1 } },
        outcomeText: 'Three letters, two phone calls and one quietly furious email to the right official. The decision is overturned in a month. This is the job — the real one.',
      },
      {
        label: 'Refer them to the caseworker',
        effects: { stats: { constituencyApproval: 1 } },
        outcomeText: 'Your caseworker is excellent, and the system grinds towards a fix eventually. You move on to the seventeen other files. It is triage, and you tell yourself that is fine.',
      },
    ],
  },
  {
    id: 'con_factory_closure',
    title: 'The factory',
    body: 'The biggest employer in {constituency} announces 400 redundancies. The news crews are outside the gates. The workers want fury; the company wants "a constructive partner"; the truth is you have almost no levers.',
    tags: ['constituency', 'media', 'serious'],
    weight: 11, cooldownDays: 700,
    choices: [
      {
        label: 'Fight loudly — demand a taskforce',
        effects: { stats: { constituencyApproval: 5, profile: 4 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You thunder on the news and drag two ministers to the site. The taskforce saves maybe sixty jobs and your standing at home. Some in the party wince at the volume.',
      },
      {
        label: 'Work the phones quietly',
        effects: { stats: { constituencyApproval: 2, competence: 3 } },
        outcomeText: 'No cameras, but a redeployment deal with a firm two towns over takes 150 of the workers. Less poetry, more jobs. Few will ever know it was you.',
      },
    ],
  },
  {
    id: 'con_flooding',
    title: 'The waters rise',
    body: 'A month\'s rain falls on {constituency} in a weekend. Two streets are underwater and a furious town hall meeting is called for Monday. You have wellies and a choice.',
    tags: ['constituency', 'crisis'],
    weight: 10, cooldownDays: 500,
    choices: [
      {
        label: 'Wade in — literally',
        effects: { stats: { constituencyApproval: 6, profile: 2 } },
        outcomeText: 'Three days of sandbags, soup runs, and shouting at the Environment Agency. The photo of you carrying someone\'s cat to safety does more than any leaflet ever could.',
      },
      {
        label: 'Coordinate from Westminster',
        effects: { stats: { constituencyApproval: -3, competence: 2 } },
        outcomeText: 'You secure the emergency funding faster than any wellies could have. Unfortunately the local paper\'s front page is your empty chair at the town hall, captioned "WHERE WERE YOU?"',
      },
    ],
  },
  {
    id: 'con_fete_judging',
    title: 'The vegetable of judgement',
    body: 'You have unwisely agreed to judge the {constituency} Giant Vegetable Competition. The chair of the association and the deputy mayor have both entered marrows. They are not on speaking terms.',
    tags: ['constituency', 'funny'],
    weight: 9, cooldownDays: 450,
    choices: [
      {
        label: 'Judge with ruthless honesty',
        effects: { stats: { integrity: 2, constituencyApproval: 2 } },
        outcomeText: 'You award first prize to a nine-year-old\'s pumpkin, wrong-footing both marrow factions entirely. Widely praised as the bravest decision of your career to date.',
      },
      {
        label: 'Declare a diplomatic tie',
        effects: { stats: { constituencyApproval: 1, integrity: -1 } },
        outcomeText: 'Two first prizes are awarded. Both recipients are quietly livid, which suggests it was the right call. The nine-year-old gets a special commendation and cries with joy.',
      },
    ],
  },
  {
    id: 'con_planning_row',
    title: 'Two hundred houses',
    body: 'A developer wants to build 200 homes on the meadow behind the cricket club. Young families need the houses; the cricket club needs the meadow; everybody needs you to have an opinion by Thursday.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 550,
    choices: [
      {
        label: 'Back the housing',
        effects: { stats: { constituencyApproval: -2, integrity: 3, profile: 1 } },
        outcomeText: 'You make the case for the families on the waiting list. The cricket club\'s newsletter is scathing, but several quiet thank-yous arrive from people who could never afford to live where they grew up.',
      },
      {
        label: 'Defend the meadow',
        effects: { stats: { constituencyApproval: 4 } },
        outcomeText: 'You invoke heritage, hedgehogs and the under-12s county final. The application is withdrawn. The waiting list grows by another year, somewhere out of sight.',
      },
    ],
  },
  {
    id: 'con_local_paper_dying',
    title: 'Stop the press',
    body: 'The {constituency} Gazette — est. 1873, your most reliable critic — is about to fold. The editor asks if you\'d front a campaign to save it. It has called you "underwhelming" in print eleven times.',
    tags: ['constituency', 'media', 'funny'],
    weight: 8, cooldownDays: 600,
    choices: [
      {
        label: 'Save your tormentor',
        effects: { stats: { constituencyApproval: 3, integrity: 3, profile: 1 } },
        outcomeText: 'The campaign works; a community trust takes it over. The first edition under new ownership runs a grateful editorial — and, two pages later, calls your roads policy "underwhelming". Perfect.',
      },
      {
        label: 'Let the market decide',
        effects: { stats: { constituencyApproval: -2 } },
        outcomeText: 'The Gazette folds after 151 years. You are featured prominently, and unflatteringly, in the final edition. People keep the commemorative issue for years.',
      },
    ],
  },
  {
    id: 'con_school_visit',
    title: 'Year Six asks the questions',
    body: 'A primary school visit. The head teacher warns you the children have "prepared questions". The first one is about your voting record. The second is about whether you have ever lied.',
    tags: ['constituency', 'funny', 'personal'],
    weight: 10, cooldownDays: 350,
    choices: [
      {
        label: 'Answer everything honestly',
        effects: { stats: { integrity: 3, constituencyApproval: 2 } },
        outcomeText: 'You give straight answers, including one "yes, once, and I regretted it" that makes the head teacher\'s eyebrows vanish into their hairline. The kids vote you "better than expected".',
      },
      {
        label: 'Deploy maximum charm',
        effects: { stats: { profile: 1, constituencyApproval: 1 } },
        outcomeText: 'You pivot every question to dinosaurs and football with the agility of a seasoned media performer. The children are delighted. One particularly unimpressed ten-year-old will probably be your opponent in 2045.',
      },
    ],
  },
  {
    id: 'con_high_street',
    title: 'The empty high street',
    body: 'Another bank branch closes in {constituency}, the third this year. The high street is becoming a row of charity shops and vape stores. A local business group wants action; the levers, as ever, are mostly elsewhere.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 450,
    choices: [
      {
        label: 'Launch a high street taskforce',
        effects: { stats: { constituencyApproval: 3, profile: 1 } },
        outcomeText: 'Grants are found, a banking hub is promised, two units get new tenants. It is patching a dam with plasters, but the plasters are visible and locally appreciated.',
      },
      {
        label: 'Tell the hard truth about retail',
        effects: { stats: { integrity: 3, constituencyApproval: -2 } },
        outcomeText: 'You say what everyone knows: the 1990s high street is not coming back, and the town needs a different future. Honest, bracing, and clipped out of context within the hour.',
      },
    ],
  },
  {
    id: 'con_twin_town',
    title: 'Twinned with trouble',
    body: 'The mayor of your twin town abroad is visiting, and has — mid-toast, glass raised — said something undiplomatic about the British government. The room turns to you.',
    tags: ['constituency', 'funny'],
    weight: 7, cooldownDays: 500,
    choices: [
      {
        label: 'Defuse it with a joke',
        effects: { stats: { profile: 2, constituencyApproval: 2 } },
        outcomeText: 'Your toast in reply — "to the frankness of old friends" — gets a laugh, a headline, and an invitation to visit next spring. Disaster converted to anecdote at the despatch box of life.',
      },
      {
        label: 'Issue a stiff correction',
        effects: { stats: { partyStanding: 2, constituencyApproval: -1 } },
        outcomeText: 'You defend the government with a straight bat. Correct, loyal, and the civic dinner has all the warmth of a fire drill thereafter.',
      },
    ],
  },
];
