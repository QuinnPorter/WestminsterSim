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
];
