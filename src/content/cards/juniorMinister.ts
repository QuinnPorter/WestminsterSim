import { DecisionCard } from '../../types/content';

/** Tier 3: junior ministers (and their shadow counterparts). Heavy {department} templating. */
export const JUNIOR_MINISTER_CARDS: DecisionCard[] = [
  {
    id: 'jm_red_box',
    title: 'The box',
    body: 'Your first red box arrives — or in opposition, the shadow brief that mimics one. Forty submissions, each marked urgent, each written in a dialect of English designed to deflect blame. The {department} brief is now yours.',
    tags: ['westminster', 'policy'],
    weight: 16, cooldownDays: 9999, oncePerCareer: true,
    requires: { minTier: 3, maxTier: 3 },
    choices: [
      {
        label: 'Read every page, every night',
        effects: { stats: { competence: 6 } },
        outcomeText: 'Within a month you can ambush your own officials with their own footnotes. The civil service\'s assessment, leaked to you by a friendly private secretary: "annoyingly thorough". You frame it mentally.',
      },
      {
        label: 'Learn what to skim',
        effects: { stats: { competence: 2, profile: 1 } },
        outcomeText: 'You develop the senior politician\'s survival skill: knowing which six pages of forty actually matter. The rest is performance art by committee. Your evenings partially return.',
      },
    ],
  },
  {
    id: 'jm_media_round',
    title: 'The morning round',
    body: 'You drew the short straw: defending the government across five broadcast studios before 9am, on a story that broke at 11pm, with a line-to-take that is two sentences of pure evasion.',
    tags: ['media'],
    weight: 14, cooldownDays: 220,
    requires: { minTier: 3, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Stick to the line, robotically',
        effects: { stats: { partyStanding: 3, profile: 1 }, relationships: [{ kind: 'leader', delta: 3 }] },
        outcomeText: 'You repeat the two sentences fourteen times with minor variations, like a jazz musician of nothing. Painful — but no clips, no gaffes, and Number 10\'s grid stays intact. Noted, approvingly.',
      },
      {
        label: 'Freelance slightly — sound human',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: [
          { weight: 2, text: 'You concede the obvious — "of course people are angry" — and the interviews instantly soften. Viewers warm to you. The grid people do not, but viewers vote and grids don\'t.' },
          { weight: 1, text: 'Your moment of candour becomes the story: "MINISTER ADMITS POLICY FAILING". A bruising day, though your stock with the public oddly ticks up.', extra: { stats: { partyStanding: -4, profile: 2 } } },
        ],
      },
    ],
  },
  {
    id: 'jm_blame_absorber',
    title: 'Human shield',
    body: 'A {department} statistic has gone wrong in a publicly embarrassing way. The Secretary of State would like you, specifically, to take the urgent question on it. "Good experience," they say, already leaving.',
    tags: ['westminster', 'serious'],
    weight: 13, cooldownDays: 280,
    requires: { minTier: 3, maxTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Take the hit gracefully',
        effects: { stats: { partyStanding: 4, competence: 2, profile: -1 } },
        outcomeText: 'An hour at the despatch box absorbing artillery meant for your boss. You neither crumble nor shine — the exact brief. Upstairs, it is recorded that you are "solid under fire", the most valuable adjective in government.',
      },
      {
        label: 'Subtly point at the real owner',
        effects: { stats: { profile: 2, integrity: -3 }, relationships: [{ kind: 'rival', delta: -3 }] },
        outcomeText: 'Three of your answers contain the phrase "decisions taken before my time in this role". The sketch writers notice. So does the Secretary of State, whose smile thereafter could chill milk.',
      },
    ],
  },
  {
    id: 'jm_policy_pet_project',
    title: 'Your one good idea',
    body: 'Buried in your {department} portfolio is the small, unglamorous reform you actually came into politics to do. Officials say there is a sliver of legislative time — if you spend your political capital on it.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 600,
    requires: { minTier: 3, maxTier: 4 },
    choices: [
      {
        label: 'Spend the capital',
        effects: { stats: { integrity: 5, competence: 3, partyStanding: -2 } },
        outcomeText: 'You trade two favours, surrender a speaking slot, and bore three cabinet committees into submission. The reform passes almost unnoticed. In ten years it will have quietly helped a million people. Politics, occasionally, works.',
      },
      {
        label: 'Bank the capital for the climb',
        effects: { stats: { partyStanding: 3 } },
        outcomeText: 'The reform goes back in the drawer marked "someday". You spend the capital on positioning instead, which compounds faster. The drawer does not reproach you. You reproach you, occasionally, at night.',
      },
    ],
  },
  {
    id: 'jm_leak_inquiry',
    title: 'The leak',
    body: 'A confidential {department} memo appears verbatim in the Sunday papers. There were six people in the meeting. You were one of them. The Secretary of State has ordered a leak inquiry with the enthusiasm of someone who already has a suspect.',
    tags: ['scandal', 'westminster'],
    weight: 10, cooldownDays: 450,
    requires: { minTier: 3, maxTier: 4 },
    choices: [
      {
        label: 'Cooperate fully and calmly',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You hand over your phone records with the serenity of the innocent, which you are. The leaker turns out to be a special adviser with a grievance and a lunch habit. Your calm is remembered.',
      },
      {
        label: 'Find the leaker yourself first',
        effects: { stats: { competence: 3, profile: 1 }, relationships: [{ kind: 'journalist', delta: -3 }] },
        outcomeText: 'Two discreet conversations and one cross-referenced diary later, you hand the inquiry its answer. Efficient — though the lobby now regards you as someone who catches leakers, which has a chilling effect on your own gossip supply.',
      },
    ],
  },
  {
    id: 'jm_foreign_trip',
    title: 'The delegation',
    body: 'A ministerial trip abroad: three days of {department} diplomacy, photo calls, and a banquet at which you will be seated next to someone whose government your party regularly criticises.',
    tags: ['westminster', 'policy'],
    weight: 10, cooldownDays: 400,
    requires: { minTier: 3, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Raise the difficult subject privately',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'Over the third course you say the thing the briefing said not to say, quietly and without cameras. Your counterpart studies you, then nods once. Nothing changes immediately. Everything afterwards is two degrees warmer.',
      },
      {
        label: 'Stick to the script',
        effects: { stats: { partyStanding: 2, competence: 1 } },
        outcomeText: 'The trip produces a memorandum of understanding, four hundred photographs, and no incidents. The Foreign Office grades it "successful", their highest available emotion.',
      },
    ],
  },
  {
    id: 'jm_select_committee_grilling',
    title: 'Before the committee',
    body: 'Two hours in front of the select committee on the {department} brief. The chair has done their homework. Unfortunately, so has the member at the end, who has found the one number that doesn\'t add up.',
    tags: ['westminster', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { minTier: 3, maxTier: 4 },
    choices: [
      {
        label: 'Concede the number, own the fix',
        effects: { stats: { competence: 4, integrity: 3 } },
        outcomeText: '"The member is right, and here is what we\'re doing about it." The committee, braced for stonewalling, visibly recalibrates. The exchange is later cited in a journalism lecture as "how it should work". ',
      },
      {
        label: 'Fog the room with process',
        effects: { stats: { competence: 1, integrity: -3 } },
        outcomeText: 'You deploy "in due course", "ongoing review" and "wider context" in load-bearing combinations for forty minutes. The number escapes unexamined. The committee\'s report uses the word "evasive", but reports fade and surviving doesn\'t.',
      },
    ],
  },
  {
    id: 'jm_sos_credit',
    title: 'Whose triumph is it anyway',
    body: 'A {department} programme you built from nothing finally delivers spectacular results. The Secretary of State\'s office has drafted the press release. Your name appears in it zero times.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 400,
    requires: { minTier: 3, maxTier: 3 },
    choices: [
      {
        label: 'Let them have it',
        effects: { stats: { partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 2 }] },
        outcomeText: 'Credit flows upward; that is its nature, like heat. But the people who decide your future read delivery reports, not press releases — and the delivery report has your fingerprints on every page.',
      },
      {
        label: 'Brief your role to the lobby',
        effects: { stats: { profile: 4, integrity: -2 }, relationships: [{ kind: 'journalist', delta: 4 }] },
        outcomeText: 'A profile piece appears: "the quiet minister actually behind the success". Your name recognition jumps. The Secretary of State sends a one-word text: "Subtle." You are no longer invited to pre-meetings, which is its own kind of promotion.',
      },
    ],
  },
  {
    id: 'jm_resign_principle_setup',
    title: 'The instruction',
    body: 'Number 10 instructs the {department} to cut the very programme you publicly championed last year. You are expected to defend the cut at the despatch box on Thursday, in words you do not believe.',
    tags: ['policy', 'serious'],
    weight: 8, cooldownDays: 700,
    requires: { minTier: 3, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'This may be a resigning matter',
        effects: { trigger: 'resignOffice' },
        outcomeText: 'You spend the evening with a blank sheet of paper and your conscience. By midnight, the shape of a decision has formed.',
      },
      {
        label: 'Defend it — collective responsibility',
        effects: { stats: { integrity: -5, partyStanding: 3 }, relationships: [{ kind: 'leader', delta: 4 }] },
        outcomeText: 'You stand and say the words. They are well-crafted words; you crafted them to be sayable. The clip of you announcing the programme last year circulates next to the clip of you cutting it. The internet never forgets, but reshuffles forgive.',
      },
    ],
  },
  {
    id: 'jm_civil_service_war',
    title: 'The department says no',
    body: 'Your flagship instruction has returned from the {department} machine for the third time, transformed by officials into something safer, slower and unrecognisable. Your private secretary calls it "the process working".',
    tags: ['westminster', 'policy', 'funny'],
    weight: 11, cooldownDays: 350,
    requires: { minTier: 3, maxTier: 4, inGovernment: true },
    choices: [
      {
        label: 'Override them directly',
        effects: { stats: { competence: 2, profile: 1 } },
        outcomeText: [
          { weight: 2, text: 'You write "do the original version" on the submission and underline it twice. A short silence radiates from the building. The original version happens. Respect, of a wary kind, is established.' },
          { weight: 1, text: 'The original version happens — and hits the exact legal snag officials had been quietly steering around. A correction is issued. The permanent secretary says nothing with tremendous eloquence.', extra: { stats: { competence: -2 } } },
        ],
      },
      {
        label: 'Negotiate with the machine',
        effects: { stats: { competence: 3 } },
        outcomeText: 'You learn the machine\'s actual objection (legal risk, buried on page 9) and trade it away with one concession. Version four is 90% of what you wanted and bulletproof. This, your mentor would say, is the job.',
      },
    ],
  },
];
