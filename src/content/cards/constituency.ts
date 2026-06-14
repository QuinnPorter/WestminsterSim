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
  {
    id: 'con_hospital_downgrade',
    title: 'The A&E downgrade',
    body: 'The health trust wants to "centralise" {constituency}\'s A&E — clinically sensible, politically radioactive. The consultants\' report is dense; the campaign to save it already has placards.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 12, cooldownDays: 500,
    choices: [
      {
        label: 'Lead the save-our-hospital fight',
        effects: { stats: { constituencyApproval: 6, profile: 2, competence: -2 } },
        outcomeText: 'You march at the front with the placards. The downgrade is paused. The clinicians quietly tell you the maths still doesn\'t work — a problem deferred to a future you.',
      },
      {
        label: 'Back the evidence, soften the blow',
        effects: { stats: { competence: 4, integrity: 3, constituencyApproval: -4 } },
        outcomeText: 'You accept the clinical case but win a guaranteed urgent-care centre and transport links. Honest, defensible, and on the placards next month under the word "BETRAYAL".',
      },
    ],
  },
  {
    id: 'con_local_scandal',
    title: 'The council in the headlines',
    body: 'Your own party\'s local council is mired in a procurement scandal — nothing to do with you, but the names rhyme with yours on the ballot. A reporter asks if you\'ll condemn them.',
    tags: ['constituency', 'media', 'party'],
    weight: 10, cooldownDays: 400,
    choices: [
      {
        label: 'Condemn it cleanly',
        effects: { stats: { integrity: 4, constituencyApproval: 2, partyStanding: -3 } },
        outcomeText: 'You say corruption is corruption whatever the rosette. Voters respect it; the council leader stops returning your calls and briefs against you to the local membership.',
      },
      {
        label: 'Call for "due process"',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'You hide behind the investigation and say nothing quotable. The party machine is grateful. The reporter writes "MP refuses to condemn" and is not wrong.',
      },
    ],
  },
  {
    id: 'con_developer_donation',
    title: 'The developer\'s cheque',
    body: 'A property developer with three live applications in {constituency} offers a generous donation to your local party. Entirely legal. Entirely declarable. Entirely the sort of thing that reads badly in 18-point type.',
    tags: ['constituency', 'scandal'],
    weight: 9, cooldownDays: 600,
    choices: [
      {
        label: 'Politely refuse it',
        effects: { stats: { integrity: 5, constituencyApproval: 1 } },
        outcomeText: 'You send it back with thanks. Your local treasurer is distraught; your future self, when the applications come up, is serene. Clean hands cost money.',
      },
      {
        label: 'Take it, declare it, recuse yourself',
        effects: { stats: { integrity: -2, constituencyApproval: -1 }, setFlags: { developerMoney: true } },
        outcomeText: 'You bank it, register it, and loudly recuse yourself from anything planning-related. Watertight — until someone decides the optics are the story.',
      },
    ],
  },
  {
    id: 'con_war_memorial',
    title: 'The war memorial',
    body: 'The {constituency} war memorial is crumbling and the restoration fund is short. The British Legion asks you to lend your name — and, ideally, a chunk of your office budget — to the appeal.',
    tags: ['constituency', 'serious'],
    weight: 9, cooldownDays: 450,
    choices: [
      {
        label: 'Throw yourself into the appeal',
        effects: { stats: { constituencyApproval: 5, integrity: 2 } },
        outcomeText: 'You raise the money, rededicate the memorial, and stand silent in the rain on Remembrance Sunday before a grateful crowd. Some duties are also privileges.',
      },
      {
        label: 'Send a donation and a letter',
        effects: { stats: { constituencyApproval: 1 } },
        outcomeText: 'A cheque and a warm note. The memorial gets fixed, slowly. Nobody remembers who paid for the third of the south wall.',
      },
    ],
  },
  {
    id: 'con_immigration_case',
    title: 'The deportation letter',
    body: 'A constituent family — settled, working, beloved at the local school — faces deportation on a Home Office technicality. The case is heartbreaking, the law is the law, and your own party is the one enforcing it.',
    tags: ['constituency', 'serious', 'policy'],
    weight: 10, cooldownDays: 500,
    choices: [
      {
        label: 'Fight it publicly, all the way',
        effects: { stats: { constituencyApproval: 4, integrity: 4, partyStanding: -3 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You take it to the floor, the press, and the minister\'s office. The family stays. Your government\'s immigration team adds you to the list of "unhelpful" colleagues.',
      },
      {
        label: 'Work it quietly through channels',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'No headlines, just a discreet, dogged caseworker grind and one well-placed letter. The family gets leave to remain. Few will know it was you. The family will never forget.',
      },
    ],
  },
  {
    id: 'con_rival_party_gain',
    title: 'The insurgents move in',
    body: 'A populist party has opened a flashy office on {constituency}\'s high street and is hoovering up your disaffected voters with simple answers to hard questions. Your activists are rattled.',
    tags: ['constituency', 'party'],
    weight: 10, cooldownDays: 400,
    choices: [
      {
        label: 'Out-organise them on the doorstep',
        effects: { stats: { constituencyApproval: 4, competence: 2, profile: -1 } },
        outcomeText: 'You go back to basics: more doors, more surgeries, more presence than a pop-up office can match. Unglamorous, relentless, effective. The insurgents\' novelty fades.',
      },
      {
        label: 'Co-opt their best argument',
        effects: { stats: { profile: 3, integrity: -3 } },
        outcomeText: 'You adopt a harder line on their signature issue. It takes the wind from their sails — and a little from your own principles. The high-street office is quieter by spring.',
      },
    ],
  },
  {
    id: 'con_flood_defence_funding',
    title: 'The flood defence bid',
    body: 'After last year\'s floods, {constituency} needs a defence scheme. The funding pot is national, competitive, and political. Winning it means lobbying your own government hard — and trading on whatever goodwill you have.',
    tags: ['constituency', 'policy'],
    weight: 9, cooldownDays: 450,
    choices: [
      {
        label: 'Spend your capital to win the bid',
        effects: { stats: { constituencyApproval: 6, partyStanding: -2 }, relationships: [{ kind: 'leader', delta: -1 }] },
        outcomeText: 'You call in every favour and the scheme is funded. The riverside is safe; your stock with the Treasury is spent. Worth every chip.',
      },
      {
        label: 'Make the technical case and hope',
        effects: { stats: { competence: 3, constituencyApproval: -2 } },
        outcomeText: 'You submit an immaculate bid on the merits and let it compete fairly. It comes a narrow second. The flood plain remains a flood plain.',
      },
    ],
  },
  {
    id: 'con_local_hero',
    title: 'The local hero',
    body: 'A {constituency} teenager has done something genuinely remarkable — a rescue, a record, a viral act of kindness. Everyone wants a photo with them, you included. There is a fine line between honouring and using.',
    tags: ['constituency', 'media', 'funny'],
    weight: 8, cooldownDays: 350,
    choices: [
      {
        label: 'Honour them properly in the House',
        effects: { stats: { constituencyApproval: 4, profile: 2 } },
        outcomeText: 'You read their name into Hansard and bring them to Parliament for the day. The photo is lovely and nobody could call it cynical. A genuinely nice moment in a cynical trade.',
      },
      {
        label: 'A quiet letter, no cameras',
        effects: { stats: { integrity: 3, constituencyApproval: 1 } },
        outcomeText: 'You write privately, no press release. The family is touched. The wider constituency never hears about it, which is, you decide, rather the point.',
      },
    ],
  },
  {
    id: 'con_surgery_threat',
    title: 'The threatening constituent',
    body: 'A constituent\'s emails have crossed from angry into frightening. Your caseworker is scared. The police say they\'ll "log it". An MP was murdered at a surgery not so long ago, and everyone in your office remembers.',
    tags: ['constituency', 'serious', 'personal'],
    weight: 8, cooldownDays: 600,
    choices: [
      {
        label: 'Tighten security, keep surgeries open',
        effects: { stats: { integrity: 4, constituencyApproval: 2, competence: -1 } },
        outcomeText: 'You will not be driven from your own constituents. New protocols, a panic button, and a defiant statement. The surgeries stay open. Your family worries; you go anyway.',
      },
      {
        label: 'Move to appointment-only, screened',
        effects: { stats: { competence: 3, constituencyApproval: -2 } },
        outcomeText: 'Sensible, safe, and a small democratic loss: the open door is now a booking form. Most understand. A few call you remote. The caseworker sleeps better.',
      },
    ],
  },
  {
    id: 'con_boundary_review',
    title: 'The boundary review',
    body: 'The Boundary Commission\'s draft would carve {constituency} in three, scattering your safest wards. You can make representations — fight for the lines that keep you safe, or accept the tidy map and the risk.',
    tags: ['constituency', 'party', 'serious'],
    weight: 9, cooldownDays: 700,
    choices: [
      {
        label: 'Fight for favourable lines',
        effects: { stats: { competence: 2, integrity: -2 } },
        outcomeText: 'You submit a forensic case for boundaries that — coincidentally — keep your best wards. Half of it sticks. Self-preservation dressed as community cohesion; an old parliamentary art.',
      },
      {
        label: 'Accept the independent map',
        effects: { stats: { integrity: 4, constituencyApproval: -1 } },
        outcomeText: 'You let the Commission do its job unlobbied. The new seat is harder for you — but you can say, truthfully, that you didn\'t gerrymander your own survival.',
      },
    ],
  },
  {
    id: 'con_asylum_hotel',
    title: 'The hotel',
    body: 'The Home Office has, without warning, block-booked a hotel in {constituency} to house asylum seekers. Half the town is furious, the other half is organising a welcome committee, and a small knot of agitators from outside is heading in with placards and cameras.',
    tags: ['constituency', 'crisis', 'serious'],
    weight: 11, cooldownDays: 560,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Channel the anger at Whitehall, not the people',
        effects: { stats: { integrity: 3, profile: 3, constituencyApproval: 2 } },
        outcomeText: 'You blast the Home Office for dumping the policy on the town with no consultation, while facing down the outside agitators. A narrow, principled path — and one that leaves nobody entirely happy, which is often the sign you got it right.',
      },
      {
        label: 'Ride the anger hard against the hotel',
        effects: { stats: { profile: 4, constituencyApproval: 3, integrity: -3 } },
        outcomeText: 'You put yourself at the front of the campaign to close it, and the local feeling carries you. The clips travel further than you would like; somewhere, a montage of the angriest moments is being saved with your face in it.',
      },
    ],
  },
  {
    id: 'con_crime_wave',
    title: 'The town feels unsafe',
    body: 'A spate of violence — county-lines drugs, a stabbing outside the school, shops shutting early out of fear — has {constituency} rattled. The police plead under-resourced, the papers demand action, and a packed public meeting wants to know what you are going to do.',
    tags: ['constituency', 'crisis', 'serious'],
    weight: 11, cooldownDays: 520,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Demand more police, loudly',
        effects: { stats: { profile: 4, constituencyApproval: 4, partyStanding: -1 } },
        outcomeText: 'You make noise — more officers, more patrols, a meeting with the Home Office. It reassures the public meeting and the front page, even if the deeper causes shrug it off. Visible is half the job.',
      },
      {
        label: 'Back youth services and the long fix',
        effects: { stats: { integrity: 3, competence: 2, constituencyApproval: -1 } },
        outcomeText: 'You make the harder, less satisfying case for prevention — youth clubs, schools, the things that stop the next stabbing rather than punish the last. Brave, unflashy, and a gift to any opponent who prefers "soft on crime".',
      },
    ],
  },
  {
    id: 'con_gp_crisis',
    title: 'Eight in the morning',
    body: 'Nobody in {constituency} can get a GP appointment. The surgery phone lines jam at 8am, two partners have quit, and your casework inbox is a wall of people who waited weeks to be told to call back tomorrow. A retired doctor offers to stand against you on the issue alone.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 540,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Make it a public, named campaign',
        effects: { stats: { profile: 4, constituencyApproval: 4, partyStanding: -1 } },
        outcomeText: 'You put names and faces to the figures, drag the integrated care board to a public meeting, and win extra appointments and a recruitment drive. Loud, local, and exactly the fight people remember you for.',
      },
      {
        label: 'Work the system quietly for more capacity',
        effects: { stats: { competence: 4, constituencyApproval: 2 } },
        outcomeText: 'You spend the political capital behind closed doors — a new partner recruited, a pharmacy scheme expanded, the phone system actually fixed. No headline, real appointments. The trade of an MP who would rather help than be seen helping.',
      },
    ],
  },
  {
    id: 'con_council_bankrupt',
    title: 'Section 114',
    body: 'The county council has effectively declared itself bankrupt — a Section 114 notice, all non-essential spending frozen. Libraries, buses, social care and bin collections are all suddenly in question, and the council and the government are busy blaming each other. The town wants you to blame someone too.',
    tags: ['constituency', 'crisis', 'policy'],
    weight: 10, cooldownDays: 600,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Demand a government bailout for the services',
        effects: { stats: { profile: 3, constituencyApproval: 4, partyStanding: -2 } },
        outcomeText: 'You lobby hard for emergency funding to keep the buses running and the care packages intact. It puts you at odds with the Treasury line — but the pensioner who keeps her day centre will not forget who fought for it.',
      },
      {
        label: 'Back a credible recovery plan over a blank cheque',
        effects: { stats: { competence: 4, integrity: 2, constituencyApproval: -2 } },
        outcomeText: 'You resist the easy promise of a bailout and back a hard-edged recovery plan instead — commissioners, cuts, and honesty about what the council can no longer do. Responsible, unpopular, and the version most likely to leave anything standing.',
      },
    ],
  },
];
