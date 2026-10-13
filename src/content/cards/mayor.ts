import { DecisionCard } from '../../types/content';

/** Life as a directly elected mayor: out of the Commons, running a city region
 *  with real powers over transport, housing, policing and skills and no whips in
 *  the building. Every card requires `mayor: true` and nothing else reads it,
 *  so the deck never leaks into a sitting member's hand. {mayoralty} is the
 *  office ("Mayor of Greater Manchester"), {city} the place ("Greater
 *  Manchester"). `constituencyApproval` stands in for the mayor's approval. */
export const MAYOR_CARDS: DecisionCard[] = [
  {
    // always eligible: the term's quiet stretches, when nothing else is due.
    // mayorTick lets it run the clock a quarter at a time.
    id: 'mayor_quiet_quarter',
    title: 'A quarter at City Hall',
    body: 'Three months of the job as it mostly is: a bus timetable, a planning committee, a ribbon, a budget line, a letter to a minister that will be answered by somebody else. {city} does not know how quiet it has been, which is the point.',
    tags: ['personal'],
    weight: 2, cooldownDays: 0,
    requires: { mayor: true },
    choices: [
      {
        label: 'Get out and about',
        effects: { stats: { constituencyApproval: 1 } },
        outcomeText: 'Schools, depots, a food bank, the opening of a roundabout. People in {city} start to recognise you in the way they recognise the weather.',
      },
      {
        label: 'Get the paperwork done',
        effects: { stats: { competence: 1 } },
        outcomeText: 'The budget balances, the plan is published, the letters are answered. Nobody notices, which in this job is a compliment.',
      },
    ],
  },
  {
    id: 'mayor_bus_franchising',
    title: 'Take the buses back',
    body: 'Your transport officials have the plan ready: bring {city}’s buses under public control, set the routes and fares yourself, and take the financial risk off the operators and onto the authority. The operators have lawyers. The passengers have had thirty years of this. The Treasury has a view on the risk.',
    tags: ['policy', 'serious'],
    weight: 14, cooldownDays: 900, oncePerCareer: true,
    requires: { mayor: true },
    choices: [
      {
        label: 'Franchise the lot, and cap the fare',
        effects: { stats: { constituencyApproval: 6, profile: 5, competence: 2 }, addHeadline: 'The mayor takes the region’s buses into public control' },
        outcomeText: 'The yellow buses arrive with your fare cap on the side of them, and for a year every national interview you give is about buses. The operators sue and lose. The timetable is yours now, which means so is every late bus.',
      },
      {
        label: 'A partnership with the operators instead',
        effects: { stats: { competence: 3, constituencyApproval: 1, partyStanding: -2 } },
        outcomeText: 'You get a joint ticket and a joint logo and most of what the officials wanted, without the risk. The campaigners call it a sell-out. The buses are a bit better, which nobody marches about.',
      },
      {
        label: 'Not this term',
        effects: { stats: { constituencyApproval: -3, competence: -1 } },
        outcomeText: 'You park it, and the parking is noticed. The bus campaign gets a bigger banner and your name on it.',
      },
    ],
  },
  {
    id: 'mayor_housing_target',
    title: 'The housing number',
    body: 'Whitehall has given {city} a housing target and a cheque that covers about a third of it. The councils in your area want the cheque and not the target; the developers want the green belt; the people who write to you want somewhere to live that costs less than their salary. You have to publish a plan with a number in it.',
    tags: ['policy', 'serious'],
    weight: 13, cooldownDays: 700,
    requires: { mayor: true },
    choices: [
      {
        label: 'Build on the edges, and say so',
        effects: { stats: { competence: 3, profile: 2, constituencyApproval: -3 } },
        outcomeText: 'You release the land and take the protest. Twenty thousand homes start, which is more than any of your predecessors managed, and the villages on the edge of {city} will never vote for you again.',
      },
      {
        label: 'Brownfield only, and fight the target',
        effects: { stats: { constituencyApproval: 4, competence: -1, partyStanding: 1 } },
        outcomeText: 'You promise not a blade of green belt grass and you mean it. The number falls short by half. The minister writes you a letter about ambition, which you frame.',
      },
      {
        label: 'Hand the number to the councils',
        effects: { stats: { competence: -2, integrity: -1 } },
        outcomeText: 'Ten councils, ten plans, one target nobody owns. The developers play them off against each other and the mayoralty looks like what its critics said it was: a logo.',
      },
    ],
  },
  {
    id: 'mayor_treasury_devolution_deal',
    title: 'The deal with the Treasury',
    body: 'The Chancellor’s people are offering {city} a new devolution deal: a single pot, a longer settlement, control over the adult skills budget. In return they want a fiscal target you did not choose and a quarterly meeting in which you are, in effect, marked. {pm}’s government would announce it as its own idea.',
    tags: ['policy', 'westminster', 'serious'],
    weight: 12, cooldownDays: 1000,
    requires: { mayor: true },
    choices: [
      {
        label: 'Sign it and share the stage',
        effects: { stats: { competence: 4, profile: 3, partyStanding: -2 } },
        outcomeText: 'You stand next to a minister you spent years attacking and hold a piece of card with a number on it. Your party grumbles. {city} gets the money, which is what you are for now.',
      },
      {
        label: 'Hold out for more',
        effects: { stats: { profile: 2, competence: -1, constituencyApproval: 1 } },
        outcomeText: 'You walk out of the second meeting and brief that you did. The deal comes back three months later, slightly better and considerably later, and both sides claim it.',
      },
      {
        label: 'Refuse, and say why on television',
        effects: { stats: { profile: 5, partyStanding: 4, competence: -3 } },
        outcomeText: 'You call it a bribe with strings and you get the clip. {city} does not get the money. The other mayors sign theirs and look, briefly, more useful than you.',
      },
    ],
  },
  {
    id: 'mayor_tram_strike',
    title: 'The trams stop',
    body: 'The drivers on {city}’s light rail have voted to strike over a pay offer the operator says is final. The operator is a contractor; the contract is yours. The unions say you can settle it with a phone call. The operator says a phone call would cost the authority nine million a year. It is the week of the party conference.',
    tags: ['crisis', 'policy'],
    weight: 12, cooldownDays: 600,
    requires: { mayor: true },
    choices: [
      {
        label: 'Get in the room and settle it',
        effects: { stats: { constituencyApproval: 4, competence: 2, partyStanding: 2 } },
        outcomeText: 'Fourteen hours in a hotel conference room and a deal the operator can live with and the drivers can vote for. The trams run on the Monday. The nine million comes from somewhere, which is to say from you.',
      },
      {
        label: 'It is the operator’s dispute',
        effects: { stats: { competence: 1, constituencyApproval: -4, partyStanding: -3 } },
        outcomeText: 'You say what the contract says. The strike runs for eleven days and your face is on the placards anyway, because nobody in {city} knows who the operator is.',
      },
      {
        label: 'Back the drivers publicly',
        effects: { stats: { partyStanding: 5, profile: 3, competence: -2 } },
        outcomeText: 'You join the picket line for a photograph that your party loves and your chief executive hates. The operator settles, charges the authority, and sends you the invoice with a note.',
      },
    ],
  },
  {
    id: 'mayor_national_conference_slot',
    title: 'The conference speech',
    body: 'The party wants you on the conference main stage: the mayor who actually runs something, the regional success story, twenty minutes before the leader. Your speechwriter has a draft that mentions {city} eleven times and the leader once. The leader’s office has sent over some suggested lines about the leader.',
    tags: ['party', 'media'],
    weight: 11, cooldownDays: 365,
    requires: { mayor: true },
    choices: [
      {
        label: 'Give the speech about {city}',
        effects: { stats: { profile: 5, constituencyApproval: 2, partyStanding: -2 } },
        outcomeText: 'The hall stands for the bit about the buses, and the papers ask the question you have been careful not to answer: is this a mayor, or a candidate for something else?',
      },
      {
        label: 'Give the speech about the leader',
        effects: { stats: { partyStanding: 5, profile: 1 } },
        outcomeText: 'Loyal, warm, forgettable. The leader’s office is grateful, which is a currency, and the hall is polite, which is not.',
      },
      {
        label: 'Send apologies: the city needs you',
        effects: { stats: { constituencyApproval: 3, partyStanding: -4 } },
        outcomeText: 'You open a bridge instead and the local paper loves it. The party notes that you did not come. Parties remember who did not come.',
      },
    ],
  },
  {
    id: 'mayor_police_chief',
    title: 'The chief constable',
    body: 'The chief constable of {city}’s force, whom you appoint and can remove, has given an interview describing your policing plan as “a document”. Crime is down a little and confidence in the force is down a lot. The police federation has written to you. So has the Home Secretary, in the tone of somebody who used to do your job.',
    tags: ['policy', 'crisis'],
    weight: 11, cooldownDays: 800,
    requires: { mayor: true },
    choices: [
      {
        label: 'Back the chief in public, deal with it in private',
        effects: { stats: { competence: 3, integrity: 1, profile: -1 } },
        outcomeText: 'A joint statement, a difficult lunch, a plan with the same words in a different order. It holds, and nobody outside the building knows what it cost.',
      },
      {
        label: 'Remove the chief constable',
        effects: { stats: { profile: 5, constituencyApproval: 2, competence: -2 }, addHeadline: 'The mayor removes the chief constable' },
        outcomeText: 'You use the power you were given and the row lasts a month. The new chief is grateful and careful. The old one writes a book.',
      },
      {
        label: 'Call for a public inquiry into the force',
        effects: { stats: { profile: 3, integrity: 3, competence: -3 } },
        outcomeText: 'An inquiry into a force you oversee is an inquiry into you, which your opponents point out before you have finished the sentence. It reports in three years and finds that everybody should have done better.',
      },
    ],
  },
  {
    id: 'mayor_flood',
    title: 'The river comes up',
    body: 'Three days of rain and half of {city}’s low ground is under water. The emergency plan is working and the cameras want a face in a hi-vis jacket. The government has sent a junior minister who is standing in the wrong place. The thing people will remember is who turned up, and where.',
    tags: ['crisis', 'serious'],
    weight: 12, cooldownDays: 900,
    requires: { mayor: true },
    choices: [
      {
        label: 'Wellies on, every day until it drains',
        effects: { stats: { constituencyApproval: 6, profile: 4, competence: 1 } },
        outcomeText: 'You are in the pictures and in the sandbag lines, and when the minister leaves you are still there. {city} notices. So does the party, which starts using the photographs.',
      },
      {
        label: 'Run it from the control room',
        effects: { stats: { competence: 4, constituencyApproval: 1, profile: -1 } },
        outcomeText: 'The pumps go where the maps say and the shelters open before they are needed. It is the best-run flood the region has had, and nobody will ever know, because the pictures are of the minister.',
      },
      {
        label: 'Blame the government for the defences',
        effects: { stats: { profile: 3, partyStanding: 3, constituencyApproval: -2, integrity: -1 } },
        outcomeText: 'You hold the press conference about the money that was cut, in front of a house that was flooded. It is true and it is early, and the people in the house would have liked a sandbag first.',
      },
    ],
  },
  {
    id: 'mayor_precept',
    title: 'The mayoral precept',
    body: 'The budget will not balance without raising the mayoral precept on {city}’s council tax bills: a few pounds a month that pays for the police officers you promised and the bus fare you capped. Your opponents call it the mayor’s tax. Your finance director calls it arithmetic.',
    tags: ['policy'],
    weight: 10, cooldownDays: 400,
    requires: { mayor: true },
    choices: [
      {
        label: 'Raise it, and say what it buys',
        effects: { stats: { competence: 3, constituencyApproval: -3, integrity: 2 } },
        outcomeText: 'You put the officers and the fare cap on the leaflet next to the figure. The row lasts a fortnight and then the bills arrive and the row is over, because people can see the buses.',
      },
      {
        label: 'Freeze it and cut the programmes',
        effects: { stats: { constituencyApproval: 1, competence: -2, partyStanding: -2 } },
        outcomeText: 'The precept stays flat and the youth service does not. The opposition group that demanded the freeze now demands the youth service. That is what opposition groups are for.',
      },
    ],
  },
  {
    id: 'mayor_investment_summit',
    title: 'The investment summit',
    body: 'Your officials have booked the biggest hall in {city} for an investment summit: sovereign wealth funds, a Japanese car maker, a man who wants to build a data centre the size of a small town. {pm}’s trade minister wants to come and claim it. Your opponents want to know what you have promised anyone to get them in the room.',
    tags: ['policy', 'media'],
    weight: 10, cooldownDays: 700,
    requires: { mayor: true },
    choices: [
      {
        label: 'Share the stage with the minister',
        effects: { stats: { competence: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'The minister announces your numbers and you let them. Two of the deals are real, which is a good rate. The data centre wants a river.',
      },
      {
        label: 'Keep it the city’s show',
        effects: { stats: { profile: 4, constituencyApproval: 2, competence: 1 } },
        outcomeText: 'The minister is invited to the dinner and not the stage. {city}’s name is on everything. One of the deals is real, and the car maker sends a very polite letter about the roads.',
      },
      {
        label: 'Cancel it: the optics are poor',
        effects: { stats: { integrity: 2, competence: -2, profile: -2 } },
        outcomeText: 'You call off a summit nobody had heard of and the only coverage is of the cancellation. Caution, it turns out, also has optics.',
      },
    ],
  },
  {
    id: 'mayor_council_leaders_revolt',
    title: 'The council leaders',
    body: 'The leaders of {city}’s councils sit on your combined authority and three of them have decided they would rather you did not. They have blocked the transport plan, leaked the budget and briefed that the mayoralty was a mistake. Two of them are in your party. The powers are yours; the votes are theirs.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 600,
    requires: { mayor: true },
    choices: [
      {
        label: 'Buy them off, one project each',
        effects: { stats: { competence: 2, integrity: -2, constituencyApproval: 1 } },
        outcomeText: 'A station here, a bypass there, a leisure centre with a name on it. The plan passes with everything in it and a little more. This is how cities were always run; you had simply hoped not to.',
      },
      {
        label: 'Go over their heads to their voters',
        effects: { stats: { profile: 4, constituencyApproval: 3, partyStanding: -4 } },
        outcomeText: 'You tour the three boroughs and name the people blocking the trams. The plan passes. The two in your party will never forget it, and they have a vote in the next selection.',
      },
      {
        label: 'Ask the party to lean on its two',
        effects: { stats: { partyStanding: 2, competence: 1, profile: -1 } },
        outcomeText: 'A call from the leader’s office does what a year of meetings did not. The plan passes. You now owe the leader’s office, which was the point of the call.',
      },
    ],
  },
  {
    id: 'mayor_adviser_scandal',
    title: 'The adviser',
    body: 'Your chief of staff, who ran your campaign and runs your diary, turns out to have been running a consultancy on the side with two of the developers your planning committee waved through. {journalist} has the invoices. Nothing you did was wrong; everything you did was signed off by someone who was being paid.',
    tags: ['scandal', 'crisis'],
    weight: 10, cooldownDays: 1200, oncePerCareer: true,
    requires: { mayor: true },
    choices: [
      {
        label: 'Sack them within the hour',
        effects: { stats: { integrity: 4, competence: -2, constituencyApproval: -2 }, relationships: [{ kind: 'journalist', delta: 4 }] },
        outcomeText: 'A statement before the story runs, an empty office by lunchtime, a planning review you did not want. The story is one day long. The diary is chaos for a year.',
      },
      {
        label: 'Suspend them and order an inquiry',
        effects: { stats: { integrity: 1, competence: 1, profile: -2 } },
        outcomeText: 'Due process, which takes four months and is reported every week. The inquiry finds what the invoices found. The adviser resigns the day before it is published, which looks like what it is.',
      },
      {
        label: 'Stand by them',
        effects: { stats: { integrity: -6, partyStanding: -3, constituencyApproval: -5 } },
        outcomeText: 'Loyalty is a virtue right up until the second set of invoices. They go in the end, and so does a good deal of what people thought about you.',
      },
    ],
  },
  {
    id: 'mayor_westminster_rumour',
    title: 'The Westminster whisper',
    body: 'A profile in a Sunday paper calls you the most popular politician in your party who is not in Parliament, and wonders aloud when that will change. {journalist} says the piece came from somebody in the leader’s office. Your own staff would like to know whether they should be looking for seats or for a second term.',
    tags: ['media', 'party', 'westminster'],
    weight: 9, cooldownDays: 700,
    requires: { mayor: true },
    choices: [
      {
        label: 'Rule nothing out',
        effects: { stats: { profile: 4, constituencyApproval: -2, partyStanding: 1 } },
        outcomeText: 'You say the job in front of you is {city}, in a tone that everybody hears as “for now”. The speculation is good for your profile and bad for your planning committee, which starts to wonder who will be chairing it.',
      },
      {
        label: 'Rule it out, flatly',
        effects: { stats: { constituencyApproval: 4, integrity: 2, profile: -2 } },
        outcomeText: 'You say you will serve the term and you mean it, and the city believes you, and the party files it under things it can quote back to you later.',
      },
      {
        label: 'Have a quiet word with the leader’s office',
        effects: { stats: { partyStanding: 3, profile: 1 } },
        outcomeText: 'The briefing stops. What replaces it is an understanding, which is more dangerous than a briefing because nobody wrote it down.',
      },
    ],
  },
  {
    id: 'mayor_clean_air_zone',
    title: 'The clean air zone',
    body: 'The courts have told {city} to cut its air pollution and your officials have a map with a charging zone on it. The vans, the taxis and the older cars of people who cannot afford newer ones pay to drive into the centre. The lungs of the children in the schools along the ring road do not get a vote, which is the argument, and the drivers do, which is the other argument.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 900, oncePerCareer: true,
    requires: { mayor: true },
    choices: [
      {
        label: 'Bring in the zone, with a scrappage scheme',
        effects: { stats: { competence: 3, integrity: 2, constituencyApproval: -4, profile: 2 } },
        outcomeText: 'The cameras go up and the protests go up with them. The air gets measurably cleaner within the year and nobody thanks you for a thing they cannot see. The scrappage money runs out in March.',
      },
      {
        label: 'Delay it and ask the government for the money',
        effects: { stats: { constituencyApproval: 2, competence: -2 } },
        outcomeText: 'You write the letter and the government writes back, and the exchange of letters becomes a policy. The court gives you another year. The children on the ring road get another year too.',
      },
      {
        label: 'Scrap the charge: clean the buses instead',
        effects: { stats: { constituencyApproval: 3, competence: -1, integrity: -1 } },
        outcomeText: 'Electric buses, which you were buying anyway, and no charge, which the drivers cheer. The court is not satisfied and says so. Neither is the air.',
      },
    ],
  },
  {
    id: 'mayor_football_club',
    title: 'The club',
    body: '{city}’s football club, the one half the region supports and the other half resents, is about to be sold to a consortium nobody can quite identify. The supporters’ trust wants you to block the stadium lease. The consortium wants a photograph with you. The club wants to be left alone, and is forty million in debt.',
    tags: ['constituency', 'funny'],
    weight: 9, cooldownDays: 1000,
    requires: { mayor: true },
    choices: [
      {
        label: 'Back the supporters’ trust',
        effects: { stats: { constituencyApproval: 4, profile: 2, competence: -1 } },
        outcomeText: 'You refuse to sign the lease until the fans have a seat on the board. The consortium walks. The club is still forty million in debt, and the fans have a seat from which to watch it.',
      },
      {
        label: 'Take the photograph',
        effects: { stats: { profile: 3, integrity: -2, constituencyApproval: -2 } },
        outcomeText: 'You smile with men whose names you still do not know. The sale goes through, the ground gets a roof, and for two seasons it looks like a good decision. Then it does not.',
      },
      {
        label: 'It is a football club, not a bus route',
        effects: { stats: { competence: 2, constituencyApproval: -1 } },
        outcomeText: 'You say it is not the mayor’s business, which is true and which no mayor has ever said out loud. The sale goes through without you. On match days you are reminded, at volume, that you said it.',
      },
    ],
  },
];
