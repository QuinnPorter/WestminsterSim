import { DecisionCard } from '../../types/content';

/** Scrutiny and survival for third / minor-party MPs — gated minorParty:true, so
 *  these never reach the official Opposition. The small-party experience:
 *  no staff, no airtime, holding BOTH big parties to account, and the occasional
 *  moment when a handful of votes suddenly matters. Lighter polling impact. */
export const THIRD_PARTY_CARDS: DecisionCard[] = [
  {
    id: 'tp_no_staff',
    title: 'A party of one (and a half)',
    body: 'A 400-page government bill needs scrutinising and your entire {party} research operation is you, a caseworker and an intern who starts Tuesday. The big parties have whole teams.',
    tags: ['westminster', 'funny'],
    weight: 13, cooldownDays: 300,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Find the one killer clause',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You cannot read all 400 pages, so you find the one that matters and ambush the minister with it. Punching above your weight is the whole job.',
      },
      {
        label: 'Crowdsource it to the experts',
        effects: { stats: { competence: 2, profile: 1 }, relationships: [{ kind: 'journalist', delta: 2 }] },
        outcomeText: 'You ring every friendly academic and campaigner you know. By morning you have a briefing the big parties would envy — assembled for the price of coffee.',
      },
    ],
  },
  {
    id: 'tp_airtime',
    title: 'The producer never calls',
    body: 'A huge story has broken in your area of expertise, and the broadcasters have booked the same two big-party faces as always. Your {party} press officer is on hold to the newsdesk for the third time.',
    tags: ['media', 'party'],
    weight: 12, cooldownDays: 320,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Make noise they can\'t ignore',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You stage a stunt, post a viral clip, and force your way onto the bulletin. Undignified, effective — small parties are seen or they are nothing.',
      },
      {
        label: 'Build authority for the long run',
        effects: { stats: { competence: 4 } },
        outcomeText: 'You skip the circus and publish a serious paper instead. Few read it now; the journalists who cover the issue properly file your number under "calls back, knows the detail".',
      },
    ],
  },
  {
    id: 'tp_both_sides',
    title: 'A plague on both their houses',
    body: 'The government has done something indefensible — and the official Opposition is too scared of the headlines to say so. The space to be the only honest voice in the room is yours, if you want it.',
    tags: ['westminster', 'media', 'serious'],
    weight: 12, cooldownDays: 320,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Attack both the big parties',
        effects: { stats: { integrity: 4, profile: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You skewer the government and the Opposition\'s cowardice in the same breath. "They\'re all the same" is a tired line — but today you made it land.',
      },
      {
        label: 'Pick the winnable fight with the government',
        effects: { stats: { competence: 3, partyStanding: 2 } },
        outcomeText: 'You train your fire on the government alone and keep the Opposition as occasional allies. Less pure, more effective in the division lobby.',
      },
    ],
  },
  {
    id: 'tp_balance_of_power',
    title: 'Your votes suddenly matter',
    body: 'A knife-edge division is looming and, for once, the government cannot win it without your tiny {party} bloc. The whips of both big parties — who normally cannot remember your name — would love a word.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Extract a concession for your cause',
        effects: { stats: { competence: 4, profile: 2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You name your price — a real win for the people who sent you — and deliver your votes. For one afternoon, the minnow set the terms.',
      },
      {
        label: 'Vote on principle, no deals',
        effects: { stats: { integrity: 5, partyStanding: 3 } },
        outcomeText: 'You decline to trade and vote your conscience. The wheeler-dealers think you naive; your members think you exactly why they joined.',
      },
    ],
  },
  {
    id: 'tp_single_issue',
    title: 'The campaign of a lifetime',
    body: 'The one issue your {party} exists for has a genuine shot at a breakthrough this session. Go all-in and you might actually win it — at the cost of looking like a single-issue outfit forever.',
    tags: ['policy', 'party'],
    weight: 11, cooldownDays: 380,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Throw everything at it',
        effects: { stats: { integrity: 4, profile: 3 } },
        outcomeText: 'You pour every favour and every hour into the cause and drag it within sight of the line. Win or lose, nobody can say you didn\'t mean it.',
      },
      {
        label: 'Broaden out to look like a real party',
        effects: { stats: { competence: 3, partyStanding: 2 } },
        outcomeText: 'You deliberately widen the offer so the cameras stop calling you a pressure group. The purists fret; the strategists finally exhale.',
      },
    ],
  },
  {
    id: 'tp_principled_stand',
    title: 'The vote that costs nothing',
    body: 'A motion is before the House that the big parties are agonising over for fear of the marginals. You hold no marginals — you hold no power — so you are free to do the right thing loudly.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Take the principled stand',
        effects: { stats: { integrity: 5, profile: 2 } },
        outcomeText: 'You say the thing the big parties only whisper. Freedom from power has exactly one upside, and today you spent it well.',
      },
      {
        label: 'Stay disciplined and on-message',
        effects: { stats: { competence: 2, partyStanding: 3 } },
        outcomeText: 'You resist the grand gesture and stick to the agreed line. Less heroic, but a party that wants to grow learns to choose its moments.',
      },
    ],
  },
  {
    id: 'tp_pact_tease',
    title: 'A whisper of a pact',
    body: 'A bigger party quietly signals it might stand aside in a few seats where your {party} is strong — if you play nicely on the issues that matter to them. It could mean real MPs. It could mean your soul.',
    tags: ['party', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Explore the arrangement',
        effects: { stats: { competence: 3, integrity: -2 } },
        outcomeText: 'You take the meeting and keep your options open. A path to Westminster opens up — and a faction of your members starts drafting a resignation letter.',
      },
      {
        label: 'Reject it — independence first',
        effects: { stats: { integrity: 4, partyStanding: 3 } },
        outcomeText: 'You say no to the stitch-up and keep your hands clean. The members adore the purity; the psephologist mourns the seats you just turned down.',
      },
    ],
  },
  {
    id: 'tp_devolved_tension',
    title: 'Westminster versus home',
    body: 'Your party runs things back home, and tonight Westminster wants to do something that cuts across the devolved settlement. Do you fight it as an affront to {constituency} and your nation, or pick a calmer battle?',
    tags: ['policy', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { inGovernment: false, minorParty: true, partyIn: ['snp', 'pc'], minTier: 0 },
    choices: [
      {
        label: 'Make it a constitutional fight',
        effects: { stats: { profile: 4, partyStanding: 3 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'You frame it as Westminster trampling on your nation, and the row writes itself. Grievance, deployed with precision, is your party\'s oldest fuel.',
      },
      {
        label: 'Work the detail and win the carve-out',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You skip the megaphone and negotiate a quiet exemption for home. Less stirring, more delivered — your devolved colleagues send a rare thank-you.',
      },
    ],
  },
  {
    id: 'tp_recruit_defector',
    title: 'A big-party MP comes knocking',
    body: 'A disillusioned MP from one of the main parties hints they might cross to your {party} — an enormous coup for a small outfit, and an enormous risk if their politics only half fit yours.',
    tags: ['party', 'westminster', 'serious'],
    weight: 10, cooldownDays: 500,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Welcome the coup',
        effects: { stats: { profile: 5, partyStanding: -2 }, pollingShock: { party: 'own', delta: 0.2 } },
        outcomeText: 'The defection trebles your media presence overnight. Your founders mutter that the newcomer doesn\'t really believe it; the cameras do not care.',
      },
      {
        label: 'Decline the flag of convenience',
        effects: { stats: { integrity: 4 } },
        outcomeText: 'You decide a coherent party beats a borrowed MP and say a polite no. The press calls it a missed chance; your members call it self-respect.',
      },
    ],
  },
  {
    id: 'tp_amendment',
    title: 'The amendment that punches up',
    body: 'You have spotted a flaw in a government bill that nobody else has, and tabled a tidy amendment. The minister can swat it away — unless you can build a cross-party coalition behind it first.',
    tags: ['westminster', 'policy'],
    weight: 11, cooldownDays: 340,
    requires: { inGovernment: false, minorParty: true, minTier: 0 },
    choices: [
      {
        label: 'Quietly whip cross-party support',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You work every corridor and assemble an unlikely coalition of rebels and idealists. The government accepts the amendment to avoid the embarrassment. A minnow changed the law.',
      },
      {
        label: 'Make a noisy public case',
        effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You take it to the airwaves rather than the tea rooms. The amendment fails on the night, but the issue is now firmly on the agenda with your name on it.',
      },
    ],
  },
];
