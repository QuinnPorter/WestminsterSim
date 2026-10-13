import { DecisionCard } from '../../types/content';

/**
 * Region-archetype constituency crises. Each is gated by `requires.region`
 * (checked against player.region in cardEngine) and turns on a real
 * local-vs-national trade-off specific to that kind of place. Distinct from
 * the generic constituency.ts cards, which are region-agnostic.
 */
export const REGION_CARDS: DecisionCard[] = [
  {
    id: 'rgn_north_steelworks',
    title: 'The last furnace',
    body: 'The steelworks that built half of {constituency} is down to one blast furnace and a foreign owner who wants to switch to cheaper imported slab. Whitehall will part-fund a green "electric arc" replacement — fewer jobs, but a future — or match the union\'s demand to prop up the old furnace for another decade.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 640,
    requires: { region: ['northEast', 'yorkshire', 'westMidlands'] },
    choices: [
      {
        label: 'Back the green transition',
        effects: { stats: { competence: 4, integrity: 2, constituencyApproval: -3 } },
        outcomeText: 'You argue for the electric arc furnace and a retraining fund, and you say the unsayable: the old way is not coming back. The town hears "job losses" and books you a hostile public meeting. Fifteen years from now it may thank you. Fifteen years is a long time in a marginal.',
      },
      {
        label: 'Fight to save the blast furnace',
        effects: { stats: { constituencyApproval: 5, profile: 3 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You stand at the gates with the union banner and demand the government keep the furnace lit. The subsidy is grudgingly found. The jobs survive this parliament; the carbon targets quietly do not, and the Treasury adds your name to a list.',
      },
      {
        label: 'Broker a phased deal',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'You spend three months in a room getting the owner, the union and a minister to agree a staged switch — old furnace warm while the new plant is built, no cliff-edge. Nobody gets a rally out of it, which is usually the mark of an actual solution.',
      },
    ],
  },
  {
    id: 'rgn_coastal_erosion',
    title: 'The cliff is moving',
    body: 'A row of clifftop houses in {constituency} is now metres from the edge, and the coastal defence budget will only stretch to protecting the town centre. The Environment Agency\'s official position is "managed realignment" — a polite phrase for letting the sea take the homes. The residents are outside your office with a solicitor.',
    tags: ['constituency', 'crisis', 'serious'],
    weight: 10, cooldownDays: 560,
    requires: { region: ['southWest'] },
    choices: [
      {
        label: 'Demand defences for the homes',
        effects: { stats: { constituencyApproval: 5, profile: 2 }, relationships: [{ kind: 'leader', delta: -1 }] },
        outcomeText: 'You reject the managed retreat and lobby hard for a sea wall that the engineers privately call a delaying tactic against geology. You win a few years and a great deal of gratitude. The tide, unbriefed, keeps its own counsel.',
      },
      {
        label: 'Fight for a fair buy-out instead',
        effects: { stats: { competence: 4, integrity: 3, constituencyApproval: -1 } },
        outcomeText: 'You accept that the cliff cannot be saved and instead win compensation and relocation for the families — the first coastal buy-out scheme of its kind. Honest, unglamorous, and precisely the thing that gets you called "the MP who gave up on us" by a placard.',
      },
    ],
  },
  {
    id: 'rgn_rural_bus',
    title: 'The last bus',
    body: 'The operator is cancelling the only bus route that stitches the villages of {constituency} to the market town — no profit in it, they say. For a farmer\'s widow without a car or a teenager wanting a college place, it is the difference between a life and an isolation. The council has no money and the fare box has no answer.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 540,
    requires: { region: ['east', 'eastMidlands'] },
    choices: [
      {
        label: 'Win a subsidised rural route',
        effects: { stats: { constituencyApproval: 5, competence: 2, partyStanding: -1 } },
        outcomeText: 'You lobby the department for a rural mobility grant and shame the operator into a scaled-back timetable. The bus survives, three days a week. It is a small win that means everything to a few hundred people the national conversation forgets exists.',
      },
      {
        label: 'Back a community minibus scheme',
        effects: { stats: { competence: 3, integrity: 2, constituencyApproval: 2 } },
        outcomeText: 'Rather than fight a losing subsidy war, you seed-fund a volunteer-run minibus and a lift-share app. It is fragile and depends on the goodwill of the retired, but it runs where the commercial route never would, and it belongs to the villages.',
      },
      {
        label: 'Call it a matter for the market',
        effects: { stats: { integrity: -2, constituencyApproval: -4 } },
        outcomeText: 'You issue a statement about "commercial realities in rural transport" and let the route die. The villages notice that the man who canvassed every farm gate could not be found when the gate led nowhere.',
      },
    ],
  },
  {
    id: 'rgn_london_tower',
    title: 'The tower',
    body: 'A developer wants to put a forty-storey tower of "investment flats" on a car park in your London seat. It brings a hundred so-called affordable units and a swagger of regeneration; it also throws your Victorian terraces into shadow and, the locals suspect, will sit half-empty as safe-deposit boxes for overseas money.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 520,
    requires: { region: ['london'] },
    choices: [
      {
        label: 'Back the tower for the housing',
        effects: { stats: { integrity: 3, profile: 2, constituencyApproval: -3 } },
        outcomeText: 'You make the unfashionable case that a housing crisis is solved by building housing, and you extract more affordable units as the price of your support. The conservation society never forgives you; a few people on the waiting list quietly do.',
      },
      {
        label: 'Stand with the terraces',
        effects: { stats: { constituencyApproval: 4, integrity: -1 } },
        outcomeText: 'You back the residents against the tower and the scheme is called in and scaled down to nothing. The car park stays a car park, the skyline stays low, and the hundred affordable homes join the many thousands London keeps not building.',
      },
      {
        label: 'Demand a foreign-buyer clause',
        effects: { stats: { integrity: 3, competence: 2, profile: 1 } },
        outcomeText: 'You back the height but fight for a "first dibs for locals" covenant and a levy on empty units. The developer howls that you have made it unviable; you suspect that means you have made it fair. The clause survives, weakened, into the final consent.',
      },
    ],
  },
  {
    id: 'rgn_commuter_trains',
    title: 'The 7:42 to nowhere',
    body: 'Your prosperous commuter seat has one grievance above all others: the trains. Fares up again, a timetable that reads like fiction, and a franchise that treats a cancelled service as a rounding error. The station-platform WhatsApp group — lawyers, accountants, a retired judge — has decided, coldly, that this is now about you.',
    tags: ['constituency', 'policy', 'media'],
    weight: 10, cooldownDays: 500,
    requires: { region: ['southEast'] },
    choices: [
      {
        label: 'Lead a passenger revolt on the operator',
        effects: { stats: { constituencyApproval: 5, profile: 3, partyStanding: -1 } },
        outcomeText: 'You convene the commuters, stage a platform photo-call, and drag the rail minister to a public meeting the operator dreads. You win compensation and a review. The 7:42 is no more punctual, but the professional classes now know whose side you are on, and they vote in numbers.',
      },
      {
        label: 'Push quietly for the timetable rewrite',
        effects: { stats: { competence: 4, constituencyApproval: 1 } },
        outcomeText: 'You skip the theatre and spend the political capital on the technical fix — a rewritten timetable and a fixed junction that actually adds trains. It is invisible work, and the retired judge writes to say the 7:42 now runs, which is the only review that matters.',
      },
    ],
  },
  {
    id: 'rgn_university_town',
    title: 'Town versus gown',
    body: 'The university in {constituency} wants to buy up another street for student flats. It is the town\'s biggest employer and its biggest headache: rents that price out local families, bin-strewn weekends, and a permanent population that feels colonised by an institution that pays little council tax and less attention. Both the vice-chancellor and the residents\' association want a word.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 520,
    requires: { region: ['northWest', 'yorkshire', 'eastMidlands'] },
    choices: [
      {
        label: 'Champion the town',
        effects: { stats: { constituencyApproval: 4, integrity: 2, profile: -1 } },
        outcomeText: 'You back a cap on student conversions and lean on the university to pay its way and house its own. The vice-chancellor, a considerable donor to considerable people, is displeased. The families who grew up here and can no longer afford to stay are not, for once, the ones who lose.',
      },
      {
        label: 'Court the university',
        effects: { stats: { competence: 3, profile: 2, constituencyApproval: -2 } },
        outcomeText: 'You back the expansion for the jobs, the research money and the graduate startups it seeds, and win a modest community fund as a fig leaf. The economy of the town depends on the thing hollowing out its centre; you have chosen the economy, and hoped no one runs the numbers on rents.',
      },
      {
        label: 'Broker a town-gown compact',
        effects: { stats: { competence: 3, integrity: 2, constituencyApproval: 1 } },
        outcomeText: 'You lock the two sides in a room until they sign a compact — the university funds a warden scheme, builds on its own land, and pays into local services. It pleases nobody wholly, which in a fight this old is the closest thing to peace on offer.',
      },
    ],
  },
  {
    id: 'rgn_ex_pit_regen',
    title: 'The levelling-up cheque',
    body: 'A ministerial "levelling-up" pot will fund exactly one flagship project in {constituency}, and the town is at war with itself over which: a shiny leisure-and-retail scheme to draw people in, or the unglamorous repair of the crumbling town it already has — roads, the market hall, the shuttered swimming baths. The cameras want a ribbon; the residents want their baths back.',
    tags: ['constituency', 'policy', 'media'],
    weight: 10, cooldownDays: 600,
    requires: { region: ['northEast', 'westMidlands', 'wales'] },
    choices: [
      {
        label: 'Chase the flagship regeneration',
        effects: { stats: { profile: 4, constituencyApproval: 2, competence: -1 } },
        outcomeText: 'You back the leisure scheme, cut the ribbon, and get the artist\'s impression on the front page. It may draw the crowds the consultants promised, or it may be a car park with ambition. Either way there is a photo of you looking hopeful in a hard hat, and photos win the next one.',
      },
      {
        label: 'Fix the town it already has',
        effects: { stats: { competence: 4, integrity: 3, profile: -1 } },
        outcomeText: 'You spend the cheque on the baths, the market hall and the potholes — the deeply unphotogenic bones of a place. No minister flies in for a ribbon on a resurfaced road, but the town works a little better every day, and the people who live there notice the things the cameras never do.',
      },
    ],
  },
  {
    id: 'rgn_greenbelt_new_town',
    title: 'A new town on the green belt',
    body: 'The government has designated land on the edge of your commuter-belt seat for 15,000 new homes — a whole new town on fields your constituents walk their dogs across. Nationally it is exactly the housing the country is screaming for. Locally it is roads that cannot cope, a GP list already closed, and a green belt your voters believed was a promise.',
    tags: ['constituency', 'policy', 'crisis'],
    weight: 9, cooldownDays: 620,
    requires: { region: ['southEast', 'east'] },
    choices: [
      {
        label: 'Support the homes, fight for the infrastructure',
        effects: { stats: { integrity: 3, competence: 3, constituencyApproval: -3 } },
        outcomeText: 'You accept the national case for the town and spend your energy forcing "infrastructure first" — the surgery, the school and the relief road before the diggers, not a decade after. It is the responsible answer, and it is on a leaflet through every door captioned "SOLD OUT THE GREEN BELT".',
      },
      {
        label: 'Lead the resistance',
        effects: { stats: { constituencyApproval: 5, profile: 3, partyStanding: -3 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: 'You put yourself at the head of the "save our fields" campaign and vote against your own government\'s housing target. The dog-walkers hail you; the whips log you; and somewhere a first-time buyer priced out of three counties reads about it and feels, quite rightly, that no one is on their side.',
      },
    ],
  },

  // ---- Northern Ireland at Westminster ----
  // A member from one of the eighteen seats across the water: a party with no
  // GB wing, seven empty Sinn Féin benches beside them, and a Protocol that is
  // a domestic question for them and a foreign one for everybody else in the
  // House. {otherleader}/{othergov} shift meaning while Stormont is down, so
  // these cards name the Secretary of State directly where it matters.
  {
    id: 'rgn_ni_framework_vote',
    title: 'The Framework vote',
    body: 'The Windsor Framework comes to the floor on Wednesday: the Stormont brake, the green lanes, the end of the sausage war and the start of something your constituents in {constituency} have strong views about in both directions. The government has a majority without you and would like you anyway. Dublin is watching. So is every lorry driver at Larne. Your eighteen seats are the only ones in the House for which this is not a foreign policy question.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 13, cooldownDays: 1200, oncePerCareer: true,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Vote for it',
        effects: { stats: { competence: 3, profile: 2, constituencyApproval: -2 } },
        outcomeText: 'You vote for the deal and say it is the least worst arrangement on offer, which is more than anyone has said for a treaty in that House in years. {constituency}’s unionists write to you in capital letters; its businesses write in thanks, on headed paper, quietly.',
      },
      {
        label: 'Vote against',
        effects: { stats: { constituencyApproval: 3, partyStanding: 2, profile: 1, competence: -1 } },
        outcomeText: 'You vote against with a speech about consent and the Act of Union, and the deal passes by five hundred. The lorries get their green lane anyway. Your voters know where you stood, which in Northern Ireland is a currency that does not devalue.',
      },
      {
        label: 'Abstain, and say the detail needs work',
        effects: { stats: { competence: 1, integrity: -2, constituencyApproval: -1 } },
        outcomeText: 'The abstention is noticed by exactly the people you hoped would not notice it. {journalist} describes it as a seat warmed and not sat in. There are seven empty seats in the House already; nobody in Northern Ireland needed an eighth.',
      },
    ],
  },
  {
    id: 'rgn_ni_arithmetic',
    title: 'The arithmetic',
    body: 'The government’s majority is thin enough that tonight’s vote comes down to a handful of unionists, and {whip} has passed on the ask: vote with the government, or be absent, on a measure that has nothing to do with Northern Ireland. The offer is a billion pounds, give or take, for roads, hospitals and a stadium in Belfast, dressed as a “financial package”. The Scottish Nationalists call it a bribe. {leader} calls it a negotiation. Your constituents call it about time.',
    tags: ['westminster', 'party'],
    weight: 12, cooldownDays: 700,
    requires: { region: ['ni'], partyIn: ['dup'] },
    choices: [
      {
        label: 'Take the deal and vote with them',
        effects: { stats: { constituencyApproval: 4, partyStanding: 3, competence: 2, integrity: -2 } },
        outcomeText: 'The vote passes by nine and the money is announced the next morning with Belfast in the first line. The English papers call it the most expensive division in history. The A5 gets its funding. You have learned what a vote is worth, which is a thing you cannot unlearn.',
      },
      {
        label: 'Vote with them and ask for nothing',
        effects: { stats: { integrity: 3, partyStanding: -3, constituencyApproval: -1 } },
        outcomeText: 'You vote on the merits, which in a tight parliament is an eccentricity. The government is grateful, the party is baffled and {constituency} wants to know what it got. It got your principles, which are not a stadium.',
      },
      {
        label: 'Make them sweat, and abstain',
        effects: { stats: { profile: 3, partyStanding: 1, competence: -1 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'The government scrapes through without you and remembers it. The next package, when it comes, has one fewer item in it. You have proved you cannot be bought, which is admirable, and that you cannot be relied upon, which is not.',
      },
    ],
  },
  {
    id: 'rgn_ni_legacy_bill',
    title: 'Legacy',
    body: 'The Troubles legacy bill is back: an end to prosecutions and inquests in return for an information recovery body nobody in Northern Ireland asked for. Every party at Stormont opposes it, which has not happened since the Agreement, and so does Dublin, and so do the victims’ groups who sit in your {constituency} surgery on alternate Fridays with photographs. The veterans’ lobby in England backs it; so does the government, which has the votes. You will be asked to speak, and then to vote, and then to go home.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 900,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Speak against it, with the families in the gallery',
        effects: { stats: { integrity: 4, constituencyApproval: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'Six minutes with three names in it, and the gallery is silent in the way that is louder than noise. The bill passes anyway. The families thank you in the lobby. Nothing has changed except that it is on the record, which is what they came for.',
      },
      {
        label: 'Back the amendments, not the principle',
        effects: { stats: { competence: 3, integrity: -1, constituencyApproval: -1 } },
        outcomeText: 'You get the inquests already under way protected and the time limit extended, and you vote for the bill at third reading because the amendments are in it. It is the most anyone from Northern Ireland achieves on it. The families do not see it that way.',
      },
      {
        label: 'Stay out of it: the soldiers’ families are constituents too',
        effects: { stats: { constituencyApproval: -2, integrity: -2, partyStanding: 1 } },
        outcomeText: 'You abstain and issue a statement about balance. In {constituency} the balance is read by both sides as a vote for the other. The veterans’ lobby does not write to thank you. It had assumed you were theirs.',
      },
    ],
  },
  {
    id: 'rgn_ni_budget_from_london',
    title: 'The budget set across the water',
    body: 'Northern Ireland’s budget is being set at Westminster this year, by a Secretary of State who has been to Belfast eleven times and a Treasury that has never, and the Bill gets a day and a half. The health trust in {constituency} is a winter away from a waiting-list scandal; the schools are asking parents for paper. The departments in Belfast will spend it, but nobody in Belfast will have voted for it. You are one of the few people in the Chamber who can say what a line in it means on the ground.',
    tags: ['westminster', 'policy', 'constituency'],
    weight: 11, cooldownDays: 700,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Fight for the health line',
        effects: { stats: { constituencyApproval: 3, competence: 2, profile: 1 } },
        outcomeText: 'You table the amendment and get a concession in committee that is worth forty million and that nobody notices. The waiting list in {constituency} shortens by a month. It is the kind of win that fits in a letter and not on a leaflet.',
      },
      {
        label: 'Use the day to say Stormont should be doing this',
        effects: { stats: { profile: 3, integrity: 2, competence: -2 } },
        outcomeText: 'A speech about democracy that the Belfast papers run and the London papers do not. It is true and it is not a budget. The schools in {constituency} buy their own paper for another year.',
      },
      {
        label: 'Vote it through and go home',
        effects: { stats: { competence: -1, constituencyApproval: -2 } },
        outcomeText: 'The Bill passes without a word from you and the flight home is on time. The health trust writes to ask what you did about the line that cut its agency budget. You tell them about the flight.',
      },
    ],
  },
  {
    id: 'rgn_ni_monday_flight',
    title: 'The Monday flight',
    body: 'The 06.40 from Belfast City to Heathrow every Monday, and the 19.00 back on Thursday, when the House lets you. In between, {constituency} has a surgery on Friday, a funeral on Saturday and a hall on Sunday that expects you. Your family has stopped asking which side of the water you live on. The expenses authority has written to ask why your travel claim is the third highest in the House, and the local paper has the figure, and not the geography.',
    tags: ['personal', 'constituency', 'funny'],
    weight: 10, cooldownDays: 500,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Publish every receipt and explain the geography',
        effects: { stats: { integrity: 3, constituencyApproval: 1, profile: 1 } },
        outcomeText: 'A spreadsheet, a map and a line about the Irish Sea that gets quoted. The story dies in a day in London and never started in {constituency}, where everyone has made the same flight. The expenses authority writes a shorter letter.',
      },
      {
        label: 'Cut the Fridays and stay in London',
        effects: { stats: { competence: 2, partyStanding: 1, constituencyApproval: -3 } },
        outcomeText: 'You are in the House on Fridays now, which the whips like, and the Friday surgery becomes a phone line, which {constituency} notices. The travel claim falls. So does the number of people who have seen you since Easter.',
      },
      {
        label: 'Move the family to London',
        effects: { stats: { profile: 1, constituencyApproval: -4, integrity: -1 } },
        outcomeText: 'A flat in Kennington and a school nearer the Thames than the Lagan. The children settle. Somebody in {constituency} photographs the For Sale sign and the caption is “Belfast, apparently”. You still take the Monday flight; it just goes the other way.',
      },
    ],
  },
  {
    id: 'rgn_ni_air_passenger_duty',
    title: 'The duty on the flight',
    body: 'Dublin airport is ninety minutes from {constituency} and charges no air passenger duty; Belfast’s two airports charge the full British rate and lose a route to Dublin every year. The Treasury has the power to devolve the duty or cut it and has done neither, on the grounds that the Scots would ask next. The business lobby wants you to put down an amendment at the Finance Bill. The Treasury minister has offered a review, which would be the fourth.',
    tags: ['westminster', 'policy'],
    weight: 9, cooldownDays: 700,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Table the amendment and force a vote',
        effects: { stats: { profile: 2, constituencyApproval: 2, competence: 1, partyStanding: -1 } },
        outcomeText: 'The amendment falls by two hundred and the airports write to thank you for losing it loudly. The Treasury, which hates votes, offers a working group with a chair. Belfast loses the Newark route in October anyway.',
      },
      {
        label: 'Take the review and work it quietly',
        effects: { stats: { competence: 2, constituencyApproval: -1 } },
        outcomeText: 'The fourth review reports in eighteen months and recommends a fifth. You are in the room for it and can say so. The business lobby stops inviting you to its dinner, which was the only part of this you enjoyed.',
      },
      {
        label: 'Make it a Dublin problem: ask the Irish to raise theirs',
        effects: { stats: { profile: 1, competence: -2, constituencyApproval: -1 } },
        outcomeText: 'The Irish finance minister, asked by a reporter, laughs. It is a short clip and it travels. The question of why a Northern Ireland member is asking Dublin to solve a Treasury problem is one you are asked in {constituency} for a while.',
      },
    ],
  },
  {
    id: 'rgn_ni_border_poll_question',
    title: 'The poll question',
    body: 'A university has published a poll putting support for Irish unity within a few points of the Union, and a Sunday programme in London would like you on, as the reasonable face of Northern Ireland, to say whether the Secretary of State should call a border poll. {party}’s position fits on a card and your constituents in {constituency} hold at least four. Say yes and you are a nationalist; say no and you have given up on your voters; say it is premature and you have said nothing, on television, for eight minutes.',
    tags: ['media', 'serious'],
    weight: 10, cooldownDays: 800,
    requires: { region: ['ni'], partyIn: ['sdlp', 'alliance'] },
    choices: [
      {
        label: 'Say the conditions are not met, and name them',
        effects: { stats: { competence: 3, integrity: 1, profile: 1, constituencyApproval: -1 } },
        outcomeText: 'A clear answer with a test in it, which nobody in Belfast has offered for twenty-five years. Nationalists call it a stall and unionists call it a threat, which is roughly where the middle is. The programme asks you back.',
      },
      {
        label: 'Call for the planning to start now',
        effects: { stats: { profile: 4, integrity: 1, constituencyApproval: 1, partyStanding: -2 } },
        outcomeText: 'The clip runs on both sides of the border for a week. The Irish government is pleased and says so, which does not help. In {constituency} the unionists who lent you their votes last time quietly take them back.',
      },
      {
        label: 'Say it is a matter for the Secretary of State',
        effects: { stats: { competence: -1, integrity: -2, constituencyApproval: -1 } },
        outcomeText: 'Eight minutes in which you say nothing with great care. The presenter thanks you for your time in a tone. Your own members ask what the point of the interview was, and then, more quietly, what the point of the party is.',
      },
    ],
  },
  {
    id: 'rgn_ni_empty_benches',
    title: 'The empty benches',
    body: 'A woman from the constituency next to {constituency} is in your office in Portcullis House, with a file. Her son’s case needs a minister’s attention and her MP is Sinn Féin, who do not take their seats, so there is nobody to ask a question for her in the House. She has driven to Dublin, written to the Taoiseach and been to Stormont. You are the nearest member who will be in the Chamber on Wednesday. Taking the case means a row with her MP and a precedent you cannot un-set.',
    tags: ['constituency', 'westminster', 'serious'],
    weight: 11, cooldownDays: 600,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Take the case and ask the question',
        effects: { stats: { integrity: 3, competence: 2, constituencyApproval: 1, profile: 1 } },
        outcomeText: 'You raise it at Northern Ireland questions and the minister promises a meeting, which happens. Her MP issues a statement about interference, or about opportunism, depending on which party you are in. Three more files arrive the following week.',
      },
      {
        label: 'Help her privately, and keep it out of the House',
        effects: { stats: { competence: 2, integrity: 1 } },
        outcomeText: 'A letter on your headed paper and a word with the minister’s office in the tea room. It works, slowly, and nobody knows. Her MP does not find out, which was the price of the help, and the next woman does not find out either, which was the cost.',
      },
      {
        label: 'Send her back to her own MP',
        effects: { stats: { integrity: -3, constituencyApproval: -1 } },
        outcomeText: 'You explain the convention and she explains that she has heard it before. The file goes back in the bag. {journalist} hears about it from somebody, and the piece is about the empty benches, and about the full one that did nothing.',
      },
    ],
  },
  {
    id: 'rgn_ni_flag_row',
    title: 'The flag',
    body: 'A council in {constituency} has voted to fly the Union flag from the town hall on designated days only, and the town has been on the news every night for a week. There are protests at the roundabout, a petrol bomb through a window that may be unrelated, and a request from a Belfast radio station for you to come on tomorrow morning. The convention is that Westminster members stay out of council business. The convention has not been to the roundabout.',
    tags: ['constituency', 'crisis', 'media'],
    weight: 11, cooldownDays: 800,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Take a side, loudly',
        effects: { stats: { constituencyApproval: 3, profile: 2, partyStanding: 1, integrity: -1 } },
        outcomeText: 'You say what your voters think, with a careful sentence about peaceful protest, and the sentence is cut from the clip. Your voters turn out. So does a second window, which you condemn, from London, by statement.',
      },
      {
        label: 'Call for calm and for the council to think again',
        effects: { stats: { competence: 2, integrity: 1, constituencyApproval: -1 } },
        outcomeText: 'A statement that asks everybody to lower their voices and is read at full volume by both sides as a surrender. The protests fade with the weather. The council does not think again, and you are asked why you did not make it.',
      },
      {
        label: 'Say it is a matter for the council',
        effects: { stats: { integrity: 1, constituencyApproval: -3, profile: -1 } },
        outcomeText: 'Correct, constitutional and absent. The roundabout notices who was not there, and the radio station finds a councillor who was. In Northern Ireland, matters for the council have a way of becoming matters for everyone.',
      },
    ],
  },
  {
    id: 'rgn_ni_agreement_anniversary',
    title: 'The anniversary',
    body: 'The Belfast Agreement turns a round number this spring and the Americans are coming: a president, two former ones, and a congressional delegation who will each need a photograph and a word. The Secretary of State is hosting a conference at Queen’s. Your party’s view of the Agreement is on the record and your constituents’ view in {constituency} is more complicated than either. A seat on the platform is on offer. So is a sentence in your speech that your party has not cleared.',
    tags: ['media', 'party'],
    weight: 9, cooldownDays: 1200,
    requires: { region: ['ni'] },
    choices: [
      {
        label: 'Take the platform and say what you think',
        effects: { stats: { profile: 4, integrity: 2, constituencyApproval: 1, partyStanding: -3 } },
        outcomeText: 'The sentence is the one the Americans quote. It is honest and it is yours and {leader}’s office hears it on the radio before you have left the hall. The congressmen want a photograph. The party wants a word.',
      },
      {
        label: 'Take the platform and give the party line',
        effects: { stats: { partyStanding: 3, profile: 1, integrity: -1 } },
        outcomeText: 'A careful speech that could have been given by any of your colleagues and is reported as such. The Americans clap politely and move on to someone with a story. You are in the photograph, at the edge, which is where the party line puts you.',
      },
      {
        label: 'Stay away: it is not your anniversary',
        effects: { stats: { constituencyApproval: 1, profile: -2, partyStanding: -1 } },
        outcomeText: 'Your absence is a story for a day in Belfast and never in Washington. Your base approves. The former president, told, asks who you are, and is not told twice.',
      },
    ],
  },
];
