import { DecisionCard } from '../../types/content';

/** Science & Technology department cards — AI, research funding and science policy.
 *  Three buckets: government (Minister of State / Science Secretary), opposition
 *  (Shadow Science Secretary) and third-party spokesperson. Themes lean on AI safety,
 *  the R&D budget, sovereign compute and the perennial brain-drain. */
export const SCIENCE_TECH_CARDS: DecisionCard[] = [
  // ===================== GOVERNMENT =====================
  {
    id: 'sci_ai_strategy',
    title: 'The AI dispatch box',
    body: 'The {department} brief\'s defining choice has arrived: a hard statutory regime to govern frontier AI, or a light-touch "pro-innovation" framework to keep the labs onshore. The think tanks, the unions and Silicon Valley are all in your inbox.',
    tags: ['policy', 'serious'],
    weight: 16, cooldownDays: 800,
    requires: { inGovernment: true, department: ['scienceTech'], minTier: 3 },
    choices: [
      {
        label: 'Legislate hard on AI safety',
        effects: { stats: { integrity: 3, profile: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You put guardrails in the statute book and lead the world on safety. The public nods; two unicorns quietly book meetings in Dublin.',
      },
      {
        label: 'A light-touch, pro-growth framework',
        effects: { stats: { competence: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'You back British innovation and the investment headlines follow. The safety campaigners warn you are marking the homework of the people who wrote it.',
      },
    ],
  },
  {
    id: 'sci_rd_budget',
    title: 'The R&D settlement',
    body: 'The spending review pits your research budget against everything else. The Treasury wants the 2.4%-of-GDP science pledge "rephased"; the universities say another flat year means labs go dark and post-docs go abroad.',
    tags: ['policy', 'serious'],
    weight: 14, cooldownDays: 900,
    requires: { inGovernment: true, department: ['scienceTech'], minTier: 4 },
    choices: [
      {
        label: 'Go to the wall for the science budget',
        effects: { stats: { integrity: 3, partyStanding: -2, competence: 2 } },
        outcomeText: [
          { weight: 2, text: 'You threaten to resign over it and the Chancellor blinks. The sector hails you as the minister who finally fought their corner.' },
          { weight: 1, text: 'You fight and lose; the settlement is grim and your authority with it. The labs send their gratitude and their CVs to Boston.', extra: { stats: { competence: -2, profile: -2 } } },
        ],
      },
      {
        label: 'Accept the rephasing, protect the rest',
        effects: { stats: { competence: 2, integrity: -2 } },
        outcomeText: 'You take the hit quietly to keep the department\'s lights on elsewhere. Pragmatic — and a gift to every opposition press release about decline.',
      },
    ],
  },
  {
    id: 'sci_sovereign_compute',
    title: 'A sovereign compute gamble',
    body: 'A consortium wants billions of public money for a UK-owned AI supercomputer and chip-fab — a moonshot for sovereign capability, or a white elephant that the market will lap before the concrete sets. The {govparty} backbenches are split.',
    tags: ['policy', 'westminster'],
    weight: 13, cooldownDays: 700,
    requires: { inGovernment: true, department: ['scienceTech'], minTier: 3 },
    choices: [
      {
        label: 'Fund the moonshot',
        effects: { stats: { profile: 3, competence: 1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You announce it under a banner the size of a barn. Bold, nation-building, and entirely hostage to whether it actually works.',
      },
      {
        label: 'Back skills and start-ups instead',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You spread the money across people and small firms rather than one cathedral of silicon. Sensible, unshowy, and impossible to cut a ribbon on.',
      },
    ],
  },

  // ===================== OPPOSITION (Shadow Science Secretary) =====================
  {
    id: 'shsci_ai_safety_attack',
    title: 'The model that misbehaved',
    body: 'A frontier model has been caught generating exactly the dangerous output the government swore its framework prevented. As shadow {department} lead, the open goal is in front of you — but the science is genuinely contested.',
    tags: ['media', 'policy'],
    weight: 13, cooldownDays: 320,
    requires: { inGovernment: false, department: ['scienceTech'], minTier: 3 },
    choices: [
      {
        label: 'Demand the Science Secretary resign',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You go for the jugular on every bulletin. Cut-through guaranteed; the experts mutter that you have flattened a hard problem into a headline.',
      },
      {
        label: 'Table serious amendments instead',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You write the clauses the government should have, and dare them to vote against safety. Less noise, but the lobby starts calling you for the substance.',
      },
    ],
  },
  {
    id: 'shsci_brain_drain',
    title: 'The brain drain numbers',
    body: 'A leaked Royal Society analysis shows record numbers of British researchers leaving for better-funded labs abroad. The {party} can own the story — or risk talking the country down ahead of an election.',
    tags: ['media', 'serious'],
    weight: 12, cooldownDays: 340,
    requires: { inGovernment: false, department: ['scienceTech'], minTier: 3 },
    choices: [
      {
        label: 'Make it a national-decline story',
        effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You turn the spreadsheet into a morning round and a poster. Effective — though the vice-chancellors wince at being cast as the funeral.',
      },
      {
        label: 'Launch a positive "bring them home" plan',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'You pivot to a fully-costed returners\' fellowship scheme. It earns grudging respect from the sector and a "where\'s the money coming from?" from the government benches.',
      },
    ],
  },
  {
    id: 'shsci_procurement',
    title: 'The contract that wasn\'t tendered',
    body: 'A nine-figure government AI contract has gone to a firm whose founder donates to the {govparty}. Cronyism, or just the only outfit that could do the job? Your researchers think there is a thread to pull.',
    tags: ['westminster', 'scandal'],
    weight: 12, cooldownDays: 360,
    requires: { inGovernment: false, department: ['scienceTech'], minTier: 3 },
    choices: [
      {
        label: 'Refer it to the watchdogs',
        effects: { stats: { integrity: 3, competence: 2 } },
        outcomeText: 'You write to the NAO and the standards commissioner with the dates and the donations lined up. Slow-burn, but the kind of thing that ends ministers.',
      },
      {
        label: 'Brief it out hard, now',
        effects: { stats: { profile: 3, integrity: -1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You get it on the front page before the facts are fully nailed down. A good day\'s damage — and a libel lawyer\'s letter by Friday.',
      },
    ],
  },

  // ===================== THIRD-PARTY SPOKESPERSON =====================
  {
    id: 'tpsci_ai_ethics',
    title: 'The conscience on AI',
    body: 'As your party\'s science spokesperson you have a free hand the big two envy: you can stake out the uncompromising ethical line on AI that neither government nor opposition dares to. Principle, or just shouting from the margins?',
    tags: ['policy', 'westminster'],
    weight: 12, cooldownDays: 320,
    requires: { inGovernment: false, minorParty: true, department: ['scienceTech'] },
    choices: [
      {
        label: 'Demand a moratorium on the riskiest models',
        effects: { stats: { integrity: 4, profile: 2 } },
        outcomeText: 'You plant a flag well to the safe side of the debate. Purists love it; the front benches file you under "noble and irrelevant" — for now.',
      },
      {
        label: 'Champion workers displaced by automation',
        effects: { stats: { profile: 3, partyStanding: 2 } },
        outcomeText: 'You make it about the call-centre and the warehouse, not the lab. It lands where the big parties\' abstractions do not — your inbox fills up.',
      },
    ],
  },
  {
    id: 'tpsci_regional_research',
    title: 'The lab that left your patch',
    body: 'A research institute in your region is closing, its funding sucked toward the golden triangle. As {party} science spokesperson, the parochial fight and the national argument about R&D centralisation are the same fight.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 340,
    requires: { inGovernment: false, minorParty: true, department: ['scienceTech'] },
    choices: [
      {
        label: 'Lead a save-the-lab campaign',
        effects: { stats: { constituencyApproval: 4, profile: 1 } },
        outcomeText: 'You turn up with the petition, the placards and the local paper. Whether or not the lab survives, your patch sees you fighting for it.',
      },
      {
        label: 'Make it a case for regional science funding',
        effects: { stats: { competence: 3, profile: 2 } },
        outcomeText: 'You zoom out to a serious pitch on spreading research beyond the South East. Wonkier, but it gets you onto the policy programmes the big parties watch.',
      },
    ],
  },
  {
    id: 'tpsci_open_science',
    title: 'Who owns the data?',
    body: 'A bill would let private firms train models on NHS and public-sector data. Your party can be the lonely voice for open science and public ownership of public data — a clear cause, if a niche one.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { inGovernment: false, minorParty: true, department: ['scienceTech'] },
    choices: [
      {
        label: 'Fight to keep public data public',
        effects: { stats: { integrity: 4, profile: 1 } },
        outcomeText: 'You table the amendment and the campaign groups rally behind you. A small army, but a loud and well-organised one.',
      },
      {
        label: 'Cut a deal: access for a public stake',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You propose firms pay into a public fund for the privilege. Grown-up, tradeable, and just the sort of thing a minority party can make happen.',
      },
    ],
  },
];
