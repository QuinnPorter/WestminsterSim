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
  {
    id: 'mayor_bed_every_night',
    title: 'A bed every night',
    body: 'Rough sleeping in {city} has doubled since you took office, which is not your fault and is your problem. Your officials have costed a scheme: a bed, a hot meal and a caseworker for anyone on the streets, every night of the year, no questions about local connection. The councils say it will draw people in from everywhere else. The charities say it is the first serious thing anyone has proposed. The money would come from the fare cap’s contingency.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 800,
    requires: { mayor: true },
    choices: [
      {
        label: 'Open the beds, every night',
        effects: { stats: { constituencyApproval: 3, integrity: 3, profile: 2, competence: -1 } },
        outcomeText: 'The count on the streets falls by a third in the first winter, and a reporter comes up from London to write about it. The councils were right too: people arrive from Lancashire and Cheshire and further, and the beds are full by October. The contingency is gone.',
      },
      {
        label: 'Winter only, and local connection applies',
        effects: { stats: { competence: 2, constituencyApproval: 1, integrity: -1 } },
        outcomeText: 'A scheme that works from November to March and turns away a man from Stoke in April. The charities use the word “rationing” and the finance director uses the word “sustainable”. Both are accurate.',
      },
      {
        label: 'It is the councils’ statutory duty',
        effects: { stats: { competence: -2, constituencyApproval: -3, integrity: -2 } },
        outcomeText: 'You are right about the law and wrong about the job. The councils do what they can, which is a leaflet and a phone number. The doorways of {city}’s centre stay occupied, and so, in the public mind, do you.',
      },
    ],
  },
  {
    id: 'mayor_cancelled_rail_leg',
    title: 'The line that was promised',
    body: 'The Prime Minister has cancelled the rail line to {city} that three governments promised, and {pm}’s people have announced that the money will go on “local transport priorities” instead, to be set by you. It is a bribe with a map. The business lobby wants you to fight for the line; your transport team wants to spend the money before somebody in the Treasury remembers it; the other mayors want a joint front, which means waiting for them.',
    tags: ['policy', 'westminster', 'crisis'],
    weight: 13, cooldownDays: 1000, oncePerCareer: true,
    requires: { mayor: true },
    choices: [
      {
        label: 'Take the money and spend it fast',
        effects: { stats: { competence: 4, constituencyApproval: 2, profile: 1, partyStanding: -2 } },
        outcomeText: 'Tram extensions, a bus station, a station roof that has leaked since 1987: all funded, all yours. The business lobby calls it a betrayal of the region’s ambition. The region, which has to get to work on Tuesday, finds the trams more use than the ambition.',
      },
      {
        label: 'Refuse it and fight for the line',
        effects: { stats: { profile: 5, partyStanding: 3, competence: -2, constituencyApproval: -1 }, addHeadline: 'The mayor rejects the government’s rail money and demands the line be built' },
        outcomeText: 'You hold the press conference at the fenced-off site, in a hard hat, with no digger. The line stays cancelled. The money sits in a Treasury account for two years and then, quietly, goes to Kent.',
      },
      {
        label: 'Hold out for a joint deal with the other mayors',
        effects: { stats: { profile: 2, competence: 1, constituencyApproval: -1 } },
        outcomeText: 'Seven mayors, three parties, one letter, which takes eleven weeks to agree a verb. The government gives the group a slightly larger pot and a committee. {city} gets its share a year late, with somebody else’s logo on the announcement.',
      },
    ],
  },
  {
    id: 'mayor_skills_budget',
    title: 'The skills budget',
    body: 'The adult skills budget for {city} is yours now: a hundred million pounds a year that used to be spent by a quango in Coventry on courses nobody finished. The colleges want it as a block grant. The employers want it spent on the things they used to pay for themselves. Your officials want a bootcamp scheme with a name. The one thing everyone agrees on is that the quango did it badly, which is a low bar to be measured against.',
    tags: ['policy'],
    weight: 10, cooldownDays: 700,
    requires: { mayor: true },
    choices: [
      {
        label: 'Give the colleges the grant',
        effects: { stats: { constituencyApproval: 2, competence: 1, partyStanding: 1 } },
        outcomeText: 'The colleges are grateful and the principals say so at length. The completion rates go up a little, because the colleges now report them. The employers stop coming to your meetings, which you notice a year later.',
      },
      {
        label: 'Spend it on what employers say they need',
        effects: { stats: { competence: 3, profile: 1, constituencyApproval: -1, integrity: -1 } },
        outcomeText: 'Welding, care, logistics, data: short courses with jobs at the end of them. It works, and the colleges tell the local paper that the mayor has handed public money to private companies, which is one way of describing a job.',
      },
      {
        label: 'Launch the bootcamps',
        effects: { stats: { profile: 3, competence: -2 } },
        outcomeText: 'A name, a launch, a minister in a hi-vis vest. The first cohort is eighty people, the target was eight hundred, and the evaluation uses the phrase “early-stage learning”. The quango in Coventry sends a note of sympathy.',
      },
    ],
  },
  {
    id: 'mayor_levelling_up_bids',
    title: 'The bidding round',
    body: 'The Levelling Up Fund is open again and the ten councils of {city} are each preparing a bid, against each other and against every other town in England, for a pot that will fund perhaps one in five of them. Each bid costs a council a quarter of a million in consultants. Whitehall would like the mayor to “co-ordinate”. The council leaders would like the mayor to back their bid, singular, and have each made that clear in writing.',
    tags: ['policy', 'westminster'],
    weight: 10, cooldownDays: 600,
    requires: { mayor: true },
    choices: [
      {
        label: 'Rank the bids and send one list',
        effects: { stats: { competence: 3, integrity: 1, constituencyApproval: -2 } },
        outcomeText: 'You put the town with the worst high street first and the leader of the town placed ninth stops returning calls. Two bids win, which is a good rate and which the eight losers attribute to the ranking rather than to arithmetic.',
      },
      {
        label: 'Back every bid equally',
        effects: { stats: { constituencyApproval: 1, partyStanding: 1, competence: -2 } },
        outcomeText: 'Ten letters of support, each describing a different project as the region’s top priority. Whitehall notices, and funds one. The consultants, at least, have had a good year.',
      },
      {
        label: 'Refuse to play: demand the money as a block',
        effects: { stats: { profile: 3, integrity: 2, competence: -1, constituencyApproval: -1 } },
        outcomeText: 'You call the fund a beauty contest run by people who have never been to {city}, which is accurate and gets you on the radio. The councils bid anyway, without you, and one of them wins, and its leader thanks the minister.',
      },
    ],
  },
  {
    id: 'mayor_airport_expansion',
    title: 'The second runway',
    body: 'The combined authority owns a third of {city}’s airport, which pays a dividend that props up the bus network and wants to build a second runway. The airport’s board has the plans and a forecast. The climate campaigners have the science and your manifesto, which they are quoting. The villages under the flight path have a solicitor. The unions have ten thousand jobs on a banner. The dividend is nine million a year and rising.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 1000,
    requires: { mayor: true },
    choices: [
      {
        label: 'Back the runway, for the jobs and the dividend',
        effects: { stats: { competence: 2, constituencyApproval: 2, profile: 1, integrity: -3 } },
        outcomeText: 'The planes come and so does the money, and the buses keep running on it. Your manifesto is read aloud outside your office by students who will be voting for a long time. {party}’s green wing adds you to a list.',
      },
      {
        label: 'Oppose it as a shareholder',
        effects: { stats: { integrity: 4, profile: 2, competence: -2, constituencyApproval: -2 }, addHeadline: 'The mayor votes against expanding the region’s own airport' },
        outcomeText: 'You use the authority’s shares to block the board, which has never happened and which the board’s lawyers say may not be possible. The runway is shelved. The dividend forecast is revised down and the bus budget with it, which nobody marches about.',
      },
      {
        label: 'Order a review and a consultation',
        effects: { stats: { competence: 1, profile: -1, integrity: -1 } },
        outcomeText: 'Eighteen months, two consultancies, four thousand responses. The review says the runway is good for the economy and bad for the climate, which you knew, and recommends a decision, which is what you had hoped it would make for you.',
      },
    ],
  },
  {
    id: 'mayor_royal_visit',
    title: 'The visit',
    body: 'A member of the royal family is coming to {city} to open the interchange you spent four years building, and the Palace’s advance party has arrived with a running order in which you appear once, at the end, for the handshake. {pm}’s office has asked whether the Prime Minister might also come, and has made clear that it is not a question. The local paper has cleared the front page. Your press officer would like to know what the picture is going to be.',
    tags: ['media', 'funny'],
    weight: 9, cooldownDays: 500,
    requires: { mayor: true },
    choices: [
      {
        label: 'Follow the running order',
        effects: { stats: { constituencyApproval: 2, partyStanding: 1, profile: 1 } },
        outcomeText: 'You stand at the end of the line and shake the hand, and the front page is the royal and the interchange, which is what the interchange deserved. The Prime Minister stands next to you in the one photograph of you, and it is captioned with their name.',
      },
      {
        label: 'Rewrite the running order',
        effects: { stats: { profile: 3, constituencyApproval: 1, competence: -1, partyStanding: -1 } },
        outcomeText: 'You give a speech before the ribbon in which the words “this region built this” appear four times. The Palace is too polite to object and the Prime Minister’s office is not. The picture is you, which was the point, and the royal checking a watch, which was not.',
      },
      {
        label: 'Decline the Prime Minister, politely',
        effects: { stats: { constituencyApproval: 3, profile: 2, partyStanding: -3 } },
        outcomeText: 'You tell Downing Street the running order is the Palace’s and the Palace, when asked, agrees with you. The Prime Minister does not come. {city} enjoys that enormously. Your party’s leadership, which may one day need Downing Street’s goodwill, does not.',
      },
    ],
  },
  {
    id: 'mayor_development_corporation',
    title: 'The development corporation',
    body: 'You can designate a Mayoral Development Corporation over the old industrial land east of {city}’s centre: planning powers lifted from the council and handed to a board you appoint, one landowner where there were ninety, a thirty-year plan. It is how the Olympic Park happened and how the Docklands happened, and the people who live on the edge of the land remember how the Docklands happened. The council leader whose borough it is has not been consulted, and knows.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 900,
    requires: { mayor: true },
    choices: [
      {
        label: 'Designate it, and take the planning powers',
        effects: { stats: { competence: 4, profile: 2, constituencyApproval: -2, partyStanding: -1 } },
        outcomeText: 'The board meets, the masterplan is published, and the first crane goes up within two years, which in English planning is a miracle. The council leader calls it a coup, in your party’s newspaper, and the residents’ association puts your face on a poster with the word “Docklands”.',
      },
      {
        label: 'Set it up with the council as a partner',
        effects: { stats: { competence: 2, constituencyApproval: 1, profile: -1 } },
        outcomeText: 'A joint board, a joint chair, a joint veto. It is slower and it is fairer and the first crane goes up in year five. The council leader gets a seat and a say, and uses both, at length.',
      },
      {
        label: 'Leave planning with the borough',
        effects: { stats: { constituencyApproval: 1, competence: -3 } },
        outcomeText: 'Ninety landowners, one council, no plan. The land east of the centre stays a scrapyard with potential, as it has been since 1981, and the developers who were circling go to Birmingham, where the mayor said yes.',
      },
    ],
  },
  {
    id: 'mayor_council_of_mayors',
    title: 'The council of mayors',
    body: 'The metro mayors meet quarterly, on a Thursday, in a room the Cabinet Office finds for them, and {pm} has agreed to attend the next one. The mayors of the other party want a joint statement on funding that would embarrass the government. Your own party’s mayors want nothing said that would embarrass the leader, who may be the government next. {mentor} says the club is the most useful thing in your diary. The club is a WhatsApp group with a coat of arms.',
    tags: ['party', 'westminster'],
    weight: 10, cooldownDays: 500,
    requires: { mayor: true },
    choices: [
      {
        label: 'Sign the joint statement',
        effects: { stats: { profile: 3, competence: 2, partyStanding: -3 } },
        outcomeText: 'Seven mayors of three parties and one letter about fair funding, and the government cannot call it partisan because it is not. The Treasury moves a little. Your leader’s office asks, in writing, who authorised you to stand next to the opposition.',
      },
      {
        label: 'Water it down until everyone can sign',
        effects: { stats: { competence: 1, partyStanding: 1, profile: -1 } },
        outcomeText: 'A statement that calls for “continued dialogue” and is signed by everybody and read by nobody. The club survives, which was your argument, and achieves nothing, which was theirs.',
      },
      {
        label: 'Walk out of the room',
        effects: { stats: { profile: 2, partyStanding: 2, competence: -2, constituencyApproval: -1 } },
        outcomeText: 'You leave before the vote and brief that the club has become a cabal. The clip plays well with the party and poorly in {city}, where people had assumed the mayors talking to each other was the point. You are not invited to the dinner.',
      },
    ],
  },
  {
    id: 'mayor_last_reporter',
    title: 'The last reporter',
    body: '{city}’s daily paper is cutting its political staff to one reporter, who will cover the combined authority, ten councils, the police and the football from a shared office in Reading. Your press team is quietly delighted: fewer awkward questions, more of your own videos. The one reporter has asked for a weekly sit-down interview, on the record, and has pointed out that without it the only scrutiny of the mayoralty will be {journalist}, who comes up from London twice a year to write about buses.',
    tags: ['media'],
    weight: 9, cooldownDays: 600,
    requires: { mayor: true },
    choices: [
      {
        label: 'Give the weekly interview',
        effects: { stats: { integrity: 3, profile: 1, constituencyApproval: 1, competence: -1 }, relationships: [{ kind: 'journalist', delta: 2 }] },
        outcomeText: 'Fifty-two interviews a year, two of which go badly and one of which goes very badly. The paper runs them on page five. People in {city} know what their mayor thinks about things, which turns out to be a form of accountability and also, occasionally, a problem.',
      },
      {
        label: 'Make your own media instead',
        effects: { stats: { profile: 3, constituencyApproval: 1, integrity: -2 } },
        outcomeText: 'A podcast, a newsletter, a video team of three. The numbers are good and every question in them is yours. The reporter writes a piece about a mayoralty that interviews itself, which is read by everyone in the building and nobody outside it.',
      },
      {
        label: 'Fund a local democracy reporter',
        effects: { stats: { competence: 2, integrity: 1, partyStanding: -1 } },
        outcomeText: 'The authority pays for a reporter it cannot control, through a trust it cannot instruct, and the first thing the reporter does is a story about the authority paying for a reporter. It is a good story. So are the next hundred.',
      },
    ],
  },
  {
    id: 'mayor_commonwealth_games',
    title: 'The Games',
    body: 'A city on another continent has pulled out of hosting the Commonwealth Games with three years to go, and the organisers have asked whether {city} would step in. The government would pay most of it; the authority would pay the rest, a sum your finance director has written down and underlined. There is a stadium that needs a roof, a velodrome that needs a reason, and a fortnight of the world’s attention. The last city that did this is still paying for it, and still pleased.',
    tags: ['policy', 'media'],
    weight: 10, cooldownDays: 1200, oncePerCareer: true,
    requires: { mayor: true },
    choices: [
      {
        label: 'Bid, and take the Games',
        effects: { stats: { profile: 6, constituencyApproval: 3, competence: -2 }, addHeadline: 'The mayor brings the Commonwealth Games to the region' },
        outcomeText: 'Three years of cranes and then eleven days in which everything works and {city} is on television looking like somewhere people might want to live. The bill is a third over. The velodrome has a reason. The stadium roof is yours now, forever.',
      },
      {
        label: 'Bid, but only on the government’s money',
        effects: { stats: { competence: 3, profile: 1, constituencyApproval: -1 } },
        outcomeText: 'You set a ceiling and hold it, and the organisers take the Games to a city that did not. The finance director frames your letter. {city} watches the opening ceremony from somewhere else, on a Friday night, and wonders.',
      },
      {
        label: 'Decline: there are buses to run',
        effects: { stats: { competence: 1, constituencyApproval: -2, profile: -2 } },
        outcomeText: 'Prudent, defensible and dull. The buses are no better for it, and the city that took the Games gets its station rebuilt on the government’s account. You find yourself explaining, for years, what the money you did not spend was spent on.',
      },
    ],
  },
  {
    id: 'mayor_fare_cap_bill',
    title: 'The cost of the cap',
    body: 'The bus fare cap was the best thing you did and it is now the most expensive: ridership is up a fifth, which was the aim, and every extra passenger costs the authority money, which was not on the leaflet. The gap is forty million this year. The operators’ contract says the risk is yours. {govparty}’s ministers, who have their own national cap to pay for, have declined to help and have said so in a tone.',
    tags: ['policy', 'crisis'],
    weight: 11, cooldownDays: 600,
    requires: { mayor: true },
    choices: [
      {
        label: 'Hold the cap and find the forty million',
        effects: { stats: { constituencyApproval: 4, competence: 1, integrity: 1, partyStanding: -1 } },
        outcomeText: 'The highways budget takes the hit and so does a tram extension that was two years away. The buses are full and cheap and the potholes on the ring road are a political issue by spring. You have chosen which complaint to receive.',
      },
      {
        label: 'Raise the cap by fifty pence',
        effects: { stats: { competence: 3, constituencyApproval: -3 } },
        outcomeText: 'Two pounds becomes two pounds fifty and ridership dips and recovers, as the modelling said it would. The headline is that the mayor’s promise has been broken, which is a fair description of a cap that has moved. The books balance.',
      },
      {
        label: 'Cut the quiet routes to pay for it',
        effects: { stats: { competence: -2, constituencyApproval: -4, integrity: -1 } },
        outcomeText: 'The cap holds in the centre and the evening buses to the estates on the edge of {city} stop at seven. The people who lose them were the people the cap was for. Someone makes that point at a public meeting, slowly, and it is filmed.',
      },
    ],
  },
];
