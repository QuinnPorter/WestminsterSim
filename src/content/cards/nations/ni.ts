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
];
