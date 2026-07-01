import { DecisionCard } from '../../types/content';

/**
 * B7 — Cause-collision cards. Four rare `oncePerCareer` dilemmas that fire only
 * when the player champions BOTH causes of a tension pair. Each forces a real
 * choice between two things you claim to care about; each side `bumpCause`s the
 * cause it favours, with a matching small stat consequence, so a career that
 * tries to serve everyone eventually has to pick a lane. Voice: dry, specific,
 * genuine Westminster trade-offs — no cartoon villains. New file only;
 * registered in index.ts by the synthesizer.
 */
export const CAUSE_COLLISION_CARDS: DecisionCard[] = [
  // ---------------------------------------------- Economy <-> Environment
  {
    id: 'cc_economy_environment',
    title: 'The refinery decision',
    body: 'A struggling oil refinery in a red-wall town is up for closure — three thousand jobs, and the only serious employer for forty miles. Ministers can bail it out with a subsidy, or let it fold and put the money into a green-jobs retraining scheme that will not land for a decade. You have argued for both growth and net zero. Today they will not fit in the same sentence.',
    tags: ['policy', 'serious'],
    weight: 4, cooldownDays: 900,
    oncePerCareer: true,
    requires: { causesAll: ['economy', 'environment'] },
    choices: [
      {
        label: 'Save the refinery and the jobs',
        effects: { bumpCause: 'economy', stats: { competence: 3, profile: 2 } },
        outcomeText: 'You keep three thousand people in work and the town sends you a thank-you that means something. The climate lobby files you under "talks green, votes carbon", and quietly they are not wrong. Growth won today; you will hear about it at the next hustings.',
      },
      {
        label: 'Let it close and fund the green transition',
        effects: { bumpCause: 'environment', stats: { integrity: 3, partyStanding: -3 } },
        outcomeText: 'You back the future over the present, and the future does not vote for another ten years. The town does — against you, loudly, and the by-election that follows is a wake. Net zero gained a believer and lost a constituency.',
      },
    ],
  },
  // ---------------------------------------------- Economy <-> Inequality
  {
    id: 'cc_economy_inequality',
    title: 'The tax that works too well',
    body: 'The Treasury has modelled a wealth tax. It closes the gap you came into politics to close — and, the same model says, shaves half a point off growth and sends a clutch of firms shopping for a friendlier jurisdiction. You have spent years insisting a strong economy and a fair one are the same fight. The spreadsheet disagrees.',
    tags: ['policy', 'serious'],
    weight: 4, cooldownDays: 900,
    oncePerCareer: true,
    requires: { causesAll: ['economy', 'inequality'] },
    choices: [
      {
        label: 'Back the tax and close the gap',
        effects: { bumpCause: 'inequality', stats: { integrity: 3, competence: -2 } },
        outcomeText: 'You vote for the fairer country and take the hit to the growth line on the chin. The gap narrows; two head offices move to Dublin and take the arguments-against with them. You did the thing you said you would. The CBI will remember.',
      },
      {
        label: 'Drop it to protect growth',
        effects: { bumpCause: 'economy', stats: { competence: 3, partyStanding: -2 } },
        outcomeText: 'You spike the tax and keep the firms — and the growth number holds, which is the number that gets governments re-elected. The people you promised to lift up read the announcement and understand exactly where they came in the ranking.',
      },
    ],
  },
  // ---------------------------------------------- Law & Order <-> Inequality
  {
    id: 'cc_laworder_inequality',
    title: 'Sentences or causes',
    body: 'Knife crime is up and the tabloids want blood. You can back mandatory minimum sentences — popular, decisive, and, every study you have read says, no deterrent at all while it fills prisons with poor young men — or divert the money into the youth services whose cuts everyone privately blames. You campaigned on both order and opportunity. Pick.',
    tags: ['policy', 'serious'],
    weight: 4, cooldownDays: 900,
    oncePerCareer: true,
    requires: { causesAll: ['lawAndOrder', 'inequality'] },
    choices: [
      {
        label: 'Back the tougher sentences',
        effects: { bumpCause: 'lawAndOrder', stats: { profile: 4, integrity: -2 } },
        outcomeText: 'You vote for the minimums and the front pages love you for a fortnight. The prisons take another few hundred teenagers off the estates you grew up defending, and the crime figures do not move, exactly as the evidence promised. Order looked strong. It was not.',
      },
      {
        label: 'Fund the youth services instead',
        effects: { bumpCause: 'inequality', stats: { integrity: 3, profile: -2 } },
        outcomeText: 'You put the money into the clubs and mentors, and the tabloids call you soft on the very day another stabbing leads the news. The results, if they come, arrive in five years with no headline. You chose the cause over the caption.',
      },
    ],
  },
  // ---------------------------------------------- Defence <-> Public Services
  {
    id: 'cc_defence_publicservices',
    title: 'The spending review line',
    body: 'The spending review is a fixed sum and two demands. The generals want the frigate programme funded or Britain quietly stops being a serious naval power; the health service wants the same billions to keep waiting lists from breaking through a political red line. You have stood for a strong country and the services that hold it together. There is money for one.',
    tags: ['policy', 'serious'],
    weight: 4, cooldownDays: 900,
    oncePerCareer: true,
    requires: { causesAll: ['defence', 'publicServices'] },
    choices: [
      {
        label: 'Fund the frigates and the forces',
        effects: { bumpCause: 'defence', stats: { competence: 3, partyStanding: -2 } },
        outcomeText: 'You protect the fleet and the allies who were watching send their thanks through channels the public never sees. The waiting lists tip over the red line the week the frigate contract is signed, and the front pages run the two stories side by side. Security has a price and the ward paid it.',
      },
      {
        label: 'Protect the health budget',
        effects: { bumpCause: 'publicServices', stats: { integrity: 3, competence: -2 } },
        outcomeText: 'You hold the health line and the waiting lists ease, and every family who feels it is grateful in a way that does not trend. The Navy loses a hull and a chunk of standing, and a briefing note about "hollowing out" reaches the papers with your name in the margin.',
      },
    ],
  },
];
