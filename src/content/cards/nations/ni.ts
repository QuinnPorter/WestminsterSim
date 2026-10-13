import { DecisionCard } from '../../../types/content';

/** Stormont only. The nation deck can name its nouns: the Executive Office,
 *  the petition of concern, the monitoring round, the Eleventh Night, the
 *  lough. Nothing here assumes which community the player's party belongs to:
 *  every card has to read the same for a DUP, Sinn Féin, Alliance or SDLP
 *  member, so the choices are about how you handle a thing, never which side
 *  of it you are on. Fictional people throughout; the Executive's ministers are
 *  "the Health Minister", never a name. */
export const NI_CARDS: DecisionCard[] = [
  // ── backbench / constituency ───────────────────────────────────────────
  {
    id: 'ni_waiting_list',
    title: 'Four years for a hip',
    body: 'A woman in {constituency} has been waiting four years for a hip operation and has started coming to your office every Friday with a folder. Northern Ireland’s waiting lists are the longest anywhere in these islands, the Health Minister says the money is in the Executive’s hands, and the Executive says the money is in London’s. Your constituent would like to walk.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 13, cooldownDays: 320,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Take the folder to the Health Minister in person',
        effects: { stats: { constituencyApproval: 4, profile: 1, partyStanding: -1 } },
        outcomeText: 'You wait outside the minister’s office at Castle Buildings with the folder. A date appears within a month, which is good for her and awkward for the other eleven thousand. You do not say so on the radio.',
      },
      {
        label: 'Call for the cross-border scheme to be reopened',
        effects: { stats: { competence: 2, profile: 2, partyStanding: -2 } },
        outcomeText: 'You point out that the hospital in Letterkenny has a theatre and a shorter list, and ask why the scheme that sent patients across the border was allowed to lapse. Half your party thinks it is a sensible idea; the other half thinks you have said something about the border.',
      },
      {
        label: 'Put the blame where the money is',
        effects: { stats: { partyStanding: 3, constituencyApproval: -2 } },
        outcomeText: 'You explain, carefully, that a block grant set in London cannot be stretched to a health service built for a bigger population. It is true, and the woman with the folder has heard it before. She says she will see you next Friday.',
      },
    ],
  },
  {
    id: 'ni_bypass_forever',
    title: 'The road that is always next',
    body: 'The bypass for {constituency} has been “next on the list” since before you stood. The Infrastructure Minister has found that a judicial review, a bat survey and an election have each intervened in turn, and the local paper has started printing a running tally of the years. A public meeting is called, and your name is on the poster.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Go, and promise nothing',
        effects: { stats: { integrity: 2, constituencyApproval: 1, profile: 1 } },
        outcomeText: 'You tell a packed hall exactly where the scheme sits and why, and decline to give a date. It is the least satisfying speech anyone has given on the subject and the first one nobody has to take back.',
      },
      {
        label: 'Go, and promise a date',
        effects: { stats: { constituencyApproval: 4, integrity: -2, competence: -1 } },
        outcomeText: 'You name a year. The hall cheers. The Infrastructure Minister’s office rings the next morning to ask where you got it, and {journalist} adds your date to the tally in the paper.',
      },
      {
        label: 'Send apologies and lobby the minister instead',
        effects: { stats: { competence: 2, constituencyApproval: -3 } },
        outcomeText: 'The meeting proceeds without you and spends twenty minutes on the fact. Your letter to the minister does, however, get the scheme a line in the next monitoring round. Nobody at the meeting will ever know.',
      },
    ],
  },
  {
    id: 'ni_eleventh_night',
    title: 'The Eleventh Night',
    body: 'A bonfire is going up on a patch of ground in {constituency}, forty feet from a row of houses, and the residents nearest it have asked the council, the Housing Executive and now you. Nobody wants to be the one who brings in contractors in July. Everybody would like you to say something, and everybody has a different something in mind.',
    tags: ['constituency', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Broker: smaller fire, further from the houses',
        effects: { stats: { competence: 3, integrity: 1, profile: 1 } },
        outcomeText: 'You spend a week on a patch of waste ground with the builders, the residents and a community worker who has done this before. The fire is twenty feet lower and sixty feet further away, and nobody thanks you, which is how you know it worked.',
      },
      {
        label: 'Back the residents publicly',
        effects: { stats: { integrity: 2, profile: 2, constituencyApproval: -3 } },
        outcomeText: 'You say that no one should have to hose their own roof down in July. It is not a controversial sentence anywhere else, and the replies to it are not about roofs.',
      },
      {
        label: 'Stay out of it',
        effects: { stats: { constituencyApproval: -1, partyStanding: 1 } },
        outcomeText: 'You decline every interview and let the council take the heat, literally and otherwise. The fire goes up, the houses survive, and {journalist} notes that the local MLA was “unavailable”.',
      },
    ],
  },
  {
    id: 'ni_parade_route',
    title: 'The determination',
    body: 'The Parades Commission has issued its determination on a contested route through {constituency}, and both sides have read it as a defeat. There will be a protest, a counter-protest and more police than marchers. The Chief Constable has asked local representatives to “use their influence”, which is a polite way of asking you to stand in a road.',
    tags: ['constituency', 'crisis', 'serious'],
    weight: 9, cooldownDays: 420,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Be there on the morning',
        effects: { stats: { profile: 3, integrity: 2, constituencyApproval: 1 } },
        outcomeText: 'You are there at seven, in the rain, between a line of police and a line of people who know your name. The day passes with shouting and no ambulances, and three separate accounts of it credit three different people.',
      },
      {
        label: 'Call for the determination to be respected',
        effects: { stats: { integrity: 3, partyStanding: -2, constituencyApproval: -2 } },
        outcomeText: 'You say the Commission exists so that the rest of us do not have to settle this on the road, and that its ruling stands. It is the position every party holds in private and some hold in public, and today you are one of the some.',
      },
      {
        label: 'Criticise the Commission',
        effects: { stats: { constituencyApproval: 3, partyStanding: 2, integrity: -2 } },
        outcomeText: 'You call the ruling unbalanced, which goes down well in one half of {constituency} and is clipped and shared in the other. The day passes anyway, as the days mostly do.',
      },
    ],
  },
  {
    id: 'ni_integrated_school',
    title: 'The vote in the school hall',
    body: 'Parents at a primary school in {constituency} have called a ballot on becoming an integrated school, and the campaign has acquired a Facebook page, a counter-page and a petition to the Education Minister. You have been asked to speak at the meeting by both sides, which is either a compliment or a trap.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Back the parents’ right to decide, whichever way',
        effects: { stats: { integrity: 2, competence: 1, constituencyApproval: 1 } },
        outcomeText: 'You say the law gives the parents the vote and the vote should be theirs, and sit down. Both pages quote you approvingly, which has not happened before and will not happen again.',
      },
      {
        label: 'Come out for integration',
        effects: { stats: { profile: 3, constituencyApproval: -1, partyStanding: -1 } },
        outcomeText: 'You say the children of {constituency} might as well start being taught together, since they will have to live together. The ballot passes narrowly. A letter to the paper asks who you think you are.',
      },
      {
        label: 'Raise the funding question instead',
        effects: { stats: { competence: 2, profile: 1 } },
        outcomeText: 'You ask the Education Minister, in writing, what transformation funding is actually available, and discover the answer is a brochure. The question outlasts the ballot and ends up in a committee report.',
      },
    ],
  },
  {
    id: 'ni_bilingual_signs',
    title: 'Two names for one street',
    body: 'The council covering {constituency} is voting on whether a street can have a bilingual sign after a survey of its residents, and the item has drawn more correspondence than the budget. You are not on the council. Your inbox would like you to behave as if you were.',
    tags: ['constituency', 'funny'],
    weight: 9, cooldownDays: 440,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Say the residents’ survey should settle it',
        effects: { stats: { integrity: 2, constituencyApproval: 1 } },
        outcomeText: 'You point out that the policy was written precisely so that the people on the street decide, and that the people on the street have. Four hundred emails are reduced to forty, which in this field is a landslide.',
      },
      {
        label: 'Make a speech about the cost of signs',
        effects: { stats: { profile: 2, competence: -1, constituencyApproval: 1 } },
        outcomeText: 'You cite a figure for a sign that turns out to be the figure for a bus shelter. The speech is nonetheless popular with everyone who had already decided, and {journalist} prints the correction under a photograph of the shelter.',
      },
      {
        label: 'Call it a council matter',
        effects: { stats: { partyStanding: 1, constituencyApproval: -2 } },
        outcomeText: 'You decline to have a view on a sign. This is received as having a view on a sign.',
      },
    ],
  },
  {
    id: 'ni_lough_algae',
    title: 'The lough is green',
    body: 'The lough that supplies {nation} with most of its drinking water has turned the colour of a snooker table. Blue-green algae, the scientists say; slurry, sewage and a warm summer. The Agriculture Minister blames the water company, the water company blames the farmers, and the people who swim in it have stopped. A photograph of a dead dog on the shore is everywhere.',
    tags: ['constituency', 'policy', 'crisis'],
    weight: 10, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Call for a single body to own the lough',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'You point out that the lough’s bed is privately owned, its water is somebody else’s and its shore is six councils’, and that nothing which belongs to everyone gets cleaned. The idea is picked up by a committee and, eventually, by a minister who presents it as their own.',
      },
      {
        label: 'Stand with the farmers',
        effects: { stats: { constituencyApproval: 3, partyStanding: 1, integrity: -1 } },
        outcomeText: 'You say the farms were here before the algae and will be here after it, which is true and also not the point. The farming union invites you to its dinner. The swimmers do not.',
      },
      {
        label: 'Swim in it for the cameras',
        effects: { stats: { profile: 4, competence: -2 } },
        outcomeText: 'You wade in to a depth of about a foot and come out with a rash, a photograph and a public health notice. The clip is seen more times than any speech you have made.',
      },
    ],
  },
  {
    id: 'ni_petition_of_concern',
    title: 'Thirty signatures',
    body: 'A bill nobody expected to be controversial has become one, and the {whip}’s office is gathering signatures for a petition of concern that would require a cross-community vote and kill it. You are the twenty-ninth name they need. The petition was designed to protect minorities; it is being used, as usual, to protect a position.',
    tags: ['party', 'policy', 'serious'],
    weight: 10, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3 },
    choices: [
      {
        label: 'Sign it',
        effects: { stats: { partyStanding: 3, integrity: -2, profile: 1 } },
        outcomeText: 'You sign. The bill falls on a vote it won, which is the kind of sentence that explains {nation} to visitors. The {whip} remembers your name in the right way.',
      },
      {
        label: 'Refuse, quietly',
        effects: { stats: { integrity: 3, partyStanding: -3 } },
        outcomeText: 'You tell the {whip} you will not put your name to a veto on something that was never about community. The petition finds its thirtieth signature elsewhere, and finds you a seat further from the front at the next group meeting.',
      },
      {
        label: 'Refuse, loudly',
        effects: { stats: { integrity: 3, profile: 3, partyStanding: -5 } },
        outcomeText: 'You tell {journalist} that the petition is being misused and that you will not sign. It is a good headline, a worse week, and the first time anyone in the Great Hall has called you brave as an insult.',
      },
    ],
  },
  {
    id: 'ni_co_option',
    title: 'The seat is filled by letter',
    body: 'A colleague in a neighbouring constituency has resigned, and in {nation} that means no by-election: the party simply nominates a replacement and the Chief Electoral Officer writes a letter. The party officers have a shortlist of two. One is the obvious local candidate. The other is somebody’s nephew.',
    tags: ['party', 'funny'],
    weight: 9, cooldownDays: 500,
    requires: { arena: ['ni'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Back the local candidate',
        effects: { stats: { integrity: 2, partyStanding: -1, competence: 1 } },
        outcomeText: 'You say the seat should go to the person who has been knocking its doors for a decade. The officers agree, slowly, and the nephew is promised something in the next co-option, of which there will be several.',
      },
      {
        label: 'Back the nephew',
        effects: { stats: { partyStanding: 3, integrity: -2 } },
        outcomeText: 'He is, to be fair, perfectly competent, and his uncle is grateful in ways that later turn out to be useful. The local candidate’s branch sends a letter to the paper about “parachutes”, which is a word that travels.',
      },
      {
        label: 'Say the public should get a vote',
        effects: { stats: { profile: 3, integrity: 2, partyStanding: -3 } },
        outcomeText: 'You argue, on the radio, that a seat should be refilled by the people who filled it. It is a popular view with the people and an unpopular one with every party, since every party has a nephew.',
      },
    ],
  },
  {
    id: 'ni_legacy_inquest',
    title: 'The inquest',
    body: 'A legacy inquest into a killing in {constituency} in the 1970s has finally opened, and the families have asked local representatives to sit with them. The courtroom will contain people who were there, people who were children, and some who would rather it had never been held at all. You can go, and sit, and say nothing. That is most of what is being asked.',
    tags: ['constituency', 'serious'],
    weight: 8, cooldownDays: 500,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Go and sit with the families',
        effects: { stats: { integrity: 3, profile: 1, constituencyApproval: 2 } },
        outcomeText: 'You sit in the second row for three days and are mentioned in no reports. One of the daughters, now in her sixties, shakes your hand at the end and says nothing either. It is the most useful thing you do this year.',
      },
      {
        label: 'Issue a statement about all victims',
        effects: { stats: { partyStanding: 2, integrity: -1 } },
        outcomeText: 'You issue a careful statement that mentions every category of grief and commits to none. It is correct in every particular and the families notice that you were not there.',
      },
      {
        label: 'Call for the whole legacy process to be rethought',
        effects: { stats: { profile: 3, competence: 1, constituencyApproval: -2 } },
        outcomeText: 'You use the inquest to make an argument about inquests, and the argument is a good one, and the families in the second row did not come for an argument.',
      },
    ],
  },
  {
    id: 'ni_translink_timetable',
    title: 'The last bus is now the 6.40',
    body: 'Translink has rewritten the timetable for the routes through {constituency}, and the evening service that got shift workers home has quietly gone. The Infrastructure Minister says the company is operationally independent; the company says it is funded by the Executive; the shift workers say they are standing at a stop in the dark.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Ride the last bus with a camera crew',
        effects: { stats: { profile: 3, constituencyApproval: 3, competence: -1 } },
        outcomeText: 'You take the 6.40 and talk to everyone on it. The item runs on the evening news with you holding a pole, and the service is reinstated for a “trial period”, which is how services are reinstated here.',
      },
      {
        label: 'Get the subsidy line changed in committee',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'You spend a month on the committee getting a line about rural evening services into the budget scrutiny report. It is the dullest victory of your career and the bus comes back without anyone knowing why.',
      },
      {
        label: 'Call for the company to be broken up',
        effects: { stats: { profile: 2, partyStanding: -1, competence: -1 } },
        outcomeText: 'You announce that a monopoly cannot be trusted with a timetable. The monopoly points out that the alternative is nobody, and the shift workers are no closer to home.',
      },
    ],
  },
  {
    id: 'ni_border_hinterland',
    title: 'Twenty minutes from the border',
    body: 'A constituent who lives in {constituency} and works in Letterkenny has brought you a tax problem, a pension problem and a question about which health service she belongs to, in that order. Half of {constituency}’s hinterland lives like this, and no department on either side of the line thinks it is their job.',
    tags: ['constituency', 'policy'],
    weight: 9, cooldownDays: 420,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Write to both governments at once',
        effects: { stats: { competence: 3, constituencyApproval: 2 } },
        outcomeText: 'You send the same letter to the Department of Finance and to Dublin, copied to each. Each replies that it is the other’s matter, which, laid side by side, is the first useful document on the subject. You frame them.',
      },
      {
        label: 'Make it a speech about the border',
        effects: { stats: { profile: 3, constituencyApproval: -2, partyStanding: 1 } },
        outcomeText: 'You use the case to say something broader, and the broader thing is what everyone hears. The constituent writes to say her pension is still not sorted and she did not ask to be an example.',
      },
      {
        label: 'Set up a cross-border advice clinic',
        effects: { stats: { constituencyApproval: 4, competence: 1, profile: 1 } },
        outcomeText: 'You get a councillor from across the line and a tax adviser from each jurisdiction into a community hall once a month. It is unglamorous, oversubscribed, and copied by three other constituencies within the year.',
      },
    ],
  },
  {
    id: 'ni_city_name',
    title: 'The city with two names',
    body: 'A tourism body has used one name for the north-west’s city in a brochure and you are being asked, by a radio presenter who knows exactly what he is doing, which one you use. The brochure was about a music festival. The music festival has been forgotten.',
    tags: ['media', 'funny'],
    weight: 8, cooldownDays: 500,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Say both, in one breath',
        effects: { stats: { competence: 1, profile: 1 } },
        outcomeText: 'You use the hyphenated form the broadcasters settled on years ago and move the conversation to the festival. The presenter is disappointed. The festival sells out.',
      },
      {
        label: 'Use the one your party uses',
        effects: { stats: { partyStanding: 2, constituencyApproval: 1, profile: 1 } },
        outcomeText: 'You say the name you were always going to say, and the half of the audience that agrees nods. It is clipped for the half that does not. Nobody mentions the music.',
      },
      {
        label: 'Call it the Walled City and refuse to elaborate',
        effects: { stats: { profile: 3, integrity: 1 } },
        outcomeText: 'The studio laughs, the presenter tries three more times, and you talk about the walls, which are four hundred years old and have never been in a brochure row. It becomes your bit.',
      },
    ],
  },
  {
    id: 'ni_community_grant',
    title: 'The scheme and the list',
    body: 'A community-development scheme has published the groups it is funding in {constituency}, and the list looks remarkably like the membership of one party’s constituency association. The scheme was signed off by an Executive minister from another party, who says the criteria were applied impartially. {journalist} has the criteria and a highlighter.',
    tags: ['constituency', 'scandal'],
    weight: 9, cooldownDays: 450,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3 },
    choices: [
      {
        label: 'Ask for the scoring to be published',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -1 } },
        outcomeText: 'You table a question asking for every application’s score. The department takes four months to release them, by which time the scheme has quietly been “refreshed”. The question is cited in an audit report with your name on it.',
      },
      {
        label: 'Defend the groups',
        effects: { stats: { constituencyApproval: 3, integrity: -2 } },
        outcomeText: 'You say the groups do real work, which they do, and that the people in them have the right to be in a party, which they do. The highlighter moves on to the next scheme and the groups remember who stood up.',
      },
      {
        label: 'Say nothing until the audit',
        effects: { stats: { partyStanding: 1, profile: -1 } },
        outcomeText: 'You wait. The Audit Office report, when it comes, uses the word “inadequate” fourteen times and your name none. You are not sure this is the result you wanted.',
      },
    ],
  },

  // ── the party's spokesperson: outside the brief, holding the minister to it ──
  {
    id: 'ni_question_time_brief',
    title: 'Fifteen minutes with the minister',
    body: 'Question Time for {department} is on Tuesday and you lead for {party}. The minister is from another Executive party, which means you are attacking a colleague in government you share. You have a question that would hurt. The {whip} would like to know whether it hurts the Executive or just the minister.',
    tags: ['westminster', 'policy'],
    weight: 12, cooldownDays: 240,
    requires: { arena: ['ni'], minTier: 3, maxTier: 3 },
    choices: [
      {
        label: 'Ask the hard question',
        effects: { stats: { profile: 3, competence: 2, partyStanding: -1 } },
        outcomeText: 'You ask it. The minister has not got an answer and says so at length. The clip travels, the Executive meets on Thursday in a mood, and your {leader} tells you it was a good question in the tone of someone who has been asked about it.',
      },
      {
        label: 'Ask it in writing first',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You give the minister a week with the question before you ask it in the chamber, which is either courtesy or strategy, and the answer that comes back is better than either of you expected. The scheme changes. Nobody notices you did it.',
      },
      {
        label: 'Ask about something safer',
        effects: { stats: { partyStanding: 2, profile: -1 } },
        outcomeText: 'You ask about a strategy document. The minister thanks you for it. Fifteen minutes pass in the way fifteen minutes at Stormont often pass.',
      },
    ],
  },
  {
    id: 'ni_committee_budget_line',
    title: 'The committee finds a line',
    body: 'The statutory committee scrutinising {department} has found a budget line that moved forty million pounds between headings with a one-sentence explanation. The chair wants to call the minister. The minister’s party would rather not. You sit on the committee, and {party} has the casting voice.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Call the minister',
        effects: { stats: { competence: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'The minister comes, with officials, and explains for ninety minutes. Some of it is even an explanation. The committee report uses the word “opaque”, which is as rude as committee reports get.',
      },
      {
        label: 'Ask for the paperwork instead',
        effects: { stats: { competence: 2, integrity: 1 } },
        outcomeText: 'You ask for the business case rather than the person. It arrives, in a box, and turns out to be interesting in ways the minister would not have been. The committee’s report quotes it.',
      },
      {
        label: 'Let it go',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'You say the explanation is sufficient, and the chair looks at you the way chairs look at people who have just become the government’s friend. Forty million pounds goes where it was going.',
      },
    ],
  },

  // ── a minister in the Executive ────────────────────────────────────────
  {
    id: 'ni_monitoring_round',
    title: 'The monitoring round',
    body: 'The Department of Finance has opened the monitoring round, which is where every department confesses its underspend and bids for everyone else’s. {department} has eleven million it will not spend this year. If you declare it, you lose it. If you hide it, the Finance Minister’s officials will find it in February, and the Finance Minister is from another party.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Declare it and bid for something bigger',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -1 } },
        outcomeText: 'You hand back eleven and bid for thirty, with a case. You get nineteen, which is more than you had, and a reputation at the Department of Finance as someone who plays the round straight. That turns out to be worth money later.',
      },
      {
        label: 'Spend it fast',
        effects: { stats: { constituencyApproval: 2, competence: -2, integrity: -1 } },
        outcomeText: 'Eleven million goes out the door in March on things that were on a list. Some of them were good. The Audit Office later describes the list as “accelerated”, which is its word for this.',
      },
      {
        label: 'Hide it in a reprofiling',
        effects: { stats: { partyStanding: 2, integrity: -3, competence: 1 } },
        outcomeText: 'The money is moved between years with a footnote. In February the Finance Minister’s officials find the footnote, and the Finance Minister raises it at the Executive in front of your {leader}. It is a long Thursday.',
      },
    ],
  },
  {
    id: 'ni_executive_paper_stuck',
    title: 'Not on the agenda',
    body: 'Your paper on {department}’s biggest decision has been ready for six weeks and has not appeared on the Executive’s agenda. The agenda is set jointly by the First and deputy First Ministers, and one of their parties has a problem with your paper, or with you, or wants something for letting it through. Nobody will say which.',
    tags: ['policy', 'party', 'serious'],
    weight: 11, cooldownDays: 320,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Trade: find out what they want',
        effects: { stats: { competence: 3, partyStanding: 1, integrity: -1 } },
        outcomeText: 'A special adviser meets a special adviser in a corridor. What they want turns out to be a paragraph in somebody else’s paper. The paragraph is written, your paper appears on Thursday, and the decision is taken. This is how the Executive works and you have just learned it.',
      },
      {
        label: 'Go public about the block',
        effects: { stats: { profile: 3, partyStanding: -2, integrity: 1 } },
        outcomeText: 'You tell {journalist} the decision is being held hostage. It is, and now it is held hostage in public, which the hostage-takers do not enjoy. The paper appears a month later with a hostile amendment and your {leader} asks you not to do that again.',
      },
      {
        label: 'Take the decision without the Executive',
        effects: { stats: { competence: -1, profile: 2, integrity: 1 } },
        outcomeText: 'You decide it is within your departmental authority and sign. A judicial review follows, on the grounds that it was “significant and controversial” and therefore the Executive’s. The court agrees. The decision is unmade.',
      },
    ],
  },
  {
    id: 'ni_permanent_secretary',
    title: 'The Permanent Secretary’s note',
    body: 'Your Permanent Secretary has sent a note, in the very neutral language of the Northern Ireland Civil Service, saying that the policy {party} fought the election on cannot lawfully be done the way you have asked. It can be done a slower way that nobody will notice for two years. Your {leader} would like a photograph next month.',
    tags: ['policy', 'party'],
    weight: 11, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Take the slow way',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You tell your {leader} that the photograph will be in two years and will be of a thing that exists. The group is unimpressed. The thing, eventually, exists.',
      },
      {
        label: 'Direct the official in writing',
        effects: { stats: { partyStanding: 3, integrity: -1, competence: -1 } },
        outcomeText: 'You issue a ministerial direction, which the Permanent Secretary files with the care of someone who has been here before. The photograph happens. Two years later, so does the court case, and the direction is Exhibit A.',
      },
      {
        label: 'Ask another department to do it',
        effects: { stats: { competence: 1, partyStanding: 1 } },
        outcomeText: 'You discover a route through a department run by another party, who are delighted to help for a price. The policy happens, slightly, in somebody else’s name. Your {leader} gets a photograph of two ministers.',
      },
    ],
  },
  {
    id: 'ni_north_south_council',
    title: 'The meeting in Armagh',
    body: 'The North-South Ministerial Council meets next week in Armagh, and your sectoral meeting with your Dublin counterpart is on the list. Attending is a legal duty, a political statement, and a two-hour drive. Your party has a view on the first two. Your counterpart has a funding offer that depends on the third.',
    tags: ['policy', 'party'],
    weight: 9, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Go and do the deal',
        effects: { stats: { competence: 3, profile: 1, partyStanding: -1 } },
        outcomeText: 'You drive to Armagh and come back with joint funding for something your department could not have paid for alone. The communiqué is seven paragraphs of nothing with one useful sentence, and you wrote the sentence.',
      },
      {
        label: 'Send the junior minister',
        effects: { stats: { partyStanding: 2, competence: -1 } },
        outcomeText: 'A junior minister goes, signs what was going to be signed, and gets the photograph. Your party notes your absence approvingly, your counterpart notes it less so, and the funding offer becomes a “proposal for further discussion”.',
      },
      {
        label: 'Attend and make a point of it',
        effects: { stats: { profile: 3, integrity: 1, partyStanding: -2 } },
        outcomeText: 'You go, you do the deal, and you say on the steps that ministers should turn up to meetings they are required to attend. It is directed at nobody in particular and everybody knows who.',
      },
    ],
  },
  {
    id: 'ni_pay_strike',
    title: 'The picket at the gates',
    body: 'The workers your department employs are on strike over pay that has fallen years behind their colleagues’ in England, and the picket is at the gates of Stormont. The money to settle it is in a row with {othergov} about the block grant, and the row is not going to end this week. The strikers would like to speak to the minister. That is you.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Go out to the picket',
        effects: { stats: { integrity: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'You walk down to the gates in the rain and say you have no money and no excuse, and that you will say so in London. The strikers do not cheer but they do stop shouting. The clip is of a minister listening, which is rare enough to run.',
      },
      {
        label: 'Make London the villain',
        effects: { stats: { partyStanding: 3, constituencyApproval: 1, integrity: -1 } },
        outcomeText: 'You hold a press conference about the block grant. Every word is accurate and the picket is still there in the morning, because the picket is not about who is to blame.',
      },
      {
        label: 'Find the money inside the department',
        effects: { stats: { competence: 3, constituencyApproval: -2 } },
        outcomeText: 'You cut three programmes nobody will defend and fund the award for one year. The strike ends. The three programmes’ users write to {journalist}, and next year’s monitoring round is already spoken for.',
      },
    ],
  },

  // ── the First Minister ─────────────────────────────────────────────────
  {
    id: 'ni_joint_statement',
    title: 'The joint statement that is not joint',
    body: 'A statement from the Executive Office is needed by six o’clock and the deputy First Minister’s office has returned your draft with a line through the second paragraph. The office is joint: nothing goes out in one name. Your party would like the paragraph. Their party would like it gone. The broadcasters would like something, anything, by six.',
    tags: ['party', 'crisis', 'serious'],
    weight: 12, cooldownDays: 240,
    requires: { arena: ['ni'], leaderRole: ['pm'], executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Drop the paragraph',
        effects: { stats: { competence: 2, partyStanding: -2, integrity: 1 } },
        outcomeText: 'The statement goes out at ten to six, shorter and duller and jointly signed. Your party notes the missing paragraph. The deputy First Minister notes that you can be dealt with, which is a currency of its own.',
      },
      {
        label: 'Issue your own statement',
        effects: { stats: { partyStanding: 3, profile: 2, competence: -2 } },
        outcomeText: 'A statement goes out in your name alone. By seven there is one in the deputy First Minister’s. By nine the broadcasters are running them side by side under the word “split”. The paragraph is in yours. It is the only thing anyone reads.',
      },
      {
        label: 'Issue nothing',
        effects: { stats: { integrity: 1, profile: -2, partyStanding: -1 } },
        outcomeText: 'Six o’clock passes in silence from the Executive Office, which the broadcasters report as news in itself. The paragraph is never written. Neither is anything else.',
      },
    ],
  },
  {
    id: 'ni_secretary_of_state_budget',
    title: 'Summoned to Hillsborough',
    body: 'The Secretary of State has asked the First and deputy First Ministers to Hillsborough Castle to discuss the budget {government} has failed to agree, and has let it be known that if it is not agreed by the end of the month London will set one. You and the deputy First Minister are to arrive together, in the same car if possible. The car is going to be quiet.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], leaderRole: ['pm'], executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Agree a budget in the car',
        effects: { stats: { competence: 4, partyStanding: -2, profile: 1 } },
        outcomeText: 'Forty minutes on the road from Stormont to Hillsborough, and by the gates you have a budget neither party likes and both can live with. The Secretary of State is visibly disappointed to be unnecessary.',
      },
      {
        label: 'Let London set it',
        effects: { stats: { partyStanding: 2, integrity: -2, competence: -1 } },
        outcomeText: 'You let the month run out. The Secretary of State sets a budget, which is worse for everybody and the fault of nobody in {nation}, and your party finds this a comfortable position until the cuts start.',
      },
      {
        label: 'Make the meeting about the block grant',
        effects: { stats: { profile: 3, partyStanding: 1, competence: -1 } },
        outcomeText: 'You and the deputy First Minister agree on one thing, which is that the money is not enough, and say so together on the steps. It is the most united the Executive Office has looked in months. The budget is still not agreed.',
      },
    ],
  },

  // ── more from the constituency and the backbenches ─────────────────────
  {
    id: 'ni_rhi_boilers',
    title: 'Burn to earn',
    body: 'A poultry farmer in {constituency} has heard about a renewable heat scheme that pays more for every unit of heat than the wood pellets cost to make it, and asks you, as his MLA, whether he should put a second boiler in a shed he does not use. The scheme is lawful, the department’s own leaflet encourages take-up, and a man two farms over has four boilers and a new jeep. You have read the leaflet. Nobody appears to have read the sums.',
    tags: ['constituency', 'scandal', 'policy'],
    weight: 11, cooldownDays: 900, oncePerCareer: true,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3 },
    choices: [
      {
        label: 'Tell him it is legal and to get on with it',
        effects: { stats: { constituencyApproval: 3, integrity: -2, competence: -1 } },
        outcomeText: 'He puts in two boilers. Three years later the scheme is the biggest scandal in {nation}’s history, there is a public inquiry, and his name is on a list that is published. Yours is in his diary, in his handwriting, under the word “advice”.',
      },
      {
        label: 'Write to the department asking how the tariff was set',
        effects: { stats: { competence: 3, integrity: 2, constituencyApproval: -1 } },
        outcomeText: 'The reply, four months later, is a page about the scheme in England and nothing about this one. You file it. When the inquiry comes you are the only MLA who can produce a letter dated before the cost controls, and {journalist} calls you prescient, which is a word that pays late.',
      },
      {
        label: 'Tip off {journalist}',
        effects: { stats: { profile: 3, partyStanding: -2, integrity: 1 } },
        outcomeText: 'The story runs: a shed, a boiler, a thermometer reading forty degrees. It is a good story and an early one, and the scheme stays open another eighteen months anyway, because closing it would mean somebody admitting it. Your party notes who handed the paper a stick.',
      },
    ],
  },
  {
    id: 'ni_a5_vigil',
    title: 'Fifty names on the verge',
    body: 'The families who have lost someone on the A5 are holding a vigil at the roadside in {constituency}, with a placard for each death since the new road was first promised. The dual carriageway has been through two public inquiries and a judicial review, Dublin has offered money and withdrawn it and offered it again, and a farmers’ group has a fresh challenge lodged on the carbon figures. The Infrastructure Minister has sent a statement. The families would prefer a person.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 450,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Stand with the families and call for the diggers',
        effects: { stats: { constituencyApproval: 4, profile: 2, competence: -1 } },
        outcomeText: 'You hold a candle in the wind off the Sperrins and say the road must be built. Everyone there agrees. The farmers’ group, whose members also vote in {constituency}, note that you have called their court case a delay, which it is, and which is not what they call it.',
      },
      {
        label: 'Ask for interim safety work on the existing road',
        effects: { stats: { competence: 3, constituencyApproval: 1, profile: -1 } },
        outcomeText: 'Barriers, a lower limit, average-speed cameras on the worst stretch. It is not the road and nobody wanted to hear it, and in two years the figures on the placards stop climbing as fast. The dual carriageway is still in court.',
      },
      {
        label: 'Blame the delay on the courts, publicly',
        effects: { stats: { profile: 3, partyStanding: 1, integrity: -2 } },
        outcomeText: 'You say a road should not be stopped by a spreadsheet about carbon. It is a popular sentence. The judge, when the case comes, quotes it, and finds that the department’s spreadsheet was in fact wrong.',
      },
    ],
  },
  {
    id: 'ni_casement_park',
    title: 'The stadium that is not there',
    body: 'The stadium in west Belfast has been promised for a decade. It has planning permission, a design, a football tournament hoping to use it and no money: the cost has trebled, the sporting body has its share, the Executive has the share agreed by the last Executive but one, and the gap is {othergov}’s to fill or not. Two other stadiums, for two other sports, were built on time. A radio presenter wants to know whether you would spend the money on it, and the question is not about sport.',
    tags: ['policy', 'media', 'serious'],
    weight: 10, cooldownDays: 480,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Say it should be built: three sports were promised three grounds',
        effects: { stats: { integrity: 2, profile: 2, constituencyApproval: -1 } },
        outcomeText: 'You say a promise to one community is a promise, and that two of the three grounds exist. It is the right answer on paper, and the paper is read in both halves of {nation} in different tones. A supporters’ club sends you a scarf. Somebody else sends a photograph of a hospital.',
      },
      {
        label: 'Say the money should go to grassroots pitches instead',
        effects: { stats: { constituencyApproval: 2, partyStanding: 1, competence: 1 } },
        outcomeText: 'Three hundred changing rooms instead of one stadium. It is a sensible sentence and it is heard, in west Belfast, as the sentence that has always been said about that ground. The pitches are not built either.',
      },
      {
        label: 'Say the Treasury should pay, since the tournament is theirs',
        effects: { stats: { partyStanding: 2, profile: 1, competence: -1 } },
        outcomeText: 'You put the bill in London’s post, where every bill in {nation} is eventually sent. London declines, the tournament goes elsewhere, and the site remains a fence with a hoarding on it that has been repainted twice.',
      },
    ],
  },
  {
    id: 'ni_sea_border_pallet',
    title: 'The pallet at Larne',
    body: 'A garden centre in {constituency} has a pallet of bare-root fruit trees sitting in a shed at the port. The paperwork that would release it is paperwork the Protocol requires, the Framework was meant to simplify and the haulier has never seen before. The owner has rung you because the last three people she rang were in Brussels, London and a call centre in Cardiff. She does not want a position on the constitution. She wants her trees before they wake up.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Work the trader scheme with her, form by form',
        effects: { stats: { competence: 3, constituencyApproval: 3, profile: -1 } },
        outcomeText: 'You and a member of staff spend two days on a government website that has clearly never been used by anyone who sells trees. The pallet is released on the Thursday. The owner tells everyone in the garden centre that you did it, and nobody outside the garden centre.',
      },
      {
        label: 'Make it the case study in a speech about the sea border',
        effects: { stats: { profile: 3, partyStanding: 2, constituencyApproval: -2 } },
        outcomeText: 'The trees appear in the Assembly, in a photograph, as whichever thing your party says they are: proof the arrangements are unworkable, or proof the Framework needs time. The owner, who voted the other way, asks that her shop’s name not be used again.',
      },
      {
        label: 'Tell her to source from Wicklow instead',
        effects: { stats: { competence: 1, constituencyApproval: -1, partyStanding: -1 } },
        outcomeText: 'You point out that a nursery across the border can send her the same trees with no forms at all. It is true and useful and she takes it, and her supplier in Lincolnshire, who had the account for thirty years, writes to his own MP about you.',
      },
    ],
  },
  {
    id: 'ni_two_invitations',
    title: 'The field and the festival',
    body: 'Two invitations have arrived for the same week in {constituency}: one to the demonstration field on the Twelfth, where the lodges will gather and a platform party will speak, and one to the opening night of the community festival on the other side of town, where a different platform party will speak. Your predecessor went to one of them every year and was never seen at the other. Both organisers have said, separately, that it would mean a lot.',
    tags: ['constituency', 'personal'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Go to both',
        effects: { stats: { integrity: 2, profile: 2, partyStanding: -2, constituencyApproval: 1 } },
        outcomeText: 'You stand in a field in a suit on Tuesday and in a marquee in a different suit on Friday, and are photographed at both. Each photograph is shared with approval in the half of {constituency} it was taken in and with a different caption in the other. Your {whip} asks what you thought you were doing.',
      },
      {
        label: 'Go to the one your party goes to',
        effects: { stats: { partyStanding: 2, constituencyApproval: 1 } },
        outcomeText: 'You go where you were always going to go and are welcomed as you were always going to be. The other organiser sends a polite note saying perhaps next year, which is what she wrote to your predecessor for eleven years.',
      },
      {
        label: 'Go to neither, and plead the surgery',
        effects: { stats: { integrity: -1, constituencyApproval: -2, competence: 1 } },
        outcomeText: 'You hold a constituency surgery on both days and see thirty people. It is useful work and nobody photographs it, and both organisers conclude, correctly, that you were avoiding them.',
      },
    ],
  },
  {
    id: 'ni_phone_in',
    title: 'Three hours of live radio',
    body: 'The morning phone-in, which has a bigger audience than any programme in {nation} and knows it, wants you live at nine on a story about a colleague’s expenses that broke overnight. The presenter will have the receipts; the callers will have views; the colleague is in {party} and has not yet said anything. The producer says they are going ahead with or without you, and that “without” will be mentioned on air, more than once.',
    tags: ['media', 'party'],
    weight: 12, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, maxTier: 4 },
    choices: [
      {
        label: 'Go on and defend the colleague',
        effects: { stats: { partyStanding: 3, integrity: -2, profile: 1 } },
        outcomeText: 'You spend forty minutes saying the matter is being looked into, which is what you were told to say. A caller from Dungannon reads the receipts out. The colleague resigns at noon, and the clip of you is the one that runs beside it.',
      },
      {
        label: 'Go on and say what you actually think',
        effects: { stats: { integrity: 3, profile: 3, partyStanding: -4 } },
        outcomeText: 'You say that if the receipts are what they look like, the colleague should go. The presenter is briefly silent, which has not happened before. The colleague goes that afternoon and does not speak to you again, and neither, for a fortnight, does the {whip}.',
      },
      {
        label: 'Send a statement and stay off',
        effects: { stats: { profile: -2, partyStanding: 1 } },
        outcomeText: 'The statement is read out in a voice. The presenter spends ten minutes on your absence and the callers are not kind about it. The colleague survives the week. You are not sure you did.',
      },
    ],
  },
  {
    id: 'ni_redesignation',
    title: 'The word on the form',
    body: 'Every MLA signs a designation at the start of the mandate: unionist, nationalist or other. A key vote this week needs cross-community support and is one designated vote short on one side. A party officer has floated the idea, quietly and then less quietly, that a member of {party} could re-designate for the day; it has been done before, once, and the people who did it were called every name there is. Your name has come up as someone whose form could change.',
    tags: ['party', 'westminster', 'serious'],
    weight: 9, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Change the word',
        effects: { stats: { partyStanding: 3, competence: 1, integrity: -3, profile: 2 } },
        outcomeText: 'You sign a new form, the vote passes, and for a week you are the most famous MLA in {nation}, and not in the way you had hoped. The word is changed back. The Speaker’s office files both forms. Somebody keeps a copy of the first one.',
      },
      {
        label: 'Refuse',
        effects: { stats: { integrity: 3, partyStanding: -2 } },
        outcomeText: 'You say the form says what you are and you are not a procedural device. The vote falls, and the thing it would have done is done three months later by a different route, and the party officer forgets whose idea it was.',
      },
      {
        label: 'Propose a weighted majority instead, in public',
        effects: { stats: { profile: 3, competence: 2, partyStanding: -2 } },
        outcomeText: 'You say a system in which identity decides arithmetic will always produce this, and that the rule should be a plain weighted majority. Every party agrees in principle and none in time for Tuesday. The vote falls. The speech is quoted in a report nobody acts on.',
      },
    ],
  },
  {
    id: 'ni_speaker_election',
    title: 'A Speaker for both sides',
    body: 'The Assembly cannot do business until it has elected a Speaker, and a Speaker needs cross-community support, which means a candidate from one designation needs votes from the other. The candidate on offer is somebody you have clashed with in committee for years, and the {whip} has told the group that the deal is done and the vote is Monday. A colleague is going round the group suggesting a few abstentions would “send a message” without sinking anybody. It would sink the sitting.',
    tags: ['westminster', 'party'],
    weight: 10, cooldownDays: 900,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Vote as the whip asks',
        effects: { stats: { partyStanding: 2, competence: 1 } },
        outcomeText: 'You vote for a person you do not like and the Assembly sits on Tuesday. The new Speaker, who has a long memory and a list of who voted how, calls you early in the first debate, which is either gratitude or a test.',
      },
      {
        label: 'Abstain with the message-senders',
        effects: { stats: { partyStanding: -3, profile: 1, integrity: -1 } },
        outcomeText: 'Four abstentions. The candidate falls one short, the chamber adjourns without a Speaker, and the message that is sent is that {party} cannot count. A second ballot on Thursday elects the same person. You are not called in any debate for a month.',
      },
      {
        label: 'Go and see the candidate first',
        effects: { stats: { competence: 3, integrity: 1, profile: 1 } },
        outcomeText: 'You spend half an hour in a corridor with someone you have never spoken to without a microphone between you, and come away with an undertaking about committee time that is worth more than any message. You vote. The Assembly sits. The undertaking is kept, mostly.',
      },
    ],
  },
  {
    id: 'ni_programme_for_government',
    title: 'Outcomes, not targets',
    body: 'The Executive has published its draft Programme for Government, two years into the mandate, and it is forty pages of “outcomes”: a {nation} where everyone is healthier, better educated and more prosperous, with indicators and no dates. Your committee is asked for a response by Friday. The officials who wrote it will say, correctly, that targets get missed and outcomes do not; the people who read your response will ask what the government intends to do, and by when.',
    tags: ['policy', 'westminster'],
    weight: 10, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Demand dated targets',
        effects: { stats: { competence: 3, profile: 1, partyStanding: -1 } },
        outcomeText: 'Your response says a programme without a date is a brochure. It is quoted in the chamber by every opposition voice and by two Executive ministers, who thought the same and could not say it. The final document gains six dates, three of them after the next election.',
      },
      {
        label: 'Welcome the framework',
        effects: { stats: { partyStanding: 2, integrity: -1 } },
        outcomeText: 'You write that an outcomes approach is mature government. It is a phrase from the document, and the officials are grateful, and the Audit Office three years later finds that no indicator has been measured twice in the same way.',
      },
      {
        label: 'Attach a list of what {constituency} needs',
        effects: { stats: { constituencyApproval: 3, competence: -1 } },
        outcomeText: 'A road, a school and a health centre, in an appendix to a document about wellbeing indicators. The appendix is noted. The school appears, four years on, in a different document, and you are not sure it was you.',
      },
    ],
  },
  {
    id: 'ni_legacy_act_motion',
    title: 'The motion on legacy',
    body: 'London has legislated to end Troubles-era inquests and civil cases and move everything into a single commission offering conditional immunity, and the Assembly, which has no power over it, is to debate a motion rejecting it. Every party at Stormont has opposed the Act, for reasons that do not overlap, and the victims’ groups in {constituency} are split three ways about whether a motion that changes nothing is worth anything. You are down to speak for twenty minutes.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 9, cooldownDays: 900, oncePerCareer: true,
    requires: { arena: ['ni'], minTier: 0 },
    choices: [
      {
        label: 'Speak about one family',
        effects: { stats: { integrity: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'You read one name and one date into the record and say what the commission would mean for that one case. The chamber is quiet in the way it is only when nobody is scoring. A family in the gallery asks for a copy. Your party would have liked the other nineteen minutes spent on the Act.',
      },
      {
        label: 'Speak about the principle, hard',
        effects: { stats: { partyStanding: 3, profile: 2, constituencyApproval: -1 } },
        outcomeText: 'You give the speech your party wants and it is a good speech, and it is quoted by the groups who agree with it. The groups who do not, who also lost people, hear in it the sentence they always hear.',
      },
      {
        label: 'Say the Assembly should ask for the powers instead',
        effects: { stats: { competence: 3, profile: 1, partyStanding: -2 } },
        outcomeText: 'You say a chamber that keeps voting on things it cannot change should ask to be able to change them, and propose that legacy be devolved. It is a serious idea and the only one of the day that frightens anybody, in Dublin and London and in your own party.',
      },
    ],
  },
  {
    id: 'ni_regional_rate',
    title: 'The only tax you set',
    body: 'The Finance Minister’s budget raises the regional rate by seven per cent, which is the only tax the Executive sets and the only one anyone in {constituency} notices, and a note on the final page says revenue options under consideration include water charges, which every party has promised never to introduce and {othergov} keeps suggesting. The vote is Tuesday and the {whip} has not yet said which way. Your inbox has.',
    tags: ['policy', 'westminster'],
    weight: 11, cooldownDays: 420,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Back the rise, and say why',
        effects: { stats: { competence: 3, integrity: 2, constituencyApproval: -3 } },
        outcomeText: 'You say a health service cannot be run on the rates of 2010 and that anyone who says otherwise is selling something. It is a brave speech. {journalist} prints your rates bill, which you declared, alongside a pensioner’s, which she did not.',
      },
      {
        label: 'Oppose it with no alternative',
        effects: { stats: { constituencyApproval: 3, competence: -2, partyStanding: 1 } },
        outcomeText: 'You say families cannot take another rise, which is true, and are asked what you would cut, and name a strategy document. The rise passes anyway. You are on the right side of the doorsteps and the wrong side of the arithmetic.',
      },
      {
        label: 'Say the words “water charges” out loud',
        effects: { stats: { profile: 4, partyStanding: -3, integrity: 1 } },
        outcomeText: 'You say that a place which keeps running out of money and keeps refusing to charge for water is making a choice, and should say so. Every party, including yours, condemns it within the hour. Three ministers tell you privately that you are right.',
      },
    ],
  },
  {
    id: 'ni_irish_language_chamber',
    title: 'The language on the floor',
    body: 'A colleague has opened a speech in Irish and been interrupted by a point of order, and the Speaker has ruled, carefully, that members may speak in the language of their choice and that the translation will follow. The next point of order is about Ulster-Scots. Standing Orders are now to be reviewed and your committee is asked what the rules should say. Every party has a position and the positions are the ones they had in 1998. The committee would like a form of words by Friday.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 9, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3 },
    choices: [
      {
        label: 'Propose both languages, with an interpreter and a budget line',
        effects: { stats: { competence: 3, integrity: 1, partyStanding: -1 } },
        outcomeText: 'A rule, a booth, and a cost. It is a proposal about procedure and it is argued about as something else, and it passes after a year with an amendment nobody understands. Members speak in three languages, briefly, and then mostly in English, as before.',
      },
      {
        label: 'Say English only, for the cost',
        effects: { stats: { partyStanding: 2, constituencyApproval: 1, integrity: -2 } },
        outcomeText: 'You cite a figure for interpreters. The figure is correct this time. It is heard, by half the chamber, as a sentence about something other than money, and the half that hears it that way includes some of your own voters.',
      },
      {
        label: 'Say members may use any language, with no translation',
        effects: { stats: { profile: 2, competence: -1 } },
        outcomeText: 'Your compromise means a speech in Irish or Ulster-Scots is heard by its speaker and understood by almost nobody else, which some members call freedom and others call theatre. It is adopted. The official report gains some interesting pages.',
      },
    ],
  },
  {
    id: 'ni_dhondt_pick',
    title: 'The share-out',
    body: 'The Executive is being formed by d’Hondt, and {party}’s turn to pick a department comes round at eleven. The group is in a room off the Great Hall with a list. Finance and Economy are gone. Health is there, with the longest waiting lists in these islands and a budget that is never enough; Education, with a school estate falling down; Infrastructure, with the A5 and a water system the Audit Office keeps writing about. Your {leader} asks what the group thinks. The group looks at you.',
    tags: ['party', 'policy'],
    weight: 10, cooldownDays: 1200,
    requires: { arena: ['ni'], minTier: 0, maxTier: 3, inGovernment: true, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Take Health: somebody has to',
        effects: { stats: { integrity: 3, competence: 1, partyStanding: -2 } },
        outcomeText: 'You say a party that wants to be taken seriously takes the hardest brief. The group is impressed in the way groups are impressed by people who have volunteered them for something. {party} takes Health. Four years of the lists follow, with your party’s name on them, and a reputation for seriousness that outlasts the minister.',
      },
      {
        label: 'Take Education: the voters have children',
        effects: { stats: { partyStanding: 2, constituencyApproval: 2 } },
        outcomeText: 'Education it is: every school in {nation} with a minister from {party} on its letterhead. The roofs still leak. Parents know who to write to, which is both the point and the cost.',
      },
      {
        label: 'Take Infrastructure: it has ribbons to cut',
        effects: { stats: { competence: 2, profile: 1, integrity: -1 } },
        outcomeText: 'Roads, bridges, a water system. There are photographs in Infrastructure and your {leader} likes a photograph. Then the sewers in {constituency} back up in a wet March and the photographs are of something else.',
      },
    ],
  },

  // ── more for a minister in the Executive ───────────────────────────────
  {
    id: 'ni_spad_appointment',
    title: 'The adviser',
    body: 'As a minister you may appoint one special adviser, and the party has sent you a name: a long-standing staffer who knows every councillor in {nation} and was mentioned, in passing and not warmly, in the last public inquiry. Since that inquiry the appointment is supposed to be the minister’s alone, with a code and a declaration. Your Permanent Secretary has sent the code, highlighted. Your {leader} has sent the name, twice.',
    tags: ['party', 'scandal'],
    weight: 11, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Appoint the party’s name',
        effects: { stats: { partyStanding: 3, competence: 1, integrity: -2 } },
        outcomeText: 'The adviser arrives and is extremely good at the job, which is the problem the inquiry identified. Papers move; officials learn who to ask. Eighteen months later {journalist} prints a text message from your adviser to a councillor about a planning application, and your name is in the second paragraph.',
      },
      {
        label: 'Appoint someone of your own choosing',
        effects: { stats: { competence: 2, integrity: 2, partyStanding: -3 } },
        outcomeText: 'You pick a former official with no party card and a filing habit. The department runs well and the party stops copying you into things. Your {leader} describes your adviser, in a meeting you are not at, as “the civil servant”.',
      },
      {
        label: 'Appoint the party’s name, and publish the declaration',
        effects: { stats: { integrity: 1, partyStanding: 1, competence: 1 } },
        outcomeText: 'You take the name and publish everything: the code, the declaration, the salary. It is the first time anyone has, and it is not thanked. When the text message comes, the declaration is what you point to, and it is, narrowly, enough.',
      },
    ],
  },
  {
    id: 'ni_hospital_reconfiguration',
    title: 'The paper on acute services',
    body: 'The Health Minister has brought the Executive a paper that every review for fifteen years has recommended: {nation} has too many acute hospitals for its size, and the emergency department nearest {constituency} is to become an urgent-care centre, with ambulances going forty minutes further. Every party signed the strategy that says this must happen. No party has yet voted for the hospital in its own constituency to be the one. The paper is for decision on Thursday and you sit at the table.',
    tags: ['policy', 'crisis', 'serious'],
    weight: 11, cooldownDays: 500,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Back the paper',
        effects: { stats: { integrity: 3, competence: 3, constituencyApproval: -5 } },
        outcomeText: 'You vote for it. The department nearest {constituency} closes its doors to blue lights the following spring, and the forty minutes is forty minutes. There is a candlelit protest with your face on a placard. Stroke outcomes across {nation} improve the year after, which nobody in {constituency} is in a mood to hear.',
      },
      {
        label: 'Oppose it, for your own constituency',
        effects: { stats: { constituencyApproval: 4, partyStanding: 1, integrity: -3, competence: -1 } },
        outcomeText: 'You say the paper is right everywhere but here. So does every other minister with a hospital. The paper is withdrawn for “further engagement”, which is where the last four went, and the waiting lists are the longest in these islands for another year.',
      },
      {
        label: 'Ask for it to be deferred for a costed ambulance plan',
        effects: { stats: { competence: 2, partyStanding: 1, constituencyApproval: -1 } },
        outcomeText: 'A reasonable request that buys six months and one more plan. The Health Minister knows what you have done and says so, gently, in the corridor. The closure comes anyway, and you can tell the hall you got the extra ambulances, which is true.',
      },
    ],
  },
  {
    id: 'ni_fiscal_framework',
    title: 'The offer from the Treasury',
    body: 'The Treasury has offered the Executive a new fiscal framework: the block grant topped up to the level an independent council says {nation} actually needs, in return for a plan to raise revenue locally. The plan can be rates, prescription charges, university fees or water, each of them something somebody at the table has promised never to do. The Finance Minister wants the Executive to agree a list on Thursday. Every possible list hurts a party’s own voters, and the money is real.',
    tags: ['policy', 'serious'],
    weight: 10, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Back a list, and put your own party’s sacred cow on it',
        effects: { stats: { integrity: 3, competence: 3, partyStanding: -4 } },
        outcomeText: 'You say a party that will not raise a penny should not complain about the pounds. The list goes to London with something of yours on it, the framework is signed, and {nation}’s budget is set by need for the first time. Your group meets without you to discuss it.',
      },
      {
        label: 'Back a list made of other parties’ cows',
        effects: { stats: { partyStanding: 3, competence: 1, integrity: -2 } },
        outcomeText: 'Every item on your list is a thing someone else promised to protect. So is every item on theirs. The Executive meets for six hours and produces no list; the offer lapses; the Finance Minister says, in public, that one party in particular was unhelpful, and does not need to name it.',
      },
      {
        label: 'Refuse the framework on principle',
        effects: { stats: { partyStanding: 2, profile: 1, competence: -2 } },
        outcomeText: 'You say need should be funded without conditions, which is the Executive’s position, and the Treasury’s reply is that it has been hearing that for twenty years. The money stays in London. The waiting lists stay where they are.',
      },
    ],
  },
  {
    id: 'ni_british_irish_council',
    title: 'The summit on the island',
    body: 'The British-Irish Council meets this summer in Guernsey, and your department’s sectoral work is on the agenda, alongside a plenary with the Prime Minister, the Taoiseach, the First Ministers from Edinburgh and Cardiff and the Chief Ministers of three Crown dependencies. It is two days in a hotel with sea views. {journalist} has already requested the costs. It is also the one room in which {nation} sits as an equal with every government in these islands, and that happens once a year.',
    tags: ['policy', 'funny'],
    weight: 8, cooldownDays: 600,
    requires: { arena: ['ni'], minTier: 4, inGovernment: true, executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Go, and come back with something',
        effects: { stats: { competence: 3, profile: 1, constituencyApproval: -1 } },
        outcomeText: 'You spend two days in a hotel and twenty minutes in a corridor with a Treasury minister who could not otherwise be got, and come home with a line about {department}’s capital budget that saves a scheme. The expenses story runs. The scheme does not need to.',
      },
      {
        label: 'Send officials and save the fare',
        effects: { stats: { integrity: 1, partyStanding: 1, competence: -1 } },
        outcomeText: 'Three officials go, take notes, and return. The communiqué notes {nation}’s absence at ministerial level. The Treasury minister spends the corridor with someone from Cardiff, who comes home with a line.',
      },
      {
        label: 'Go, and take the press with you',
        effects: { stats: { profile: 3, competence: -1, constituencyApproval: 1 } },
        outcomeText: 'You invite {journalist} along and show them the working day: eleven hours of sessions and a sandwich. The piece is fair. The photograph the paper uses is of the hotel.',
      },
    ],
  },

  // ── more for the First Minister ────────────────────────────────────────
  {
    id: 'ni_joint_appearance',
    title: 'Where the two chairs go',
    body: 'The deputy First Minister’s office has proposed that the two of you appear together at an event your party has never attended: a match, a service, a commemoration, the kind of occasion that is somebody else’s calendar. The proposal is framed as leadership, and it is also a trap, since the photograph will be used by their side as a concession and by yours as one too. The return invitation, to something of yours, has been left unspoken. The event is Sunday.',
    tags: ['party', 'personal', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { arena: ['ni'], leaderRole: ['pm'], executiveStatus: ['formed'] },
    choices: [
      {
        label: 'Go, together',
        effects: { stats: { integrity: 3, profile: 3, partyStanding: -4, competence: 1 } },
        outcomeText: 'You go. The photograph is on every front page, and it is, whatever anyone says about it, a photograph of two people standing in the same place. Your party’s group meets on Monday without the usual courtesies. The return invitation arrives the week after, and is accepted.',
      },
      {
        label: 'Go together, but somewhere of your choosing',
        effects: { stats: { competence: 3, partyStanding: 1, profile: 1 } },
        outcomeText: 'You counter-propose a children’s hospice that both communities use, and the two of you go there instead. It is a smaller photograph and a safer one, and the deputy First Minister’s office notes that you negotiate even your own gestures. The hospice is glad of the visit.',
      },
      {
        label: 'Decline',
        effects: { stats: { partyStanding: 2, integrity: -1, profile: -1 } },
        outcomeText: 'You send a note that the diary does not allow it. The deputy First Minister goes alone, and is photographed alone, and the empty space beside them is the story. Your party is relieved. Nobody else is.',
      },
    ],
  },
];
