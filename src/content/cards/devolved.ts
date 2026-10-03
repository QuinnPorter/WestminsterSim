import { DecisionCard } from '../../types/content';

/** Devolved life — the SHARED deck for Holyrood and the Senedd. Every card
 *  fires in both chambers, so every line is written in tokens: {house},
 *  {hill}, {member}, {headoffice}, {government}, {nation}, {speaker}. Never a
 *  literal "Scotland" or "Senedd" here; the nation decks have those. The
 *  permanent argument with {othergov} runs through the whole thing. */
export const DEVOLVED_CARDS: DecisionCard[] = [
  // ── backbench / constituency (any tier) ────────────────────────────────
  {
    id: 'dv_hospital_waiting',
    title: 'Four hours, allegedly',
    body: 'The A&E serving {constituency} has posted its worst waiting figures in a decade, and the local paper has a photograph of a pensioner on a trolley in a corridor. Health is devolved, which means there is nobody up the road to blame but {government}.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 13, cooldownDays: 300,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Go to the hospital and stand with the staff',
        effects: { stats: { constituencyApproval: 4, profile: 2, partyStanding: -1 } },
        outcomeText: 'You shadow the night team for a shift and come out with a list of fixes that are not about money and a longer one that is. The nurses are pleased someone turned up; the health minister\'s office is less so when your list reaches {journalist}.',
      },
      {
        label: 'Defend the figures with context',
        effects: { stats: { partyStanding: 3, competence: 1, constituencyApproval: -3 } },
        outcomeText: 'You point out, accurately, that the hospital is treating more people than ever and that winter is winter. Accurate is not the same as welcome, and the pensioner\'s daughter is quoted calling you "a spreadsheet in a suit".',
      },
      {
        label: 'Write privately to the health minister',
        effects: { stats: { competence: 2, integrity: 2, profile: -1 } },
        outcomeText: 'A detailed letter, no press release. A recovery plan appears three weeks later with your fingerprints nowhere on it, which is how you know it was you.',
      },
    ],
  },
  {
    id: 'dv_council_freeze',
    title: 'The freeze',
    body: '{government} has frozen council tax again, and the council covering {constituency} says the compensation does not cover the gap. Leisure centres, libraries and the bin schedule are on the list; so, pointedly, is a letter from the council leader to every {member} in the area.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Back the freeze',
        effects: { stats: { partyStanding: 3, constituencyApproval: 1, integrity: -2 } },
        outcomeText: 'You defend the freeze as a lifeline for hard-pressed households, which is true as far as it goes. The library closes in March, and the hard-pressed households notice.',
      },
      {
        label: 'Side with the council',
        effects: { stats: { constituencyApproval: 3, integrity: 2, partyStanding: -3 } },
        outcomeText: 'You say out loud that a freeze without the money is a cut by another name. The council leader sends flowers; {whip} sends a text with no punctuation.',
      },
      {
        label: 'Broker a one-off local deal',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'You stitch together a settlement that saves the pool and nothing else. Partial, unglamorous, and the swimming club names a lane after you.',
      },
    ],
  },
  {
    id: 'dv_rural_bus',
    title: 'The last bus',
    body: 'The operator is withdrawing the only bus that links the villages of {constituency} to the town, citing passenger numbers that would embarrass a minibus. The subsidy is the council\'s, the franchising powers are {government}\'s, and the people at the stop are yours.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Fight for the subsidy',
        effects: { stats: { constituencyApproval: 4, competence: 1, partyStanding: -1 } },
        outcomeText: 'You get the operator, the council and a transport official into a village hall and refuse to let anyone leave. The route survives on a thinner timetable, and the WI gives you a round of applause and a scone.',
      },
      {
        label: 'Set up a community bus',
        effects: { stats: { competence: 2, integrity: 2, constituencyApproval: 1 } },
        outcomeText: 'You help a volunteer group launch a dial-a-ride with a second-hand minibus and a grant form the length of a novel. It works, slowly, and it runs on Tuesdays.',
      },
      {
        label: 'Accept the commercial logic',
        effects: { stats: { partyStanding: 2, integrity: -2, constituencyApproval: -3 } },
        outcomeText: 'You explain that an empty bus helps nobody, which is true, and stop talking just before you say "car ownership". The villages remember.',
      },
    ],
  },
  {
    id: 'dv_blame_game',
    title: 'Whose fault is it this time',
    body: 'A crisis has landed in {constituency} exactly on the seam between reserved and devolved: {othergov} controls the money, {government} controls the service, and both have issued statements blaming the other within the hour. Your inbox would like to know what you are going to do.',
    tags: ['constituency', 'media', 'policy'],
    weight: 12, cooldownDays: 320,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Blame {otherleader}\'s government',
        effects: { stats: { partyStanding: 3, profile: 2, integrity: -2 } },
        outcomeText: 'You put out a clip naming the Treasury and {otherleader} and it does numbers. It is about half the truth, which in this trade is a respectable fraction.',
      },
      {
        label: 'Say both governments have failed',
        effects: { stats: { integrity: 3, competence: 1, partyStanding: -2 } },
        outcomeText: 'You tell the local paper that two governments pointing at each other is not a plan. Honest and quotable, and neither set of whips sends you anything but a frown.',
      },
      {
        label: 'Fix the one thing you can',
        effects: { stats: { competence: 3, constituencyApproval: 3, profile: -1 } },
        outcomeText: 'You ignore the constitutional theatre and find the official who can actually sign the form. The service limps back; the row carries on without you.',
      },
    ],
  },
  {
    id: 'dv_committee_evidence',
    title: 'Evidence session',
    body: 'Your committee has a senior official in the chair opposite and a stack of written evidence saying their flagship programme is behind schedule and over budget. The committee chair wants a forensic morning; the whips, since the programme is {government}\'s, would prefer a gentle one.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 11, cooldownDays: 300,
    requires: { arena: ['scotland', 'wales'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Go forensic',
        effects: { stats: { competence: 4, profile: 2, partyStanding: -2 } },
        outcomeText: 'You take the official through the timeline line by line until the room is uncomfortable and the record is useful. The committee report quotes you; {whip}\'s office notes that you were "very thorough".',
      },
      {
        label: 'Lob a friendly one',
        effects: { stats: { partyStanding: 3, integrity: -3 } },
        outcomeText: 'You ask whether the official would agree the programme is, on balance, ambitious. They would. The clerk\'s pen stops moving.',
      },
      {
        label: 'Ask the single question that matters',
        effects: { stats: { competence: 3, integrity: 2, profile: 1 } },
        outcomeText: 'One question, no preamble, about the date the delay was first flagged. The answer takes twenty seconds and makes the next morning\'s front page.',
      },
    ],
  },
  {
    id: 'dv_members_bill',
    title: 'A bill of your own',
    body: 'Your members\' bill — a modest, worthy thing about a devolved matter nobody else has bothered with — has cross-party sponsors and a committee slot. {government} has not said it opposes it, which means it has not yet decided whether to kill it.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['scotland', 'wales'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Push it through on cross-party support',
        effects: { stats: { profile: 3, competence: 2, partyStanding: -1 } },
        outcomeText: 'You assemble a coalition of the mildly interested across four parties and the bill passes stage one on a Wednesday afternoon. It is the proudest you have been in {house} and almost nobody noticed.',
      },
      {
        label: 'Hand it to the government',
        effects: { stats: { partyStanding: 3, integrity: -1 }, relationships: [{ kind: 'chiefWhip', delta: 2 }] },
        outcomeText: 'You let a minister adopt the bill as their own and watch it become law under someone else\'s name. Effective, forgettable, and {whip} remembers the gift.',
      },
      {
        label: 'Narrow it to what will pass',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You strip the bill back to the two clauses nobody can object to and lose the one you cared about. It passes unanimously, and you have learned how this place works.',
      },
    ],
  },
  {
    id: 'dv_wind_farm',
    title: 'The turbines',
    body: 'A developer wants eleven turbines on the ridge above {constituency}. The community council is split, the walking club is apoplectic, the farmers who own the ridge are quietly delighted, and the planning decision has been called in by {government}.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Back the wind farm',
        effects: { stats: { competence: 2, profile: 2, constituencyApproval: -2 } },
        outcomeText: 'You say the obvious thing about the climate and the community benefit fund, and mean it. The walking club writes to {journalist}, who has never walked anywhere, and the farmers buy you a drink.',
      },
      {
        label: 'Oppose it on landscape grounds',
        effects: { stats: { constituencyApproval: 3, integrity: -1, partyStanding: -2 } },
        outcomeText: 'You stand on the ridge with the walkers and a photographer and talk about heritage. It plays beautifully locally and {party}\'s climate spokesperson stops returning your calls.',
      },
      {
        label: 'Hold out for a better community deal',
        effects: { stats: { competence: 3, constituencyApproval: 2 } },
        outcomeText: 'You refuse to take a side until the developer doubles the community fund, which, grumbling, it does. Half the village is still furious, but the hall gets a new roof.',
      },
    ],
  },
  {
    id: 'dv_surgery_devolved_benefit',
    title: 'The form that nobody owns',
    body: 'Friday surgery. A constituent has been refused a devolved disability payment on the strength of an assessment done for the UK benefit it replaced, and the two agencies are each certain the other holds the file. She has a bus home at six.',
    tags: ['constituency', 'serious'],
    weight: 13, cooldownDays: 280,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Take it on yourself',
        effects: { stats: { constituencyApproval: 4, competence: 1, profile: -1 } },
        outcomeText: 'Two agencies, four phone calls, one email in which you use the word "unacceptable" three times. The payment is reinstated in a fortnight and backdated, and she sends a card you keep.',
      },
      {
        label: 'Raise her case in {house}',
        effects: { stats: { profile: 3, constituencyApproval: 2, partyStanding: -2 } },
        outcomeText: 'You name her, with permission, and the minister is visibly mortified at the podium. It is fixed within days; the whips wonder aloud why you did not just write.',
      },
      {
        label: 'Refer it to the caseworker',
        effects: { stats: { constituencyApproval: 1, competence: 1 } },
        outcomeText: 'Your caseworker knows the agency\'s back office better than its own staff and sorts it in six weeks. Six weeks is a long time when you have no money, and she does not send a card.',
      },
    ],
  },
  {
    id: 'dv_byelection_next_door',
    title: 'Next door',
    body: 'The {member} for the seat beside {constituency} has resigned in circumstances everybody describes as personal and nobody believes. There is a by-election in six weeks, and {party} has asked you to run the ground campaign because you know the patch.',
    tags: ['campaign', 'party'],
    weight: 10, cooldownDays: 480,
    requires: { arena: ['scotland', 'wales'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Throw yourself in',
        effects: { stats: { partyStanding: 4, constituencyApproval: -2 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'You spend six weekends knocking doors in someone else\'s seat and your own casework pile grows a tide mark. The candidate wins, or nearly does, and either way {leader} knows who ran it.',
      },
      {
        label: 'Do the minimum',
        effects: { stats: { constituencyApproval: 2, partyStanding: -2 } },
        outcomeText: 'You turn up for the launch and the count and otherwise look after your own patch. Your constituents are pleased to see you; the campaign director is not.',
      },
      {
        label: 'Lend your best organiser, keep your weekends',
        effects: { stats: { competence: 2, partyStanding: 1 } },
        outcomeText: 'You send your organiser over and keep your own surgeries running. A compromise so sensible it earns you no credit from anyone, which is often the mark of a good one.',
      },
    ],
  },
  {
    id: 'dv_gp_out_of_hours',
    title: 'Closed between six and eight',
    body: 'The out-of-hours GP service covering {constituency} is closing on weeknights because it cannot find doctors to staff it. The health board blames recruitment; the doctors blame the contract; the nearest alternative is forty minutes away and shuts at midnight.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Lead a public campaign',
        effects: { stats: { constituencyApproval: 4, profile: 2, partyStanding: -1 } },
        outcomeText: 'You pack the community centre and march a petition to the health board\'s front door. They find a locum rota that was apparently impossible on Monday.',
      },
      {
        label: 'Work the health board privately',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'You get the board to pilot a nurse-led service two nights a week. Less than the campaigners wanted; more than they would have got from a march.',
      },
      {
        label: 'Point to the national picture',
        effects: { stats: { partyStanding: 2, competence: 1, constituencyApproval: -3 } },
        outcomeText: 'You explain that this is a workforce problem across {nation} and nobody is to blame locally, which is true and lands like a wet towel.',
      },
    ],
  },
  {
    id: 'dv_local_paper_closing',
    title: 'Stop press',
    body: 'The weekly paper that has covered {constituency} since the railway came is closing; the title has been sold to a group that will run it from a city two hours away with no reporter. {journalist} rings for a reaction, which is ironic in a way neither of you mentions.',
    tags: ['constituency', 'media'],
    speaker: 'journalist',
    weight: 9, cooldownDays: 480,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Campaign to save it',
        effects: { stats: { constituencyApproval: 3, profile: 2, competence: -1 } },
        outcomeText: 'You front a buy-out campaign that raises a quarter of the money and a great deal of nostalgia. The title survives online with one reporter, who is now terrifyingly well informed about you.',
      },
      {
        label: 'Mourn it and move on',
        effects: { stats: { integrity: 1, constituencyApproval: -1 } },
        outcomeText: 'You issue a kind statement and let the market take its course. There is now nobody at council meetings but the councillors, and they have noticed.',
      },
      {
        label: 'Back a community news start-up',
        effects: { stats: { competence: 3, constituencyApproval: 2 } },
        outcomeText: 'You help a group of retired hacks win a grant for a community news site. It is run from a kitchen, it is excellent, and it is less kind to you than the old paper was.',
      },
    ],
  },
  {
    id: 'dv_first_vote',
    title: 'Sixteen',
    body: 'A sixth-form hustings in {constituency}: a hundred and fifty sixteen-year-olds who can vote in {housefull}\'s elections and have realised this is a thing they can use. The first question is about the climate; the second is about why you voted the way you did on something you had forgotten you voted on.',
    tags: ['constituency', 'campaign', 'funny'],
    weight: 10, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 0 },
    choices: [
      {
        label: 'Answer straight',
        effects: { stats: { integrity: 3, constituencyApproval: 2, profile: 1 } },
        outcomeText: 'You tell them exactly why you voted that way and that you might vote differently now. The room goes quiet in a way that is either respect or a phone notification.',
      },
      {
        label: 'Give them the stump speech',
        effects: { stats: { partyStanding: 1, integrity: -2, constituencyApproval: -1 } },
        outcomeText: 'You deliver the leaflet in paragraph form. A girl in the third row films it, captions it, and it does worse numbers than you would like.',
      },
      {
        label: 'Ask them what they would do',
        effects: { stats: { competence: 2, constituencyApproval: 3 } },
        outcomeText: 'You turn it round and spend forty minutes being told, in detail, how to run a bus service. Two of the ideas are better than the council\'s and you say so.',
      },
    ],
  },

  // ── ministerial (tier 3–4, in government) ──────────────────────────────
  {
    id: 'dv_teacher_pay_estate',
    title: 'Chalk and cheque',
    body: 'The teaching unions have balloted for strikes, the school estate survey has found crumbling concrete in forty buildings, and as the minister for {department} you have one budget line that can fix either. The {head} would like neither on the news.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true, department: ['education', 'finance'] },
    choices: [
      {
        label: 'Settle the pay claim',
        effects: { stats: { partyStanding: 2, competence: 1, integrity: -1 } },
        outcomeText: 'You find the money for pay and the strike is called off within a week. The concrete stays where it is, and you add "roof" to the list of words you hope not to hear in the autumn.',
      },
      {
        label: 'Fix the buildings first',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You tell the unions the ceilings come before the pay rise and brace for the picket lines. The strike is bitter and short; the children in the forty schools are dry.',
      },
      {
        label: 'Demand a consequential from the Treasury for both',
        effects: { stats: { profile: 2, competence: -1 }, relationships: [{ kind: 'leader', delta: -1 }] },
        outcomeText: 'You write to {othergov} demanding the money and get a reply about fiscal discipline. The letter buys a fortnight of headlines and not one pound.',
      },
    ],
  },
  {
    id: 'dv_block_grant_row',
    title: 'The consequentials',
    body: 'The Treasury\'s statement lands and the Barnett consequentials for {nation} are smaller than every forecast on your desk. Your officials have a grievance letter drafted; the {head} wants a number to say on the news; {othergov} says the formula is the formula.',
    tags: ['policy', 'media', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true, department: ['finance'] },
    choices: [
      {
        label: 'Lead with the grievance',
        effects: { stats: { profile: 3, partyStanding: 2, competence: -1 } },
        outcomeText: 'You call it a betrayal and name a figure that is big, round and only mostly accurate. The base loves it; the Institute for Fiscal Studies publishes a footnote.',
      },
      {
        label: 'Publish the honest arithmetic',
        effects: { stats: { competence: 4, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You release the workings, including the lines that do not help you. The row is smaller and the reputation larger, and the {head} asks why you could not have managed both.',
      },
      {
        label: 'Quietly negotiate a transitional top-up',
        effects: { stats: { competence: 3, profile: -1 }, relationships: [{ kind: 'leader', delta: 1 }] },
        outcomeText: 'Three phone calls to a Treasury minister who, it turns out, also wants a quiet life. A modest adjustment appears in a footnote nobody reads except you.',
      },
    ],
  },
  {
    id: 'dv_leaked_memo',
    title: 'Official sensitive',
    body: 'A civil-service memo from {department} has reached {journalist}. It says, in the measured prose of the permanent government, that your flagship announcement is undeliverable on the timetable you gave {house}. The story goes at six.',
    tags: ['media', 'scandal', 'serious'],
    speaker: 'journalist',
    weight: 12, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Front it up and extend the timetable',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -2 } },
        outcomeText: 'You go on the evening news and say the officials were right and the date was wrong. It is a bad night and a good week; "minister admits" becomes "minister resets" by Thursday.',
      },
      {
        label: 'Demand a leak inquiry',
        effects: { stats: { partyStanding: 2, integrity: -3 }, relationships: [{ kind: 'journalist', delta: -2 }] },
        outcomeText: 'You talk about trust and process and the inquiry finds nothing. The story stays, and your private office is now afraid of you, which is not the same as loyal.',
      },
      {
        label: 'Call it "one official\'s view"',
        effects: { stats: { profile: 1, integrity: -2, competence: -2 }, relationships: [{ kind: 'leader', delta: 1 }] },
        outcomeText: 'You restate the date with a straight face. The {head} is grateful for the loyalty; the date arrives, and so does the memo, again.',
      },
    ],
  },
  {
    id: 'dv_presiding_officer_ruling',
    title: 'The chair rules',
    body: 'The {speaker} has ruled that {government} should have told {house} first — about the announcement your department made to the press on Monday. It is the third such ruling this session, and you were the minister on the podium.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Apologise to the chamber',
        effects: { stats: { integrity: 3, competence: 1, partyStanding: -1 } },
        outcomeText: 'You stand up, apologise without an "if", and sit down. The {speaker} nods; the opposition is briefly deflated by the absence of a fight.',
      },
      {
        label: 'Point out {oppparty} did the same',
        effects: { stats: { partyStanding: 2, integrity: -2 }, relationships: [{ kind: 'rival', delta: -1 }] },
        outcomeText: 'You note, with dates, that the other lot announced by press release every week they were in office. The chamber groans in the way that means you are right and it does not matter.',
      },
      {
        label: 'Let it be known the press office slipped',
        effects: { stats: { partyStanding: 1, integrity: -3, competence: -1 } },
        outcomeText: 'The embargo, you suggest, was a comms error. The officials involved will remember that too, and officials have long memories and short lunches.',
      },
    ],
  },
  {
    id: 'dv_storm_response',
    title: 'Named storm',
    body: 'A named storm has taken the power out across half of {nation}, closed the main trunk road and flooded two towns. In the resilience room you have an energy company that will not give a restoration time, a council that wants money, and a press conference in an hour.',
    tags: ['crisis', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Run the room properly',
        effects: { stats: { competence: 4, profile: 1, partyStanding: 1 } },
        outcomeText: 'You chair six hours of calls and give the press only the numbers you can stand behind. Boring, competent, and the power comes back on the day you said it would.',
      },
      {
        label: 'Name the energy firm on television',
        effects: { stats: { profile: 3, integrity: 1, competence: -1 } },
        outcomeText: 'You demand compensation on the evening news and get the headline and a frosty call. The engineers in the van were working flat out either way.',
      },
      {
        label: 'Promise "by the weekend"',
        effects: { stats: { profile: 2, competence: -3, integrity: -2 } },
        outcomeText: 'You give a date because the room needed one. The weekend comes and so does Monday, with four thousand homes still dark.',
      },
    ],
  },
  {
    id: 'dv_lifeline_route',
    title: 'Lifeline',
    body: 'The operator of a lifeline air or ferry route to one of {nation}\'s remotest communities has given notice. The subsidy is {department}\'s, the vessel or aircraft is thirty years old, and the people at the far end of the route have found your personal mobile.',
    tags: ['policy', 'constituency', 'serious'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true, department: ['transport', 'rural', 'finance'] },
    choices: [
      {
        label: 'Underwrite the route',
        effects: { stats: { competence: 2, integrity: 2, partyStanding: -1 } },
        outcomeText: 'You find the money for a two-year extension while a replacement is tendered. It costs more than the community\'s entire council budget, and you do not say so out loud.',
      },
      {
        label: 'Run an emergency tender',
        effects: { stats: { competence: 3, profile: -1 } },
        outcomeText: 'You run a procurement in nine weeks that your officials swore needed nine months. A smaller operator steps in on a worse timetable, and the community sends a cake.',
      },
      {
        label: 'Say the route must "find a sustainable footing"',
        effects: { stats: { partyStanding: 1, integrity: -3, competence: -2 } },
        outcomeText: 'The community finds the television news instead. The {head} asks you to fix it by Friday.',
      },
    ],
  },
  {
    id: 'dv_ministerial_code',
    title: 'A complaint under the code',
    body: 'An opposition {member} has referred you to the independent adviser on the ministerial code over a meeting you took with a donor\'s firm while your department was weighing its grant. You did nothing wrong, you think, and you did not log the meeting.',
    tags: ['scandal', 'serious'],
    weight: 10, cooldownDays: 480,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Refer yourself and publish everything',
        effects: { stats: { integrity: 4, competence: 1, profile: -1, partyStanding: -1 } },
        outcomeText: 'You hand over the diary, the notes and the one text message and ask for it to be quick. It clears you in six weeks with a note about record-keeping that you frame.',
      },
      {
        label: 'Tough it out',
        effects: { stats: { partyStanding: 2, integrity: -3 }, relationships: [{ kind: 'journalist', delta: -1 }] },
        outcomeText: 'You call it a politically motivated referral and say nothing more. The adviser\'s report, when it comes, is "disappointed", which in that prose is a flogging.',
      },
      {
        label: 'Ask the {head} to block the referral',
        effects: { stats: { partyStanding: 1, integrity: -4 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'The {head} declines, correctly, and tells you so with a look. The inquiry proceeds and {headoffice} now has a reason to remember you.',
      },
    ],
  },
  {
    id: 'dv_university_squeeze',
    title: 'Lecture theatres, half full',
    body: 'The universities of {nation} say funding per home student has fallen so far that they are closing departments and leaning on overseas fees that {othergov}\'s visa rules are now choking. As the minister for {department} you can find money, let them charge more, or let them shrink.',
    tags: ['policy', 'serious'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true, department: ['education', 'finance'] },
    choices: [
      {
        label: 'Scrape together an emergency fund',
        effects: { stats: { competence: 2, partyStanding: 1, profile: -1 } },
        outcomeText: 'You raid three other budget lines and buy two years. The vice-chancellors are grateful for exactly one news cycle.',
      },
      {
        label: 'Float a bigger graduate contribution',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -4 } },
        outcomeText: 'You say the unsayable about what students should pay and the sky falls in on your phone. The idea is right, the timing is yours, and {headoffice} "does not recognise" it by lunchtime.',
      },
      {
        label: 'Tell two institutions to merge',
        effects: { stats: { competence: 3, profile: -1, constituencyApproval: -2 } },
        outcomeText: 'You absorb the headlines about a town losing its university. It saves money; it does not save the town\'s pride.',
      },
    ],
  },
  {
    id: 'dv_quango_appointment',
    title: 'The appointment',
    body: 'The chair of a {department} public body falls vacant. The independent panel has shortlisted an eminent and dull expert, and {headoffice} has texted the name of a party loyalist who "would be marvellous". Both are appointable; only one is defensible.',
    tags: ['party', 'policy'],
    weight: 10, cooldownDays: 440,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Appoint the expert',
        effects: { stats: { competence: 3, integrity: 3 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'The body runs well for years and nobody thanks you. {headoffice} does not mention it, and you can feel it not being mentioned.',
      },
      {
        label: 'Appoint the loyalist',
        effects: { stats: { partyStanding: 3, integrity: -4 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'The commissioner for public appointments writes to you in a tone. Eighteen months later the loyalist is on the front page, and so are you.',
      },
      {
        label: 'Rerun the competition',
        effects: { stats: { integrity: 1, competence: -1, partyStanding: -1 } },
        outcomeText: 'You delay six months and reopen the process, which satisfies nobody and offends nobody. The expert applies again and gets it, slower.',
      },
    ],
  },

  // ── opposition frontbench (tier 3+, not in government) ─────────────────
  {
    id: 'dv_universal_benefit',
    title: 'Free for everyone, including the rich',
    body: 'A think tank has costed {government}\'s flagship universal entitlement — free at the point of use for the millionaire and the pensioner alike — and found it eats the budget that would have gone to the people who actually need it. As a {party} frontbencher you have to say whether you would keep it.',
    tags: ['policy', 'media', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Pledge to keep it',
        effects: { stats: { partyStanding: 3, profile: 1, integrity: -2 } },
        outcomeText: 'You call it a principle of the devolution settlement and refuse to be drawn. Safe, popular, and you know as well as the think tank does what it costs.',
      },
      {
        label: 'Say you would means-test it',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -3 } },
        outcomeText: 'You say the quiet part: universal is lovely and unaffordable. Conference gasps, {govparty} gleefully leaflets {constituency}, and three economists write to say thank you.',
      },
      {
        label: 'Promise a review',
        effects: { stats: { competence: 1, partyStanding: 1, integrity: -1 } },
        outcomeText: 'You announce a commission to report after the next election. The press release is masterful and everyone involved knows exactly what it means.',
      },
    ],
  },
  {
    id: 'dv_culture_war_import',
    title: 'Not our fight',
    body: 'The other parliament is consumed by a culture-war row and {otherparty} wants {nation} to pick a side. {government} has dodged; the papers want to know whether {party} will. As a frontbencher you will be asked by lunchtime.',
    tags: ['media', 'party', 'serious'],
    weight: 10, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Refuse to engage',
        effects: { stats: { integrity: 2, competence: 2, profile: -2 } },
        outcomeText: 'You say {nation} has its own problems and you intend to talk about them. Dull, correct, and the row moves on to someone who will play.',
      },
      {
        label: 'Pick a side',
        effects: { stats: { profile: 4, partyStanding: -2, integrity: -1 } },
        outcomeText: 'You give the clip, it trends, and by evening you are the face of an argument you did not start. Half your group is thrilled; the other half is looking at its phone.',
      },
      {
        label: 'Attack {othergov} for importing it',
        effects: { stats: { partyStanding: 3, profile: 1, integrity: -1 } },
        outcomeText: 'You turn the row into a grievance about London and your benches cheer. It is a well-worn groove and it works for a reason.',
      },
    ],
  },
  {
    id: 'dv_branch_tension',
    title: 'What London said',
    body: 'Your UK leader has announced a position in London that your group in {nation} has spent two years opposing. The lobby wants to know whether {party} here agrees with {party} there. {leader} has texted asking you not to answer your phone.',
    tags: ['party', 'media'],
    weight: 11, cooldownDays: 380,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Back the London line',
        effects: { stats: { partyStanding: 3, integrity: -2, constituencyApproval: -2 } },
        outcomeText: 'You swallow it and repeat it. The group is furious, the lobby is bored, and the voters in {constituency} who liked your old position notice.',
      },
      {
        label: 'Back the group',
        effects: { stats: { integrity: 3, profile: 2, partyStanding: -2 }, relationships: [{ kind: 'leader', delta: 1 }] },
        outcomeText: 'You say {party} in {nation} takes its own decisions, which is technically the party\'s constitution and politically a grenade. The London office briefs against you by teatime.',
      },
      {
        label: 'Find the form of words',
        effects: { stats: { competence: 3, integrity: -1 } },
        outcomeText: 'You produce a sentence with three subordinate clauses in which both positions are true. It is a work of art and nobody quotes it.',
      },
    ],
  },
  {
    id: 'dv_policing_seam',
    title: 'Who polices the police',
    body: 'A policing scandal has broken that straddles the settlement: the force is one thing, the law another, the money a third, and {government} and {othergov} each insist the inquiry belongs to the other. As a frontbencher you have a chamber to speak in and no clean target.',
    tags: ['policy', 'media', 'serious'],
    weight: 10, cooldownDays: 440,
    requires: { arena: ['scotland', 'wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Make it {pm}\'s problem',
        effects: { stats: { profile: 3, partyStanding: 2, integrity: -1 } },
        outcomeText: 'You pin it on {government} and the chamber rings with it. Strictly, it is half theirs; politically, it is now all theirs.',
      },
      {
        label: 'Call for a joint inquiry',
        effects: { stats: { competence: 3, integrity: 2, profile: -1 } },
        outcomeText: 'You propose the dull, right answer: both governments, one inquiry, one report. The idea is adopted six months later by someone else.',
      },
      {
        label: 'Pivot to {othergov}',
        effects: { stats: { partyStanding: 2, profile: 1, integrity: -2 } },
        outcomeText: 'You turn it on London and your benches enjoy it. The families at the heart of the scandal do not know what the Sewel convention is and would not care if they did.',
      },
    ],
  },

  // ── First Minister (leaderRole pm) ─────────────────────────────────────
  {
    id: 'dv_fmqs_thursday',
    title: 'Thursday, noon',
    body: 'First Minister\'s Questions. {lo} has a leaked waiting-list spreadsheet and a bereaved constituent in the gallery; your backbenchers have been told to make noise. You have twelve o\'clock and nothing in the folder that fits.',
    tags: ['westminster', 'media', 'serious'],
    weight: 13, cooldownDays: 240,
    requires: { arena: ['scotland', 'wales'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Answer the question honestly',
        effects: { stats: { integrity: 4, competence: 1 }, pollingShock: { party: 'gov', delta: -0.1 } },
        outcomeText: 'You concede the figures are not good enough and say so to the gallery, not to {lo}. The chamber goes quiet in the way it does when someone breaks the format; the clips are kind, the numbers are still the numbers.',
      },
      {
        label: 'Pivot to {otherleader}\'s record',
        effects: { stats: { partyStanding: 3, profile: 2, integrity: -2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You spend four minutes on {othergov} and none on the spreadsheet. Your benches roar; {journalist} writes that the {head} answered a question nobody asked.',
      },
      {
        label: 'Go after {lo} personally',
        effects: { stats: { profile: 3, integrity: -3 }, pollingShock: { party: 'own', delta: -0.1 }, relationships: [{ kind: 'rival', delta: -2 }] },
        outcomeText: 'You remind {house} what {oppparty} did the last time it held the brief, with dates. It lands, loudly, and the bereaved constituent leaves before the end.',
      },
    ],
  },
  {
    id: 'dv_budget_deal',
    title: 'Budget day arithmetic',
    body: 'The budget needs {house} to vote for it next week and you are short. The smaller parties each want one thing: a tax tweak, a rural fund, a word in the preamble. Your finance minister would like to know which of them you intend to buy.',
    tags: ['westminster', 'party', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], leaderRole: ['pm'], arrangementIn: ['minority', 'supplyConfidence'] },
    choices: [
      {
        label: 'Buy the cheapest votes',
        effects: { stats: { competence: 3, partyStanding: 1, integrity: -1 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You hand the smallest party its rural fund and the budget passes by two. It cost less than the alternative, and you tell yourself that is statecraft.',
      },
      {
        label: 'Dare the opposition to vote it down',
        effects: { stats: { profile: 3, integrity: 2, competence: -1 }, pollingShock: { party: 'gov', delta: -0.2 } },
        outcomeText: 'You put the budget to the chamber unamended and let them own the consequences. It passes on abstentions, barely, and your finance minister has aged visibly.',
      },
      {
        label: 'Give the big concession',
        effects: { stats: { competence: 1, integrity: 1, partyStanding: -3 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You accept the tax change you spent a year arguing against and the budget sails through. Your own benches are quieter than the vote deserved.',
      },
    ],
  },
  {
    id: 'dv_summit_empty_chair',
    title: 'An empty chair',
    body: 'The intergovernmental council — the forum where {othergov} and the devolved governments are meant to meet as equals — convenes next week, and {otherleader} has sent a junior minister with apologies. You are expected to turn up, smile, and be seen to be snubbed.',
    tags: ['policy', 'media'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Go and say so loudly',
        effects: { stats: { profile: 3, partyStanding: 2, competence: -1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You pose beside the empty chair and give a doorstep about respect. It plays well at home and the junior minister goes back to London with a story about you.',
      },
      {
        label: 'Boycott it',
        effects: { stats: { profile: 2, integrity: -1, competence: -2 } },
        outcomeText: 'You pull out and the meeting proceeds without the two people who matter. Nothing is agreed, which was going to happen anyway, and the empty-chair argument is harder to make next time.',
      },
      {
        label: 'Go and do the work',
        effects: { stats: { competence: 4, integrity: 2, profile: -1 } },
        outcomeText: 'You sit through the agenda with a junior minister who turns out to be competent and agree three practical things. Nobody notices, including {otherleader}.',
      },
    ],
  },
  {
    id: 'dv_conference_speech',
    title: 'The leader\'s speech',
    body: '{party}\'s conference in {nation} is yours to close. The hall wants red meat about {othergov}; the pollsters want "delivery"; your speechwriter has produced a draft with both and a joke about {otherleader} that the lawyers have flagged.',
    tags: ['party', 'media'],
    weight: 11, cooldownDays: 360,
    requires: { arena: ['scotland', 'wales'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Red meat',
        effects: { stats: { partyStanding: 4, profile: 2, integrity: -1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You give the hall its villain and the applause lasts a full minute. The clips are triumphant and the swing voters on the pollster\'s panel describe the speech as "a lot of shouting".',
      },
      {
        label: 'The delivery speech',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'Forty minutes on waiting times, buses and the budget, with numbers. The hall is polite; the editorial pages are warmer than they have been in a year.',
      },
      {
        label: 'Keep the joke',
        effects: { stats: { profile: 4, integrity: -2 }, pollingShock: { party: 'own', delta: -0.1 }, relationships: [{ kind: 'journalist', delta: 1 }] },
        outcomeText: 'The joke lands and makes every bulletin, including the London ones. By Saturday it is the only thing anyone remembers you said, and {otherleader}\'s office is "considering its options".',
      },
    ],
  },
  {
    id: 'dv_call_from_downing_street',
    title: 'The call from Downing Street',
    body: '{otherleader} rings. {othergov} is about to legislate in a devolved area and would like {government}\'s consent, or failing that, its silence. The Prime Minister is charming, brief and plainly reading from a note.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland', 'wales'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Withhold consent, publicly',
        effects: { stats: { profile: 3, partyStanding: 3, competence: -1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You put {house} to a vote refusing consent and win it comfortably. {othergov} legislates anyway, and both of you have what you wanted, which is a grievance.',
      },
      {
        label: 'Negotiate carve-outs quietly',
        effects: { stats: { competence: 4, integrity: 1, profile: -2 } },
        outcomeText: 'You get three exemptions for {nation} and a line in the bill in exchange for not making a scene. Your backbenchers wanted a scene.',
      },
      {
        label: 'Consent and bank the goodwill',
        effects: { stats: { competence: 1, integrity: -1, partyStanding: -3 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'You wave it through and {otherleader} is grateful in the way that lasts a fortnight. Your base is not grateful at all.',
      },
    ],
  },
];
