import { DecisionCard } from '../../types/content';

/** Leader of the House of Commons (and the shadow). The business manager of the
 *  Commons: the weekly business statement, the legislative timetable, recess dates
 *  and the eternal war between the whips' grid and the backbenches. Gated on the
 *  specific office (no department), via `requires.office`. */
export const LEADER_HOUSE_CARDS: DecisionCard[] = [
  // ===================== GOVERNMENT =====================
  {
    id: 'lh_business_statement',
    title: 'The business statement',
    body: 'Thursday morning, and you must tell the House what it will debate next week. The grid says bury the awkward bill in a Friday graveyard slot; the constitution says give the Commons its due. The Speaker is watching.',
    tags: ['westminster', 'serious'],
    weight: 14, cooldownDays: 240,
    requires: { office: ['leader_house'], inGovernment: true },
    choices: [
      {
        label: 'Give the House proper time',
        effects: { stats: { integrity: 3, profile: 1 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You schedule a full day on the contentious bill and let the Commons do its job. The clerks and the Speaker approve; the Chief Whip mutters about "rope".',
      },
      {
        label: 'Manage it off the floor',
        effects: { stats: { competence: 3, integrity: -2 }, relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'You find a tidy procedural route that keeps the row off the evening bulletins. The whips are delighted; an old hand on the back bench accuses you of "treating Parliament like an inconvenience".',
      },
    ],
  },
  {
    id: 'lh_legislative_logjam',
    title: 'The legislative logjam',
    body: 'There are too many bills and too few sitting days. Something has to give: a flagship reform can be carried over to next session, or you can sit the House late into the night for weeks to ram everything through.',
    tags: ['westminster', 'policy'],
    weight: 12, cooldownDays: 300,
    requires: { office: ['leader_house'], inGovernment: true },
    choices: [
      {
        label: 'Carry the flagship bill over',
        effects: { stats: { competence: 3 }, pollingShock: { party: 'own', delta: -0.1 } },
        outcomeText: 'You make the grown-up call and carry it over. The timetable breathes; the No.10 grid unit is furious that its "delivery" headline has slipped a year.',
      },
      {
        label: 'Sit them through the night',
        effects: { stats: { profile: 2, competence: -1 }, pollingShock: { party: 'own', delta: 0.1 }, relationships: [{ kind: 'colleague', delta: -4 }] },
        outcomeText: 'You order all-night sittings and grind it all through. The legislation passes; exhausted colleagues with young children will remember who kept them from the division lobby at 4am.',
      },
    ],
  },
  {
    id: 'lh_programme_motion',
    title: 'A guillotine on the floor',
    body: 'A genuinely controversial bill is bogging down. You can move a tight programme motion — a guillotine — to force it through, or let it run and risk it eating the entire session.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 320,
    requires: { office: ['leader_house'], inGovernment: true },
    choices: [
      {
        label: 'Bring in the guillotine',
        effects: { stats: { competence: 3, integrity: -2 }, relationships: [{ kind: 'chiefWhip', delta: 3 }] },
        outcomeText: 'You curtail the debate and the bill clears its stages on time. Effective government — and a stick the opposition will beat you with at every future timetable motion.',
      },
      {
        label: 'Let the House have its say',
        effects: { stats: { integrity: 4, competence: -1 } },
        outcomeText: 'You let the debate run and trust the House. The scrutiny is real and the bill is better for it; the cost is a week you did not have to spare.',
      },
    ],
  },

  // ===================== SHADOW =====================
  {
    id: 'lh_business_questions',
    title: 'Business questions',
    body: 'As Shadow Leader of the House you get a weekly half-hour to range across the whole of government at the despatch box. This week the government has quietly dodged an Urgent Question on a brewing scandal. The slot is yours.',
    tags: ['westminster', 'media'],
    weight: 13, cooldownDays: 260,
    requires: { office: ['leader_house'], inGovernment: false },
    choices: [
      {
        label: 'Demand the missing statement',
        effects: { stats: { profile: 4 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You use the slot to shame the government into coming to the House. A clip of you holding the empty government bench to account does the rounds by lunchtime.',
      },
      {
        label: 'Land a witty, quotable jab',
        effects: { stats: { profile: 3, competence: -1 } },
        outcomeText: 'You go for the laugh and get it; the gallery scribbles it down and the sketchwriters reward you. Memorable, if not exactly statecraft.',
      },
    ],
  },
  {
    id: 'lh_statement_first',
    title: 'Briefed to the press, not the House',
    body: 'The government has announced a major policy to a friendly newspaper before telling MPs — a breach of the ministerial code the Speaker loathes. As Shadow Leader of the House, defending Parliament\'s rights is literally your brief.',
    tags: ['westminster', 'serious'],
    weight: 11, cooldownDays: 300,
    requires: { office: ['leader_house'], inGovernment: false },
    choices: [
      {
        label: 'Make it a point of principle',
        effects: { stats: { integrity: 4, profile: 1 } },
        outcomeText: 'You write to the Speaker and raise it on the floor as a matter of the House\'s dignity, not party advantage. It earns you respect across the benches — the rarest currency in the place.',
      },
      {
        label: 'Turn it into a partisan attack',
        effects: { stats: { profile: 3, integrity: -2 }, pollingShock: { party: 'own', delta: 0.1 } },
        outcomeText: 'You weaponise the breach for a straight political hit. It lands a blow, but the Speaker notes that you were defending your own side, not the House.',
      },
    ],
  },
];
