import { DecisionCard } from '../../types/content';

/** Devolved government as backdrop — for MAJOR-party (UK-party) MPs seated in
 *  Scotland, Wales or Northern Ireland (minorParty:false). Distinct from
 *  thirdParty.ts, where SNP/Plaid MPs fight Westminster on their own account.
 *  Here the devolved administration is run by your RIVALS: the Barnett funding
 *  row, the two-governments blame game, the "which parliament failed you"
 *  doorstep. FLAVOUR ONLY — no devolved offices, no new mechanics, just a
 *  believable stat trade-off. */
export const DEVOLVED_SCENERY_CARDS: DecisionCard[] = [
  {
    id: 'dev_barnett_row',
    title: 'The Barnett line',
    body: 'The Treasury settlement is out, the devolved government says the funding formula short-changes {constituency}, and the local paper wants your line before lunch. Defend the Union arithmetic or admit the formula is showing its age.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 0 },
    choices: [
      {
        label: 'Defend the settlement',
        effects: { stats: { partyStanding: 3, competence: 2 } },
        outcomeText: 'You hold the party line: the block grant is generous, the formula fair, the grievance manufactured. The whips are pleased; a few constituents mutter that London always says that.',
      },
      {
        label: 'Concede the formula needs review',
        effects: { stats: { integrity: 3, profile: 2, partyStanding: -2 } },
        outcomeText: 'You break ranks and say the quiet part: Barnett was a 1970s fix nobody dares reopen. Honest, quotable, and precisely the sort of candour the Chief Whip files under "unhelpful".',
      },
    ],
  },
  {
    id: 'dev_blame_game',
    title: 'Two governments, one pothole',
    body: 'A local service is failing badly, and it sits in the grey zone between what Westminster funds and what the devolved administration delivers. Both governments are busy blaming each other, and your constituents just want the thing fixed.',
    tags: ['constituency', 'media'],
    weight: 11, cooldownDays: 340,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 0 },
    choices: [
      {
        label: 'Pin it on the devolved government',
        effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You make it their failure, loudly and on the record. It plays well with the base and the front bench; the officials in the devolved capital add you to a list they keep.',
      },
      {
        label: 'Broker a joint fix',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You skip the point-scoring and get both sides in a room until the service is running again. Nobody claims the credit, which is roughly how the constituent wanted it.',
      },
    ],
  },
  {
    id: 'dev_holyrood_rival',
    title: 'The other chamber',
    body: 'A high-profile member of the devolved parliament — your party\'s rival, not your ally — is grandstanding on an issue that is squarely reserved to Westminster. Correct them and you look territorial; ignore them and the misinformation stands.',
    tags: ['westminster', 'media', 'party'],
    weight: 10, cooldownDays: 380,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 0 },
    choices: [
      {
        label: 'Put them right on the reserved line',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'You lay out, patiently and with the Scotland/Wales Act to hand, exactly where the power actually sits. Dry, correct, and unlikely to trend — but the record is straight.',
      },
      {
        label: 'Let it go and work your patch',
        effects: { stats: { integrity: 2, partyStanding: 2 } },
        outcomeText: 'You decline the constitutional wrestling match and spend the afternoon on casework instead. Less airtime, more thank-you letters.',
      },
    ],
  },
  {
    id: 'dev_double_hatting',
    title: 'Whose meeting is it anyway',
    body: 'A big employer in {constituency} is wobbling. Both you and the local member of the devolved parliament claim to be leading the rescue, and the company\'s comms team is quietly baffled about who actually speaks for the area.',
    tags: ['constituency', 'personal'],
    weight: 10, cooldownDays: 400,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 0 },
    choices: [
      {
        label: 'Plant the flag as the senior figure',
        effects: { stats: { profile: 3, partyStanding: 2 }, relationships: [{ kind: 'rival', delta: -2 }] },
        outcomeText: 'You make sure the press release goes out with your name on top. The devolved member seethes; the employer, at least, now knows one phone number to call.',
      },
      {
        label: 'Share the platform to get the win',
        effects: { stats: { competence: 3, integrity: 2 } },
        outcomeText: 'You swallow the turf instinct and stand shoulder to shoulder for the cameras. The jobs are saved and, briefly, the two parliaments look like they belong to the same country.',
      },
    ],
  },
  {
    id: 'dev_which_parliament',
    title: 'Which one of you is it, then',
    body: 'On the doorstep in {constituency}, a voter lists a health waiting time, a school, and a road, and demands to know which of the two governments is to blame. Untangling reserved from devolved would take an afternoon; the doorstep gives you thirty seconds.',
    tags: ['constituency', 'funny'],
    weight: 10, cooldownDays: 360,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 0 },
    choices: [
      {
        label: 'Give the honest, boring answer',
        effects: { stats: { integrity: 3, competence: 2 } },
        outcomeText: 'You explain, truthfully, that the road is yours to chase and the school is the devolved government\'s. The voter\'s eyes glaze — but they believe you, which on the doorstep is the whole game.',
      },
      {
        label: 'Blame the lot up the road',
        effects: { stats: { profile: 2, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You wave a hand at the devolved capital and let the buck stop there. Tidy, satisfying, and only about half fair — but the door closes on a nod, not a scowl.',
      },
    ],
  },
  {
    id: 'dev_intergov_summit',
    title: 'A seat at the joint committee',
    body: 'A rare intergovernmental meeting is convened over a project that crosses the settlement, and as a Westminster MP for {constituency} you can either turn up to fly the flag or send apologies and keep your diary clear.',
    tags: ['policy', 'westminster'],
    weight: 9, cooldownDays: 420,
    requires: { minorParty: false, region: ['scotland', 'wales', 'ni'], minTier: 1 },
    choices: [
      {
        label: 'Show up and do the diplomacy',
        effects: { stats: { competence: 4 }, relationships: [{ kind: 'leader', delta: 1 }] },
        outcomeText: 'You spend a long day in a windowless room where two governments distrust each other by protocol. Nothing dramatic is agreed, but a stalled project inches forward and the department notices you went.',
      },
      {
        label: 'Send apologies, save the day',
        effects: { stats: { partyStanding: 2 } },
        outcomeText: 'You decide the summit is theatre and stay on your patch. Probably right, mildly forgettable — the sort of choice nobody thanks you for and nobody remembers.',
      },
    ],
  },
];
