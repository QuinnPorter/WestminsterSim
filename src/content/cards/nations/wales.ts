import { DecisionCard } from '../../../types/content';

/** Senedd only. The nation deck can name its nouns: Cardiff Bay, the Llywydd,
 *  Port Talbot, Betsi Cadwaladr, the 20mph limit. Fictional people throughout.
 *  No justice brief here: Wales has no justice powers. */
export const WALES_CARDS: DecisionCard[] = [
  // ── backbench / constituency ───────────────────────────────────────────
  {
    id: 'wal_20mph',
    title: 'Twenty is plenty',
    body: 'The default 20mph limit has been in force long enough for the casualty data to start coming in, and the petition against it is still the biggest the Senedd has ever received. In {constituency} the A-road through the village is the flashpoint, and the council is reviewing which stretches go back to thirty.',
    tags: ['constituency', 'policy'],
    weight: 12, cooldownDays: 360,
    requires: { arena: ['wales'], minTier: 0 },
    choices: [
      {
        label: 'Defend the policy',
        effects: { stats: { integrity: 2, partyStanding: 2, constituencyApproval: -3 } },
        outcomeText: 'You cite the casualty figures and the school on the corner. Both are real; so is the man who has written to you nine times about his commute.',
      },
      {
        label: 'Call for exemptions in your patch',
        effects: { stats: { constituencyApproval: 3, competence: 1, partyStanding: -2 } },
        outcomeText: 'You push the council to put the main road back to thirty and it does. The village is pleased and the school governors are not.',
      },
      {
        label: 'Call for a national rethink',
        effects: { stats: { profile: 2, integrity: -1, partyStanding: -3 } },
        outcomeText: 'You say the rollout was botched and the policy needs a reset, which is what the petition says and your own side does not. The clip travels.',
      },
    ],
  },
  {
    id: 'wal_senedd_96',
    title: 'Ninety-six',
    body: 'The Senedd is growing from sixty to ninety-six members on closed lists, and the public reaction to "more politicians" is about what you would expect. In {constituency} a man at the leisure centre has asked you to justify your own job before you have had a coffee.',
    tags: ['constituency', 'party', 'funny'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['wales'], minTier: 0 },
    choices: [
      {
        label: 'Defend the expansion',
        effects: { stats: { integrity: 2, competence: 1, constituencyApproval: -2 } },
        outcomeText: 'You explain that sixty people cannot scrutinise a twenty-billion-pound budget and he says they manage it in the pub. It is a fair point and you make the real one anyway.',
      },
      {
        label: 'Admit the timing is poor',
        effects: { stats: { integrity: 1, constituencyApproval: 1, partyStanding: -2 } },
        outcomeText: 'You say more members is right and the moment is wrong, which pleases nobody and sounds like you. {whip} marks it down as "freelancing".',
      },
      {
        label: 'Pivot to the closed lists',
        effects: { stats: { profile: 2, competence: 1, partyStanding: -1 } },
        outcomeText: 'You say the number is fine and the voting system is the problem — voters should pick names, not parties. Your own party, which likes the lists, is unamused.',
      },
    ],
  },
  {
    id: 'wal_second_homes',
    title: 'Lights on in winter',
    body: 'Gwynedd has set a 150 per cent council tax premium on second homes and holiday lets, and the result is, depending on who you ask, a village coming back to life or a tourism economy being strangled. The holiday-let owners in {constituency} want you to oppose the premium; the young couple at your surgery want you to double it.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['wales'], minTier: 0 },
    choices: [
      {
        label: 'Back the premium',
        effects: { stats: { integrity: 2, constituencyApproval: 2, profile: 1, partyStanding: 1 } },
        outcomeText: 'You say homes are for living in and the letting agents write to the paper. Two houses on the front come up for sale at prices that are still ridiculous, but less so.',
      },
      {
        label: 'Oppose it as an attack on tourism',
        effects: { stats: { constituencyApproval: -1, partyStanding: -2, competence: -1 } },
        outcomeText: 'You say the premium will kill the summer trade and the campaigners pin your voting record to the chapel noticeboard. The summer trade does fine.',
      },
      {
        label: 'Call for a licensing scheme instead',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You propose licensing holiday lets so councils can cap them street by street. It is sensible enough to be adopted and slow enough that nobody notices.',
      },
    ],
  },
  {
    id: 'wal_tfw_trains',
    title: 'The 8.14 from Rhyl',
    body: 'Transport for Wales has new trains, a new timetable and a punctuality figure that would embarrass a bus. The North Wales Metro remains a map, the Valleys electrification is late, and a commuter from {constituency} has sent you a spreadsheet of every cancellation since March.',
    tags: ['constituency', 'policy'],
    weight: 11, cooldownDays: 360,
    requires: { arena: ['wales'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Haul TfW in front of the committee',
        effects: { stats: { competence: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'You get the chief executive in front of the committee with the spreadsheet in your hand. Next month\'s figures are better, which tells you something about what was possible all along.',
      },
      {
        label: 'Defend the investment',
        effects: { stats: { partyStanding: 2, integrity: -1, constituencyApproval: -2 } },
        outcomeText: 'You say the new trains are coming and the figures will follow. The commuter sends you a photograph of a new train, cancelled.',
      },
      {
        label: 'Blame Network Rail and Westminster',
        effects: { stats: { partyStanding: 2, profile: 1, integrity: -2, competence: -1 } },
        outcomeText: 'You point out the track is reserved and the trains are not. It is true, it is tedious, and the 8.14 is still cancelled.',
      },
    ],
  },
  {
    id: 'wal_welsh_water',
    title: 'Not-for-profit, apparently',
    body: 'Welsh Water — the not-for-profit model Wales was proud of — has been fined for sewage spills, and a river in {constituency} is on the dirty list. Regulation is devolved, the company is Welsh, and for once nobody can blame Westminster, though several people are trying.',
    tags: ['constituency', 'policy', 'media'],
    weight: 11, cooldownDays: 400,
    requires: { arena: ['wales'], minTier: 0 },
    choices: [
      {
        label: 'Demand the regulator act',
        effects: { stats: { competence: 3, constituencyApproval: 2, profile: 1 } },
        outcomeText: 'You get Natural Resources Wales in front of the committee with the spill map. Enforcement notices follow, and the river is swimmable the summer after next, probably.',
      },
      {
        label: 'Defend the not-for-profit model',
        effects: { stats: { integrity: 1, partyStanding: 2, constituencyApproval: -2 } },
        outcomeText: 'You point out that the English companies are worse and the dividends here go into pipes. True, and the anglers of {constituency} are not comforted by comparison.',
      },
      {
        label: 'Join the swimmers\' protest',
        effects: { stats: { profile: 3, constituencyApproval: 3, competence: -1 } },
        outcomeText: 'You stand in the river in waders with a placard and it makes the national news. The chief executive asks for a meeting, which is the point of waders.',
      },
    ],
  },
  {
    id: 'wal_bilingual_chamber',
    title: 'Yn Gymraeg, os gwelwch yn dda',
    body: 'A member has made a long contribution in Welsh and the Llywydd has had to pause proceedings because the interpretation channel has failed again. Half the chamber has headphones; the other half has an opinion about the cost of the headphones. You are next to speak.',
    tags: ['westminster', 'party', 'funny'],
    weight: 9, cooldownDays: 440,
    requires: { arena: ['wales'], minTier: 0, maxTier: 2 },
    choices: [
      {
        label: 'Carry on in Welsh without the channel',
        effects: { stats: { integrity: 2, profile: 2, constituencyApproval: 1 } },
        outcomeText: 'You speak Cymraeg and let the chamber wait for the technician. The Welsh-language press is delighted and the Llywydd gives you a look that is nine parts gratitude.',
      },
      {
        label: 'Switch to English for the sake of time',
        effects: { stats: { competence: 1, integrity: -2, constituencyApproval: -1 } },
        outcomeText: 'You make the practical call and a columnist calls it "the language of convenience". You will be explaining it on Radio Cymru for a week.',
      },
      {
        label: 'Make a joke about the headphones',
        effects: { stats: { profile: 3, integrity: -1, partyStanding: -1 } },
        outcomeText: 'You get a laugh from both sides and a frown from the Llywydd, who has heard the joke before. It makes the evening bulletin, which is more than the policy you were about to announce.',
      },
    ],
  },

  // ── ministerial ────────────────────────────────────────────────────────
  {
    id: 'wal_port_talbot',
    title: 'Port Talbot',
    body: 'The steelworks is shutting its blast furnaces for an electric arc that needs a fraction of the workforce. The owner wants the UK subsidy, {othergov} wants the deal signed, the unions want the furnaces kept hot until the arc is ready, and you hold the Welsh Government\'s economy brief and almost none of the money.',
    tags: ['policy', 'crisis', 'serious'],
    weight: 12, cooldownDays: 480,
    requires: { arena: ['wales'], minTier: 3, inGovernment: true, department: ['business', 'energy', 'finance'] },
    choices: [
      {
        label: 'Put everything into the transition board',
        effects: { stats: { competence: 3, integrity: 2, partyStanding: -1 } },
        outcomeText: 'You pour every pound you have into retraining and the supply chain and say so plainly. It saves careers rather than jobs, and the town knows the difference.',
      },
      {
        label: 'Demand {othergov} keep a furnace lit',
        effects: { stats: { profile: 3, partyStanding: 2, competence: -1 } },
        outcomeText: 'You call for one blast furnace to stay open and make it a Wales-versus-London row. The furnace closes on schedule and the row keeps you on the news.',
      },
      {
        label: 'Back the arc deal and move on',
        effects: { stats: { competence: 1, integrity: -2, constituencyApproval: -2 } },
        outcomeText: 'You call it the only route to green steel and stand beside the UK minister at the announcement. The town will not forget the photograph.',
      },
    ],
  },
  {
    id: 'wal_cymraeg_2050',
    title: 'A million speakers',
    body: 'Cymraeg 2050 needs Welsh-medium schools opening faster than councils are building them, and a council in the English-speaking east has just voted against a new one. Parents on both sides have written to the education minister, which is you, and the Welsh Language Commissioner wants to know what you intend to do.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 420,
    requires: { arena: ['wales'], minTier: 3, inGovernment: true, department: ['education', 'culture'] },
    choices: [
      {
        label: 'Direct the council',
        effects: { stats: { integrity: 2, partyStanding: 2, profile: 1, constituencyApproval: -1 } },
        outcomeText: 'You use your powers to require the school and the council leader calls it Cardiff diktat. The school opens in three years with a waiting list.',
      },
      {
        label: 'Offer the council capital to go voluntarily',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You find a grant and the council rediscovers its enthusiasm. It is bribery in the public interest, which is most of government.',
      },
      {
        label: 'Leave it to local decision',
        effects: { stats: { integrity: -3, competence: -1, partyStanding: -1 } },
        outcomeText: 'You say local decisions are for local councils and the Commissioner issues a statement about the target. The target was always a long way off.',
      },
    ],
  },
  {
    id: 'wal_betsi_cadwaladr',
    title: 'Special measures, again',
    body: 'Betsi Cadwaladr, the health board for the whole of north Wales, is back in special measures: the vascular service, the mental health unit, the board that was sacked and the board that replaced it. As health minister you have inherited a problem that has outlived four predecessors.',
    tags: ['policy', 'crisis', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { arena: ['wales'], minTier: 3, inGovernment: true, department: ['health'] },
    choices: [
      {
        label: 'Break the board up',
        effects: { stats: { competence: 2, profile: 3, integrity: 1, partyStanding: -1 } },
        outcomeText: 'You announce a split into two smaller boards and the north cheers. The reorganisation costs two years and the waiting lists do not wait.',
      },
      {
        label: 'Send in a turnaround team',
        effects: { stats: { competence: 3, profile: -1 } },
        outcomeText: 'You parachute in managers from a board that works and give them eighteen months. Unglamorous and right; the north wants a scalp and gets a spreadsheet.',
      },
      {
        label: 'Defend the current board',
        effects: { stats: { partyStanding: 1, integrity: -2, constituencyApproval: -2 } },
        outcomeText: 'You say the new leadership needs time, and the vascular families are in the public gallery when you say it. The clip is not kind.',
      },
    ],
  },
  {
    id: 'wal_hs2_consequentials',
    title: 'Nothing from HS2',
    body: 'HS2 has been classed as an England-and-Wales project, which means Wales gets no Barnett consequential for a railway that never enters Wales. The figure is several billion, every party in the Senedd agrees it is a scandal, and as finance minister you must decide how much of the budget to stake on an argument you keep losing.',
    tags: ['policy', 'media', 'serious'],
    weight: 11, cooldownDays: 440,
    requires: { arena: ['wales'], minTier: 3, inGovernment: true, department: ['finance', 'transport'] },
    choices: [
      {
        label: 'Go to war on it',
        effects: { stats: { profile: 3, partyStanding: 3, competence: -1 } },
        outcomeText: 'You put the lost billions on a billboard outside the Treasury and the Welsh press runs it for a month. {othergov} reclassifies nothing and your base has never liked you more.',
      },
      {
        label: 'Trade the grievance for rail upgrades',
        effects: { stats: { competence: 4, integrity: 1, partyStanding: -2 } },
        outcomeText: 'You swap the argument for a package of station upgrades and a line to Cardiff Bay. It is a fraction of the figure and it is actually happening.',
      },
      {
        label: 'Commission a fiscal framework review',
        effects: { stats: { competence: 2, integrity: 2, profile: -2 } },
        outcomeText: 'You commission the dullest paper in Welsh politics and send it to the Treasury. It will matter in a decade, which is not a timeframe the lobby recognises.',
      },
    ],
  },

  // ── opposition frontbench ──────────────────────────────────────────────
  {
    id: 'wal_barnett_floor',
    title: 'Less than Scotland',
    body: 'The fiscal commission has reported again: Wales has a Barnett floor, Scotland gets more per head, and every Welsh government of every colour has said so to every UK government of every colour. As {party}\'s finance spokesperson you can make it a grievance or a plan.',
    tags: ['policy', 'media'],
    weight: 11, cooldownDays: 420,
    requires: { arena: ['wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Make it a grievance',
        effects: { stats: { profile: 3, partyStanding: 2, integrity: -1 } },
        outcomeText: 'You say Wales is short-changed and name the number. It is true, it is old, and it is still the easiest applause in Cardiff Bay.',
      },
      {
        label: 'Publish a needs-based alternative',
        effects: { stats: { competence: 4, integrity: 2, profile: -1 } },
        outcomeText: 'You publish a formula based on need, with tables. Three academics praise it, the Treasury ignores it, and it sits in a drawer for the government you hope to lead.',
      },
      {
        label: 'Turn it on {govparty}',
        effects: { stats: { partyStanding: 2, integrity: -2 } },
        outcomeText: 'You say the Welsh Government should spend what it has better before asking for more. Your benches like it; the number is still the number.',
      },
    ],
  },
  {
    id: 'wal_tourism_levy',
    title: 'A pound a night',
    body: 'The visitor levy — a pound or so a night on every hotel bed and campsite pitch, raised by councils that choose to — is through the Senedd and the first councils are opting in. The tourism industry says it will send visitors to Devon; the coastal councils say they have no other way to pay for the toilets. You speak for {party} on the economy.',
    tags: ['policy', 'media'],
    weight: 10, cooldownDays: 420,
    requires: { arena: ['wales'], minTier: 3, inGovernment: false },
    choices: [
      {
        label: 'Pledge to repeal it',
        effects: { stats: { partyStanding: 2, profile: 2, integrity: -1, competence: -1 } },
        outcomeText: 'You promise to scrap it and the tourism board sends champagne. The coastal councils ask how you will fund the toilets and you say "growth".',
      },
      {
        label: 'Accept the principle, savage the detail',
        effects: { stats: { competence: 3, integrity: 1, partyStanding: -1 } },
        outcomeText: 'You concede the levy and go after the exemptions, which is unsatisfying and correct. The industry is cross with you and so is your conference.',
      },
      {
        label: 'Back the councils',
        effects: { stats: { integrity: 3, profile: 1, partyStanding: -2 } },
        outcomeText: 'You side with the councils over your own instincts and say the visitors can pay a pound. A B&B owner in Tenby stops inviting you to things.',
      },
    ],
  },

  // ── First Minister ─────────────────────────────────────────────────────
  {
    id: 'wal_m4_relief_road',
    title: 'The relief road',
    body: 'The M4 around Newport is a car park every evening and the business lobby wants the relief road across the Gwent Levels revived. Your predecessor killed it on climate and cost; the report on your desk says the alternatives have not worked. Cardiff Bay expects a decision.',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 480,
    requires: { arena: ['wales'], leaderRole: ['pm'] },
    choices: [
      {
        label: 'Revive the road',
        effects: { stats: { profile: 2, partyStanding: 1, competence: 1, integrity: -2 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You announce a new route and the business lobby is delighted. The environmental groups chain themselves to a bridge, and the budget line is larger than two hospitals.',
      },
      {
        label: 'Hold the line and fund the alternatives',
        effects: { stats: { integrity: 3, competence: 2, partyStanding: -1 }, pollingShock: { party: 'gov', delta: -0.1 } },
        outcomeText: 'You put the money into the Metro and bus lanes and ask drivers for patience. The queue is still there in a year; so, slowly, is a new railway station.',
      },
      {
        label: 'Commission another review',
        effects: { stats: { partyStanding: 1, integrity: -2, competence: -1 } },
        outcomeText: 'You ask a commission to look again and it reports in two years. The M4 remains, as it has always been, a place to think.',
      },
    ],
  },
  {
    id: 'wal_cooperation_agreement',
    title: 'The Co-operation Agreement',
    body: 'The agreement that keeps your minority afloat — forty-six policies, no ministers, free school meals and a commission on the constitution — is up for review. Your partner across the chamber wants a Senedd vote on devolving justice; your own group wants the deal quietly ended before the election.',
    tags: ['party', 'policy', 'serious'],
    weight: 12, cooldownDays: 400,
    requires: { arena: ['wales'], leaderRole: ['pm'], arrangementIn: ['minority', 'supplyConfidence'] },
    choices: [
      {
        label: 'Extend it',
        effects: { stats: { competence: 2, integrity: 1, partyStanding: -2 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You renew the agreement for another year and the partner gets its justice vote. Your group grumbles about governing by committee and the budget passes first time.',
      },
      {
        label: 'Let it lapse',
        effects: { stats: { partyStanding: 3, competence: -1 }, pollingShock: { party: 'gov', delta: -0.1 } },
        outcomeText: 'You thank the partner warmly and end it, and the budget becomes a negotiation again. Your group is pleased; your finance minister has started drinking coffee at four.',
      },
      {
        label: 'Keep the policies, drop the partner',
        effects: { stats: { profile: 2, partyStanding: 2, integrity: -3 }, pollingShock: { party: 'gov', delta: 0.1 } },
        outcomeText: 'You keep the free school meals and the childcare and end the deal, which the partner calls theft and the voters call policy. It works, which is the uncomfortable part.',
      },
    ],
  },
];
