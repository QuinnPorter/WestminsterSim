import { DecisionCard } from '../../types/content';

/**
 * B6 — Cause delivery. One `oncePerCareer` "deliver your signature cause" card
 * per major cause, offered only to a minister (tier >= 3) who champions that
 * cause and sits in an aligned department. The cause-aligned choice is a big,
 * earned legacy beat: it bumps the hidden "champion of X" tally, stamps a
 * `delivered_<cause>` flag, and pays real integrity + competence. The weaker
 * alternative is the safe, unmemorable option — you had the brief and the
 * moment, and you spent it on nothing in particular.
 *
 * Gating mirrors the plan: { inGovernment, minTier: 3, causeIn: [c],
 * department: [alignedDept(s)] } drawn from each cause's departmentAffinity in
 * data/causes.ts. New file only; registered by the synthesizer in index.ts.
 */
export const CAUSE_DELIVERY_CARDS: DecisionCard[] = [
  // ----------------------------------------------------------------- economy
  {
    id: 'cdeliver_economy',
    title: 'The number that outlives you',
    body: 'The brief is on your desk: a genuine supply-side reform — planning, skills and capital allowance in one package — that the OBR will actually score as growth. It gores three protected interests and a slice of your own backbenches, and the payoff lands after the next election, under someone else\'s name. Or you can bank the safe fiscal event and let the moment pass.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['economy'], department: ['treasury', 'business'] },
    choices: [
      {
        label: 'Push the reform through and take the hits',
        effects: { bumpCause: 'economy', setFlags: { delivered_economy: true }, stats: { integrity: 8, competence: 12, partyStanding: -6 } },
        outcomeText: 'You spend the political capital, face down the lobbies and get it on the statute book largely intact. The growth shows up years later, credited to whoever holds the brief then — but the officials, the OBR and the people who actually read the numbers know exactly whose reform it was. This is the one they will remember.',
      },
      {
        label: 'Take the safe fiscal event instead',
        effects: { stats: { competence: 3, partyStanding: 3 } },
        outcomeText: 'You do the tidy, well-trailed announcement that pleases the whips and moves nothing. A competent day at the despatch box, forgotten by the weekend. The reform goes back in the drawer for a braver successor.',
      },
    ],
  },
  // -------------------------------------------------------------- inequality
  {
    id: 'cdeliver_inequality',
    title: 'The floor beneath everyone',
    body: 'The modelling is finally solid: a redesign of the taper and a minimum-income guarantee that measurably closes the gap and lifts a named number of children out of poverty. It is expensive, the Treasury hates it, and the tabloids will call it something with the word "handout" in it. Or you can push the smaller, safer uprating and move on.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['inequality'], department: ['dwp', 'treasury'] },
    choices: [
      {
        label: 'Fund it and defend it at the despatch box',
        effects: { bumpCause: 'inequality', setFlags: { delivered_inequality: true }, stats: { integrity: 12, competence: 8, partyStanding: -6 } },
        outcomeText: 'You win the spending round by a thread and take the front pages on the chin. The poverty figures move — really move — for the first time in a decade, and there is a number attached that you can say out loud. Not everyone forgives the cost. Everyone remembers the floor.',
      },
      {
        label: 'Do the modest uprating and bank the goodwill',
        effects: { stats: { competence: 3, partyStanding: 3 } },
        outcomeText: 'You uprate in line with inflation, take the quiet credit, and leave the structural problem for another minister. Nobody is worse off. Nobody is meaningfully better off either. The gap is exactly where you found it.',
      },
    ],
  },
  // ---------------------------------------------------------- publicServices
  {
    id: 'cdeliver_public_services',
    title: 'The reform that dare not speak',
    body: 'The plan is real this time: a workforce settlement and a delivery model that cuts the waiting lists on a timetable people can hold you to — with the pay deal and the reform welded together so neither can be dodged. The unions are wary, the Treasury is furious, and if the numbers slip it is your name on the ward door. Or you take the announcement, the extra money, and no reform.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['publicServices'], department: ['health', 'education'] },
    choices: [
      {
        label: 'Weld the pay deal to the reform and ship it',
        effects: { bumpCause: 'publicServices', setFlags: { delivered_publicServices: true }, stats: { integrity: 8, competence: 12, partyStanding: -5 } },
        outcomeText: 'You get the settlement signed and the delivery targets published, hostages to fortune and all. The lists start coming down on the timetable you promised, in public, where it counts. Front-line staff know who fought the Treasury for it. So, in time, do the voters who finally got seen.',
      },
      {
        label: 'Announce the money, skip the reform',
        effects: { stats: { competence: 3, partyStanding: 4 } },
        outcomeText: 'You wave the extra billions, hold a photocall in a corridor, and leave the model untouched. The money is real; the improvement is not, quite. A good week for the grid and a bad decade for the service.',
      },
    ],
  },
  // -------------------------------------------------------------- environment
  {
    id: 'cdeliver_environment',
    title: 'The target with teeth',
    body: '{department} has drafted a binding decarbonisation package — grid, planning and a carbon border levy — that would actually put net zero within reach, and legally bind your successors to it. Industry is lobbying hard, the backbenches smell a cost-of-living row, and the credit is generational rather than electoral. Or you do the glossy strategy document with no statutory bite.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['environment'], department: ['environment', 'transport'] },
    choices: [
      {
        label: 'Legislate the binding target and mean it',
        effects: { bumpCause: 'environment', setFlags: { delivered_environment: true }, stats: { integrity: 12, competence: 8, partyStanding: -6 } },
        outcomeText: 'You put the package on the statute book with the teeth intact, so no future minister can quietly let it slide. The emissions curve bends for real, on a timescale that outruns your career. The lobbies never forgive you. The planet, insofar as it keeps a ledger, does.',
      },
      {
        label: 'Publish the strategy, drop the legal bite',
        effects: { stats: { competence: 3, profile: 3 } },
        outcomeText: 'You launch a handsome strategy with a green cover and a launch event, and quietly strip out the binding clauses. It photographs well and commits no one to anything. The target survives exactly as long as the next reshuffle.',
      },
    ],
  },
  // -------------------------------------------------------------- immigration
  {
    id: 'cdeliver_immigration',
    title: 'The system that actually works',
    body: 'The Home Office has, for once, a workable end-to-end plan: fast processing, real returns agreements and a legal-routes settlement that clears the backlog and holds up in court. It requires deals abroad, money at home, and telling both wings of your party something they do not want to hear. Or you take the tough-sounding announcement that the lawyers will unpick by spring.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['immigration'], department: ['home'] },
    choices: [
      {
        label: 'Build the system that survives the courts',
        effects: { bumpCause: 'immigration', setFlags: { delivered_immigration: true }, stats: { integrity: 8, competence: 12, partyStanding: -5 } },
        outcomeText: 'You do the unglamorous work — the returns deals, the processing capacity, the legal routes — and the backlog genuinely clears. It satisfies neither the "close the borders" nor the "open them" camp, which is roughly how you know it is the real thing. The numbers hold. That, in this brief, is a monument.',
      },
      {
        label: 'Make the announcement, let the courts decide',
        effects: { stats: { profile: 4, competence: -2 } },
        outcomeText: 'You unveil the scheme with the tough words the front pages want, knowing full well the first judicial review will gut it. It does. The clip ages badly, the backlog does not move, and you are on to the next headline before the ruling lands.',
      },
    ],
  },
  // ------------------------------------------------------------------ defence
  {
    id: 'cdeliver_defence',
    title: 'The order that outlasts the parliament',
    body: 'The review is done and the choice is stark: a genuine, funded rearmament — hulls, munitions stockpiles and a fixed spending floor written into law — or a glossy command paper that reannounces last year\'s money. The real thing means a fight with the Treasury you might lose, and a bill that comes due long after you are gone. Or you take the paper and the photocall on the carrier deck.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['defence'], department: ['defence'] },
    choices: [
      {
        label: 'Win the funded floor and place the orders',
        effects: { bumpCause: 'defence', setFlags: { delivered_defence: true }, stats: { integrity: 8, competence: 12, partyStanding: -5 } },
        outcomeText: 'You face down the Treasury, get the spending floor into legislation and place the orders that take a decade to deliver. The yards go back to work; the stockpiles fill. The credit accrues slowly, to a country that is quietly safer, and to a name the services will not forget.',
      },
      {
        label: 'Reannounce the money on the carrier deck',
        effects: { stats: { profile: 4, competence: -2 } },
        outcomeText: 'You do the command paper and the photograph in front of the jets, reannouncing money that was already committed. It looks like strength on the evening news. The gaps in the order book are exactly where you left them.',
      },
    ],
  },
  // ------------------------------------------------------------ foreignAffairs
  {
    id: 'cdeliver_foreign',
    title: 'The alliance you built',
    body: 'You have the pieces for something rare: a durable coalition of allies around a treaty that binds them past the next change of government in any of the capitals. It takes months of unglamorous shuttle diplomacy, a concession that will be attacked at home, and a willingness to let a foreign leader take the podium credit. Or you take the bilateral photocall and the communiqué that commits no one.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['foreignAffairs'], department: ['foreign'] },
    choices: [
      {
        label: 'Do the diplomacy and land the treaty',
        effects: { bumpCause: 'foreignAffairs', setFlags: { delivered_foreignAffairs: true }, stats: { integrity: 8, competence: 12, partyStanding: -4 } },
        outcomeText: 'You spend the months, make the concession and let others share the podium — and the treaty holds, surviving the governments that come after everyone who signed it. Britain\'s word means something again in rooms that matter. Diplomats a generation from now will cite it by your name.',
      },
      {
        label: 'Take the bilateral photocall',
        effects: { stats: { profile: 4, competence: 2 } },
        outcomeText: 'You do the handshake on the steps, the warm communiqué and the joint statement full of "shared values". It leads the bulletins and commits nobody to anything. Pleasant, forgotten, and gone by the next summit.',
      },
    ],
  },
  // ------------------------------------------------------------------ housing
  {
    id: 'cdeliver_housing',
    title: 'The homes that get built',
    body: 'The plan on the table would actually move the numbers: planning reform, a new-town programme and a funded social-housing settlement that puts homes within reach of a generation locked out. It means overriding shire councils, a fight with your own greenest belt, and a payoff measured in completions years away. Or you take the target announcement that sounds enormous and builds nothing.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['housing'], department: ['housing', 'treasury'] },
    choices: [
      {
        label: 'Reform planning and fund the programme',
        effects: { bumpCause: 'housing', setFlags: { delivered_housing: true }, stats: { integrity: 8, competence: 12, partyStanding: -7 } },
        outcomeText: 'You take on the councils, the green belt and half your own side, and the diggers actually break ground. The completions climb, slowly, on a chart you can point to; a generation that had given up on owning anything starts to hope. The seats you lose over it are real. So are the homes.',
      },
      {
        label: 'Announce the target, dodge the fight',
        effects: { stats: { profile: 4, partyStanding: 2 } },
        outcomeText: 'You announce a number so large it makes headlines, and quietly avoid every planning fight required to hit it. The target is missed by the usual margin, blamed on the market, and reannounced by your successor. The scaffolding never goes up.',
      },
    ],
  },
  // --------------------------------------------------------------- lawAndOrder
  {
    id: 'cdeliver_law_and_order',
    title: 'The sentence that means something',
    body: 'The package is coherent for once: neighbourhood policing rebuilt, courts unclogged and a sentencing framework that is tough where it counts and honest about the prison places to back it. It costs real money, tells the tabloids some of their favourite crackdowns don\'t work, and the fall in crime shows up years down the line. Or you take the eye-catching crackdown that fills a front page and a prison you haven\'t built.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['lawAndOrder'], department: ['justice', 'home'] },
    choices: [
      {
        label: 'Fund the whole system and be honest about it',
        effects: { bumpCause: 'lawAndOrder', setFlags: { delivered_lawAndOrder: true }, stats: { integrity: 12, competence: 8, partyStanding: -5 } },
        outcomeText: 'You rebuild the beat, clear the court backlog and match the sentences to the prison places for once, telling the papers the crackdowns they love do not work. Crime falls — genuinely, measurably, on a lag no politician likes. The officers on the ground know who backed them. The record does too.',
      },
      {
        label: 'Announce the crackdown, skip the prison places',
        effects: { stats: { profile: 4, competence: -2 } },
        outcomeText: 'You launch the tough new sentences to a delighted front page, without the prison places to house anyone they send down. The courts jam, the cells overflow, and the crackdown quietly becomes early release by another name. It read well for a morning.',
      },
    ],
  },
  // ---------------------------------------------------------------- education
  {
    id: 'cdeliver_education',
    title: 'The cohort you changed',
    body: 'You have the makings of a real settlement: teacher recruitment fixed, a curriculum reform that closes the attainment gap, and post-16 skills funding put on a stable footing that outlasts you. It requires standing up to two lobbies at once, a spending fight, and results that arrive when this cohort sits its exams years from now. Or you take the flagship announcement that renames a scheme and changes nothing.',
    tags: ['policy', 'serious'],
    speaker: 'leader',
    weight: 16, cooldownDays: 9999,
    oncePerCareer: true,
    requires: { inGovernment: true, minTier: 3, causeIn: ['education'], department: ['education'] },
    choices: [
      {
        label: 'Fix recruitment and close the gap for good',
        effects: { bumpCause: 'education', setFlags: { delivered_education: true }, stats: { integrity: 8, competence: 12, partyStanding: -5 } },
        outcomeText: 'You win the teachers back, reform the curriculum and put skills funding on solid ground, taking the fights that came with each. The attainment gap narrows for a whole cohort who will never know your name — which is rather the point. Somewhere a classroom is quietly better because you spent the capital.',
      },
      {
        label: 'Launch the flagship, rename the scheme',
        effects: { stats: { profile: 4, competence: 2 } },
        outcomeText: 'You unveil a flagship with a new name and a new logo, built from the old scheme with the serial numbers filed off. It gets a warm reception and a fresh press pack. The classroom is exactly where you found it.',
      },
    ],
  },
];
