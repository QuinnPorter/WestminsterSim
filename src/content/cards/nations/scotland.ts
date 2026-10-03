import { DecisionCard } from '../../../types/content';

/** Holyrood only. The nation deck can name its nouns: Bute House, CalMac,
 *  Section 30, the Scottish Child Payment. Fictional people throughout. */
export const SCOTLAND_CARDS: DecisionCard[] = [
  // ── backbench / constituency ───────────────────────────────────────────
  {
    id: 'sco_trams_extension',
    title: 'The tram to nowhere, extended',
    body: 'The Edinburgh tram — late, over budget and the subject of an inquiry that cost more than some of the track — is finally popular, and the council wants the next extension. The capital\'s MSPs are being lobbied; the rest of Scotland would like to know why Edinburgh gets another tram and {constituency} gets a bus cut.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['scotland'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Back the extension',
        effects: { stats: { competence: 2, profile: 1, constituencyApproval: -2 } },
        outcomeText: 'You say the tram has worked and the extension should happen. In Edinburgh you are sensible; in {constituency} you are asked about the bus.',
      },
      {
        label: 'Demand the money for your patch first',
        effects: { stats: { constituencyApproval: 3, partyStanding: -1, competence: -1 } },
        outcomeText: 'You stand up in the chamber and ask how many rural buses one tram stop buys. Your constituents cheer; the capital\'s members look at you as if you have said something in Latin.',
      },
      {
        label: 'Call for a national transport plan',
        effects: { stats: { competence: 2, integrity: 1 } },
        outcomeText: 'You ask for a strategy that ranks projects on their merits, which sounds like a dodge and is in fact a policy. It is commissioned. It is three hundred pages.',
      },
    ],
  },
  {
    id: 'sco_gaelic_unit',
    title: 'Sgoil Ghàidhlig',
    body: 'Parents in {constituency} want a Gaelic-medium primary unit, the council says the numbers are not there, and the campaign has turned up a surprising amount of feeling on both sides. The education secretary would quite like the local MSP to make a decision so they do not have to.',
    tags: ['constituency', 'policy'],
    weight: 10, cooldownDays: 440,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Champion the unit',
        effects: { stats: { constituencyApproval: 2, integrity: 2, profile: 1, partyStanding: -1 } },
        outcomeText: 'You back the parents and the unit opens with eleven pupils and a teacher recruited from Lewis. It is small, it is real, and the letters column takes a year to calm down.',
      },
      {
        label: 'Side with the council',
        effects: { stats: { competence: 1, constituencyApproval: -2, integrity: -1 } },
        outcomeText: 'You say the numbers are the numbers and the parents drive forty minutes a day to the next unit over. Some of them stop voting for you.',
      },
      {
        label: 'Broker a shared teacher',
        effects: { stats: { competence: 3, constituencyApproval: 1 } },
        outcomeText: 'You get two schools to share a Gaelic teacher and a minibus. Neither side is happy and both are better off.',
      },
    ],
  },
  {
    id: 'sco_land_reform_glen',
    title: 'Who owns the glen',
    body: 'The estate above {constituency} — forty thousand acres, one owner, an address in Monaco — is up for sale, and the community wants to use the right to buy. The land reform bill is in committee, the asking price is eye-watering, and the young families are leaving on the next bus.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 440,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Back the community buy-out',
        effects: { stats: { constituencyApproval: 4, profile: 2, partyStanding: -1 } },
        outcomeText: 'You lobby the Scottish Land Fund until it finds the money and the glen belongs to the eighty people who live in it. The first thing they build is six houses; the second is a pub.',
      },
      {
        label: 'Push the land reform bill harder',
        effects: { stats: { integrity: 2, competence: 2, profile: 1, partyStanding: -2 } },
        outcomeText: 'You table amendments to cap landholdings and the lairds\' association writes a letter that uses the word "Bolshevik". The amendments are watered down and the glen is bought by a fund.',
      },
      {
        label: 'Court the incoming buyer',
        effects: { stats: { competence: 2, integrity: -2, constituencyApproval: -1 } },
        outcomeText: 'You meet the new owner, who promises jobs and a rewilding project. The jobs are four, the deer are many, and the bus still leaves.',
      },
    ],
  },
  {
    id: 'sco_glasgow_housing',
    title: 'Housing emergency',
    body: 'Glasgow has declared a housing emergency: temporary accommodation is full, the hotels are full, and a family from {constituency} has been placed two bus rides from the children\'s school. The housing minister says the Westminster cut is to blame; the council says the Scottish Government\'s cut is to blame.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Fight for the family',
        effects: { stats: { constituencyApproval: 4, competence: 1, profile: 1 } },
        outcomeText: 'You get them moved within the week by being unpleasant to the right official. There are three hundred more on the list, and you know it.',
      },
      {
        label: 'Demand the affordable housing budget be restored',
        effects: { stats: { integrity: 2, profile: 2, partyStanding: -2 } },
        outcomeText: 'You say in the chamber that the government cut the housing budget and should put it back. Your own side does not love it; the housing charities do.',
      },
      {
        label: 'Pin it on the block grant',
        effects: { stats: { partyStanding: 3, integrity: -2 } },
        outcomeText: 'You blame the Treasury and the chamber nods along. The family is still two bus rides away.',
      },
    ],
  },
  {
    id: 'sco_just_transition',
    title: 'Granite and gas',
    body: 'A North Sea operator is winding down a field and six hundred jobs in Aberdeen, blaming the windfall tax; the climate groups say good; the unions say where is the just transition you promised. {constituency}\'s share of the supply chain is in the room when they ask.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Stand with the workers',
        effects: { stats: { constituencyApproval: 3, profile: 2, partyStanding: -2 } },
        outcomeText: 'You call for new licences and the climate wing of your own party is appalled. The oil town is grateful and the glaciers are not consulted.',
      },
      {
        label: 'Hold the climate line',
        effects: { stats: { integrity: 3, partyStanding: 1, constituencyApproval: -3 } },
        outcomeText: 'You say the field was always going to close and the question is what comes next. It is true, and the man who asked it drives a crew bus.',
      },
      {
        label: 'Ask why the transition fund has not spent',
        effects: { stats: { competence: 3, integrity: 1, constituencyApproval: 1 } },
        outcomeText: 'You discover the fund has spent eleven per cent of its allocation and ask why in the chamber. Three projects are approved within the month, which tells you what the delay was.',
      },
    ],
  },
  {
    id: 'sco_council_tax_centre',
    title: 'Frozen from Edinburgh',
    body: 'The First Minister announced a council tax freeze from the conference stage without telling the councils, the finance secretary or you. The council covering {constituency} had already pencilled in a seven per cent rise and is now short of money and patience. COSLA is on the phone.',
    tags: ['constituency', 'party', 'policy'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Defend the freeze',
        effects: { stats: { partyStanding: 3, constituencyApproval: 1, integrity: -2 } },
        outcomeText: 'You call it a lifeline for households and tell the council to find efficiencies. It finds them in the library opening hours.',
      },
      {
        label: 'Side with the council',
        effects: { stats: { constituencyApproval: 2, integrity: 2, partyStanding: -3 } },
        outcomeText: 'You say councils should set council tax, which is a principle your party held until the speech. The councillors are grateful and the whips are not.',
      },
      {
        label: 'Demand it be funded in full',
        effects: { stats: { competence: 3, partyStanding: -1 } },
        outcomeText: 'You join the cross-party push for full compensation and win most of it. Nobody is grateful; the pool stays open.',
      },
    ],
  },
  {
    id: 'sco_islands_autonomy',
    title: 'Our islands, our choice',
    body: 'Orkney\'s council has voted to explore "alternative governance" — Crown dependency, Faroe-style autonomy, Norway was mentioned — and Shetland is watching with interest. The ferries are old, the oil money is going, and the islands would like Edinburgh to notice them as something other than a backdrop.',
    tags: ['policy', 'constituency', 'funny'],
    weight: 9, cooldownDays: 480,
    requires: { arena: ['scotland'], minTier: 0 },
    choices: [
      {
        label: 'Back more island autonomy',
        effects: { stats: { integrity: 2, profile: 2, partyStanding: -2 } },
        outcomeText: 'You say the islands should control their own seabed and ferries, which is the argument your party makes about Scotland and not about Orkney. The irony is pointed out to you, at length.',
      },
      {
        label: 'Dismiss it as theatre',
        effects: { stats: { partyStanding: 1, competence: 1, integrity: -1, constituencyApproval: -1 } },
        outcomeText: 'You call it a stunt and move on. The council leader is on the radio next morning explaining the Lerwick ferry timetable to a nation that had not thought about it.',
      },
      {
        label: 'Offer an islands deal',
        effects: { stats: { competence: 3, profile: 1 } },
        outcomeText: 'You propose a package: ferries, Crown Estate seabed revenue, a seat at the table. It is adopted in a diluted form and the word "Norway" is quietly retired.',
      },
    ],
  },

  // ── ministerial ────────────────────────────────────────────────────────
  {
    id: 'sco_section35',
    title: 'Section 35',
    body: 'The Secretary of State has used Section 35 of the Scotland Act for the first time in its history to block a bill Holyrood passed, and the bill is yours. The constitutional case is strong, the policy is divisive, and the two are now welded together.',
    tags: ['policy', 'media', 'serious'],
    weight: 11, cooldownDays: 480,
    requires: { arena: ['scotland'], minTier: 3, inGovernment: true, department: ['socialJustice', 'constitution', 'justice'] },
    choices: [
      {
        label: 'Go to court on the constitution',
        effects: { stats: { integrity: 2, profile: 3, partyStanding: 2, competence: -1 } },
        outcomeText: 'You judicially review the order and lose in the Court of Session. The constitutional point is made and the bill is dead; both are true for a long time.',
      },
      {
        label: 'Amend the bill to meet the objections',
        effects: { stats: { competence: 3, integrity: 1, partyStanding: -3 } },
        outcomeText: 'You offer changes to address the Secretary of State\'s concerns and the campaigners call it a capitulation. The amended bill never quite comes back.',
      },
      {
        label: 'Drop it and move on',
        effects: { stats: { partyStanding: 1, competence: 1, integrity: -3 } },
        outcomeText: 'You announce the government will not pursue the matter further and the chamber is furious in three directions. Six months later it is barely mentioned, which was the point.',
      },
    ],
  },
  {
    id: 'sco_ferries',
    title: 'Hull 802',
    body: 'The second of the two ferries from the Port Glasgow yard is late again — years late, the price trebled, the hull once launched with painted-on windows. CalMac\'s ageing fleet is breaking down weekly, the islanders are furious, and you are the transport minister who inherited it.',
    tags: ['policy', 'crisis', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { arena: ['scotland'], minTier: 3, inGovernment: true, department: ['transport', 'finance', 'business'] },
    choices: [
      {
        label: 'Pour in more money and finish them',
        effects: { stats: { competence: 1, integrity: 1, partyStanding: -2 } },
        outcomeText: 'You sign another cheque and set a date, your third. The ferry sails, eventually, and the public inquiry opens the week it does.',
      },
      {
        label: 'Charter from Norway for the summer',
        effects: { stats: { competence: 3, profile: 1, partyStanding: -2 } },
        outcomeText: 'You charter a vessel for the summer timetable and the islands get a service. The yard\'s unions call it a betrayal; the islanders call it a boat.',
      },
      {
        label: 'Put the yard up for sale',
        effects: { stats: { competence: 2, integrity: -2, partyStanding: -1, constituencyApproval: -1 } },
        outcomeText: 'You announce a sale process and the Inverclyde benches erupt. The buyer, when one appears, wants a subsidy larger than the ferries.',
      },
    ],
  },
  {
    id: 'sco_income_tax',
    title: 'The Scottish rate',
    body: 'The budget is due and the modelling is on your desk. Another penny on the higher rates raises real money for the NHS; it also widens the gap with England to the point where the papers are running stories about consultants moving to Carlisle. The First Minister wants a headline either way.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['scotland'], minTier: 3, inGovernment: true, department: ['finance'] },
    choices: [
      {
        label: 'Raise the higher rates',
        effects: { stats: { partyStanding: 3, competence: 1, integrity: 1, constituencyApproval: -2 } },
        outcomeText: 'You raise them and call it the social contract. The money is real, and so is the tax adviser in Edinburgh who has never been busier.',
      },
      {
        label: 'Freeze the thresholds instead',
        effects: { stats: { competence: 3, partyStanding: 1, integrity: -2 } },
        outcomeText: 'You leave the rates alone and let inflation do the work, which is a tax rise you do not have to announce. The IFS notices; almost nobody else does, this year.',
      },
      {
        label: 'Hold the line with England',
        effects: { stats: { competence: 2, integrity: 1, partyStanding: -3 } },
        outcomeText: 'You decline to widen the gap and the spending departments find out what that means. The business lobby is pleased for a fortnight.',
      },
    ],
  },

  // ── opposition frontbench ──────────────────────────────────────────────
  {
    id: 'sco_national_care_service',
    title: 'A service in search of a bill',
    body: 'The National Care Service Bill has been delayed again, its budget has spent itself on consultants, and the councils and unions who were meant to deliver it have walked out of the talks. As {party}\'s health spokesperson you can kill it, save it, or own the vacuum.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['scotland'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Call for it to be scrapped',
        effects: { stats: { profile: 3, partyStanding: 2, integrity: -1 } },
        outcomeText: 'You call it a vanity project and demand the money go to care homes now. It is a good line and the care homes still do not get the money.',
      },
      {
        label: 'Offer cross-party work on a smaller version',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -2 } },
        outcomeText: 'You offer the government a way out: a national framework, local delivery, your votes. They take it, grudgingly, and your own side wonders why you helped.',
      },
      {
        label: 'Publish your own costed plan',
        effects: { stats: { profile: 2, competence: 2, integrity: 1, partyStanding: -1 } },
        outcomeText: 'You publish an alternative with numbers attached, which in opposition is a form of recklessness. It is taken seriously, which means it is attacked properly.',
      },
    ],
  },
  {
    id: 'sco_child_payment',
    title: 'Twenty-six pounds a week',
    body: 'The Scottish Child Payment is the government\'s proudest achievement and the one line in the budget nobody dares cut. An anti-poverty coalition wants it raised; the Fraser of Allander Institute says it already eats the welfare budget. As {party}\'s spokesperson you have to say a number.',
    tags: ['policy', 'media', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { arena: ['scotland'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Outbid the government',
        effects: { stats: { partyStanding: 2, profile: 2, integrity: -1, competence: -1 } },
        outcomeText: 'You promise forty pounds and the campaigners cheer. The question "funded how" arrives within the hour and your answer involves the word "efficiencies".',
      },
      {
        label: 'Back it at the current level',
        effects: { stats: { competence: 2, integrity: 1, partyStanding: -1 } },
        outcomeText: 'You say it is the right policy at the right level and ask about the processing backlog instead. Sensible; nobody puts "sensible" on a leaflet.',
      },
      {
        label: 'Argue for targeting',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -3 } },
        outcomeText: 'You say the money should follow the deepest poverty, not the headline. It is a proper argument and {govparty}\'s backbenchers enjoy quoting it back at you for a year.',
      },
    ],
  },

  // ── First Minister ─────────────────────────────────────────────────────
  {
    id: 'sco_section30',
    title: 'Dear Prime Minister',
    body: 'Your officials have drafted the letter: a formal request under Section 30 for the power to hold a second independence referendum. The last one was refused in a paragraph, the movement wants it sent regardless, and the Lord Advocate\'s advice is in a sealed folder you have not yet opened.',
    tags: ['policy', 'party', 'serious'],
    weight: 12, cooldownDays: 480,
    requires: { arena: ['scotland'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Send it and make the refusal the story',
        effects: { stats: { partyStanding: 4, profile: 2, competence: -1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You send it, {otherleader} refuses it, and you hold a rally in George Square about democracy denied. The movement is energised and no closer to a ballot box.',
      },
      {
        label: 'Hold it back and talk about governing',
        effects: { stats: { competence: 3, integrity: 1, partyStanding: -4 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'You say the time is not right and go back to the ferries and the waiting lists. The pragmatists nod; Saturday\'s march has a new placard with your face on it.',
      },
      {
        label: 'Legislate without consent and dare the Supreme Court',
        effects: { stats: { profile: 4, integrity: 2, partyStanding: 2, competence: -2 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'You introduce a referendum bill and the case goes to London. The judgment, when it comes, is unanimous and not in your favour, and the movement has a new grievance to march under.',
      },
    ],
  },
  {
    id: 'sco_green_agreement',
    title: 'The agreement',
    body: 'Your government rests on a formal agreement with the Greens: two junior ministers, a shared programme, and a clause on oil and gas your business wing has never accepted. The Greens are now threatening to walk over a climate target you are about to miss.',
    tags: ['party', 'policy', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { arena: ['scotland'], leaderRole: ['pm'], arrangementIn: ['minority', 'supplyConfidence', 'coalition'] },
    choices: [
      {
        label: 'Keep them in — restate the target',
        effects: { stats: { competence: 1, integrity: 1, partyStanding: -3 }, pollingShock: { party: 'gov', delta: -0.1 } },
        outcomeText: 'You announce a plan to meet the target that your officials describe as "stretching". The Greens stay; the business lobby funds {rival}\'s next dinner.',
      },
      {
        label: 'End the agreement',
        effects: { stats: { partyStanding: 3, competence: -2, integrity: -1 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You end the deal on a Thursday and the Greens vote against you by Tuesday. You now count every vote on every afternoon, and Bute House feels larger.',
      },
      {
        label: 'Call their bluff',
        effects: { stats: { profile: 2, integrity: 2, competence: 1 } },
        outcomeText: 'You tell them the door is open and watch them not walk through it. The agreement survives, thinner, and everyone in the room knows who blinked.',
      },
    ],
  },
];
