import { DecisionCard } from '../../types/content';

/** Opposition-specific life, tiers 0-3. */
export const SHADOW_CARDS: DecisionCard[] = [
  {
    id: 'sh_attack_line',
    title: 'The attack line',
    body: 'The government has dropped a bad statistic at 4:58pm on a Friday, the traditional hour for burying things. Your team can have an attack line out in twenty minutes — or a proper analysis by Monday.',
    tags: ['westminster', 'media'],
    weight: 13, cooldownDays: 240,
    requires: { inGovernment: false, maxTier: 3 },
    choices: [
      {
        label: 'Hit them now',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'Your quote makes every Saturday paper covering the story. Speed is its own argument in opposition: be the voice that\'s there when the anger is fresh.',
      },
      {
        label: 'Do the homework first',
        effects: { stats: { competence: 4 } },
        outcomeText: 'Monday\'s analysis finds the figure is even worse than it looked — and your forensic version of the story runs for three more days. Slower, deeper, deadlier.',
      },
    ],
  },
  {
    id: 'sh_cross_party',
    title: 'An offer across the aisle',
    body: 'A government backbencher proposes working together on a niche bill you both care about. Genuinely good policy — and politically awkward, because helping them helps the government look reasonable.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 400,
    requires: { inGovernment: false },
    choices: [
      {
        label: 'Work with them',
        effects: { stats: { integrity: 4, competence: 2 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: 'The bill passes with both your names on it. The whips on both sides are equally irritated, which feels like proof of concept. Somewhere in {constituency}, the people it helps neither know nor care whose rosette did what.',
      },
      {
        label: 'Decline — opposition means opposing',
        effects: { stats: { partyStanding: 2 } },
        outcomeText: 'You pass, politely. The bill dies in committee without opposition support. The whips approve of your discipline. The policy waits another five years for its moment.',
      },
    ],
  },
  {
    id: 'sh_long_game',
    title: 'The wilderness years',
    body: 'Another poll, another gap that won\'t close. Opposition is a marathon through treacle, and a colleague at the tearoom counter says what everyone thinks: "We could be out for a decade. Why are we even here?"',
    tags: ['party', 'personal', 'serious'],
    weight: 9, cooldownDays: 400,
    requires: { inGovernment: false },
    choices: [
      {
        label: 'Make the case for the long game',
        effects: { stats: { partyStanding: 3, integrity: 2 } },
        outcomeText: 'You give the tearoom the speech about oppositions becoming governments — every single one, eventually, that held its nerve. Someone slow-claps, but three colleagues stand a little straighter. Morale is maintenance work.',
      },
      {
        label: 'Quietly agree and focus on yourself',
        effects: { stats: { competence: 2, profile: 1 } },
        outcomeText: 'You let the gloom pass and spend the season building your own portfolio, profile and skills. If the tide ever turns, the prepared rise first. If it doesn\'t — well, you were always more employable than the speech-givers.',
      },
    ],
  },
  {
    id: 'sh_defector_approach',
    title: 'The unhappy government MP',
    body: 'A disillusioned government backbencher gets you alone and asks, in carefully deniable language, what crossing the floor would actually involve. This would be a coup — or a trap.',
    tags: ['party', 'westminster', 'serious'],
    weight: 7, cooldownDays: 700,
    requires: { inGovernment: false, minTier: 2 },
    choices: [
      {
        label: 'Reel them in carefully',
        effects: { stats: { partyStanding: 4, profile: 2 }, relationships: [{ kind: 'leader', delta: 5 }] },
        outcomeText: [
          { weight: 2, text: 'Three discreet meetings later, they cross the floor at the most damaging possible moment for the government. Your fingerprints are known to exactly the right people. The leader\'s office sends wine.' },
          { weight: 1, text: 'They get cold feet at the eleventh hour and stay put — and the government whips learn of the dalliance. Nothing attaches to you on paper. The episode files itself under "almost".' },
        ],
      },
      {
        label: 'Keep your distance',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'Defections are glamorous and defectors are trouble — ask anyone who has had to find one a safe seat. You pass word up the chain and stay clean. The approach, it later emerges, was being watched.',
      },
    ],
  },
  {
    id: 'sh_policy_vacuum',
    title: 'But what would YOU do?',
    body: 'A flagship interview. You attack the government\'s record with precision — and then comes the question opposition politicians dream about in cold sweats: "Fine. What would you do instead?"',
    tags: ['media', 'policy'],
    weight: 11, cooldownDays: 300,
    requires: { inGovernment: false, minTier: 1 },
    choices: [
      {
        label: 'Commit to a real alternative',
        effects: { stats: { integrity: 3, profile: 3 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You answer with an actual policy, numbers included. The interview is electric; the policy unit is apoplectic, since the policy is not, strictly speaking, agreed yet. It is by Friday — they had to.',
      },
      {
        label: 'Pivot back to their record',
        effects: { stats: { profile: 1 } },
        outcomeText: '"The question at this election will be their record" — the evergreen non-answer, competently delivered. The interviewer\'s eyebrow does most of the rebuttal. Nobody remembers the exchange by Tuesday, which was the point.',
      },
    ],
  },
  {
    id: 'sh_shadow_no_car',
    title: 'All of the work, none of the car',
    body: 'Shadow ministry: the same red-box hours as government, minus the civil service, the salary bump and the ministerial car. Tonight\'s task is responding to a 200-page white paper with a staff of one and a half.',
    tags: ['westminster', 'funny'],
    weight: 10, cooldownDays: 350,
    requires: { inGovernment: false, minTier: 3 },
    choices: [
      {
        label: 'Read all 200 pages anyway',
        effects: { stats: { competence: 4 } },
        outcomeText: 'You find the contradiction on page 174 that unravels the lot, and deploy it at the despatch box to visible ministerial discomfort. The car is overrated. (The car is not overrated. But the moment was good.)',
      },
      {
        label: 'Crowdsource it to friendly experts',
        effects: { stats: { competence: 2, profile: 1 } },
        outcomeText: 'Four think-tankers, two academics and one furious retired official dissect it overnight for the price of future access. Opposition runs on favours and caffeine. Your response lands sharp by morning.',
      },
    ],
  },
];
