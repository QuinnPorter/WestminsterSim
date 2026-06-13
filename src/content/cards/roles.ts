import { DecisionCard } from '../../types/content';

/** Cards for the two "title" roles: Deputy PM / First Secretary (a senior
 *  minister deputising for the PM) and the Speaker of the House (non-partisan,
 *  chairing the Commons). Gated on the flags set when those roles are taken. */
export const ROLE_CARDS: DecisionCard[] = [
  // ---- Deputy Prime Minister / First Secretary of State ----
  {
    id: 'dpm_deputise_pmqs',
    title: 'Deputising at PMQs',
    body: 'The PM is at a summit overseas, so the despatch box at Prime Minister\'s Questions is yours. As the government\'s number two you carry the whole administration\'s record into the bear pit for half an hour.',
    tags: ['westminster', 'media', 'serious'],
    weight: 13, cooldownDays: 360,
    requires: { flags: { _isDeputyPM: true }, inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Command the chamber',
        effects: { stats: { profile: 4, partyStanding: 2 } },
        outcomeText: [
          { weight: 2, text: 'You are fluent, funny and utterly in control. The benches behind you roar; the lobby calls it the best stand-in performance in years. Quiet voices wonder aloud whether the deputy should simply be the boss.' },
          { weight: 1, text: 'A solid, assured outing — no fireworks, no fumbles. The PM texts a thumbs-up from the summit and the party notes a safe pair of hands.', extra: { stats: { competence: 2 } } },
        ],
      },
      {
        label: 'Play it dead straight',
        effects: { stats: { competence: 3 } },
        outcomeText: 'You bat everything back into the long grass with procedural calm. Nobody lands a blow, nobody remembers a line, and the government\'s week passes off without incident — exactly as intended.',
      },
    ],
  },
  {
    id: 'dpm_chair_cabinet',
    title: 'Chairing Cabinet',
    body: 'With the PM away, you take the chair at the Cabinet table. Two big beasts are at each other\'s throats over a spending row, and the room is waiting to see whether the deputy can hold the ring.',
    tags: ['westminster', 'party', 'serious'],
    weight: 12, cooldownDays: 420,
    requires: { flags: { _isDeputyPM: true }, inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Broker a compromise',
        effects: { stats: { competence: 3, partyStanding: 3 } },
        outcomeText: 'You let both sides spend their fury, then split the difference with a deftness that surprises the room. The minute records a unanimous agreement. The PM\'s office hears you ran a tighter meeting than the PM.',
      },
      {
        label: 'Bang the gavel and impose a line',
        effects: { stats: { profile: 3 }, relationships: [{ kind: 'leader', delta: -2 }] },
        outcomeText: [
          { weight: 2, text: 'You cut the argument dead and decree the outcome. It is decisive and it sticks — though one of the losers leaves muttering that you forgot whose chair you were keeping warm.' },
          { weight: 1, text: 'Your ruling lands badly: both sides feel steamrollered and the briefing afterwards is poisonous. The PM returns to a mess to clear up.', extra: { stats: { partyStanding: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'dpm_represent_abroad',
    title: 'Standing in on the world stage',
    body: 'A leaders\' summit clashes with a domestic crisis the PM cannot leave, so you fly out as the United Kingdom\'s representative. The cameras, the bilaterals and the communiqué are all, for a few days, yours.',
    tags: ['media', 'policy'],
    weight: 11, cooldownDays: 500,
    requires: { flags: { _isDeputyPM: true }, inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Look every inch the statesperson',
        effects: { stats: { profile: 5, competence: 1 } },
        outcomeText: 'You glide through the bilaterals, land a warm photo with the right leader, and deliver a clip that runs on every bulletin back home. For a weekend you look uncannily like a prime minister.',
      },
      {
        label: 'Quietly secure a real win',
        effects: { stats: { competence: 4 } },
        outcomeText: 'You skip the grip-and-grin theatre and grind out a genuine concession in the side-room. The press barely notices; the officials are quietly awed; the file you bring home is worth more than any headline.',
      },
    ],
  },
  {
    id: 'dpm_attack_dog',
    title: 'The government\'s attack dog',
    body: 'A grubby story is dragging the government down and Number 10 wants someone senior to go out and fight dirty. As deputy, you are the obvious choice to take the hits the PM cannot be seen taking.',
    tags: ['media', 'party'],
    weight: 10, cooldownDays: 420,
    requires: { flags: { _isDeputyPM: true }, inGovernment: true, minTier: 4 },
    choices: [
      {
        label: 'Go for the opposition\'s throat',
        effects: { stats: { profile: 3, integrity: -2 }, relationships: [{ kind: 'leader', delta: 4 }] },
        outcomeText: 'You spend the morning round savaging the other side with a relish that startles the presenters. The story moves on, the PM is grateful, and your reputation as the regime\'s enforcer hardens — for better and worse.',
      },
      {
        label: 'Defend the record with dignity',
        effects: { stats: { integrity: 2, competence: 2 } },
        outcomeText: 'You refuse to throw the mud and instead make the sober, factual case. It is less fun for the headline writers, but you come away with your reputation intact and a grudging respect from the gallery.',
      },
    ],
  },

  // ---- Speaker of the House ----
  {
    id: 'spk_point_of_order',
    title: 'A heated point of order',
    body: 'The chamber is in uproar. A minister is accused of misleading the House, and a furious member is on their feet demanding you intervene. As Speaker, every eye — and every party\'s suspicion — is on the Chair.',
    tags: ['westminster', 'serious'],
    weight: 13, cooldownDays: 300,
    requires: { flags: { _isSpeaker: true } },
    choices: [
      {
        label: 'Restore order firmly and impartially',
        effects: { stats: { integrity: 4, profile: 2 } },
        outcomeText: 'You let the temperature drop, rule precisely on what is and is not in order, and remind the House of its own standards. Both sides leave half-satisfied — the surest sign the Chair got it right.',
      },
      {
        label: 'Make an example of the loudest offender',
        effects: { stats: { profile: 4, integrity: -1 } },
        outcomeText: [
          { weight: 2, text: '"Order! The Honourable Member will leave the Chamber." You name and suspend the worst culprit, and a stunned hush descends. The clip runs all evening; the Chair\'s authority is, for now, unquestioned.' },
          { weight: 1, text: 'Your suspension is seen as heavy-handed and one side cries bias. You defend it robustly, but a little of the Chair\'s precious impartiality is spent.', extra: { stats: { integrity: -2 } } },
        ],
      },
    ],
  },
  {
    id: 'spk_urgent_question',
    title: 'An urgent question',
    body: 'The opposition has applied for an Urgent Question dragging a reluctant minister to the despatch box over a breaking scandal. Granting it embarrasses the government; refusing it looks like the Chair shielding them.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { flags: { _isSpeaker: true } },
    choices: [
      {
        label: 'Grant it — the House must be answered to',
        effects: { stats: { integrity: 4, profile: 2 } },
        outcomeText: 'You grant the question and the minister is summoned within the hour. The government fumes privately, but the principle is plain: ministers answer to Parliament, and the Speaker exists to make sure they do.',
      },
      {
        label: 'Refuse — the timing isn\'t right',
        effects: { stats: { integrity: -2 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'You rule that a statement is already scheduled and decline the question. The government breathes out; the opposition mutters that the Chair has gone native. You tell yourself it was a judgement on process, not politics.',
      },
    ],
  },
  {
    id: 'spk_discipline_minister',
    title: 'Unparliamentary language',
    body: 'In the heat of debate a senior minister calls an opponent a liar across the chamber and refuses to withdraw. The House falls silent and turns to the Chair. This is a direct test of your authority.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { flags: { _isSpeaker: true } },
    choices: [
      {
        label: 'Order the withdrawal, no exceptions',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'You require the word withdrawn and hold the minister\'s gaze through three long seconds of resistance — until they mutter the retraction. Rank buys no exemption from the rules of the House, and everyone has just seen it.',
      },
      {
        label: 'Defuse it with a touch of wit',
        effects: { stats: { profile: 3, partyStanding: 1 } },
        outcomeText: 'A dry one-liner from the Chair turns the standoff into laughter, the word is quietly withdrawn, and the debate moves on. The gallery loves a Speaker who can lower the temperature without lowering the standards.',
      },
    ],
  },
  {
    id: 'spk_recall_ruling',
    title: 'A contentious recall',
    body: 'A standards report lands recommending a sanction against a popular member, and the rules leave the next step to your interpretation. Whatever you decide, half the House — and half the press — will say you got it wrong.',
    tags: ['westminster', 'serious'],
    weight: 10, cooldownDays: 480,
    requires: { flags: { _isSpeaker: true } },
    choices: [
      {
        label: 'Follow the report to the letter',
        effects: { stats: { integrity: 5 } },
        outcomeText: 'You apply the recommendation exactly as written, without fear or favour. The member\'s allies are incandescent, but the standards system holds — and a Speaker who bends the rules for the popular is no Speaker at all.',
      },
      {
        label: 'Allow the House the final say',
        effects: { stats: { competence: 3, integrity: 1 } },
        outcomeText: 'You rule that so grave a matter belongs to the whole House, not the Chair alone, and schedule a free vote. It is a deft sidestep that keeps you above the fray while letting Parliament own the decision.',
      },
    ],
  },
];
