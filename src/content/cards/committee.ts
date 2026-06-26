import { DecisionCard } from '../../types/content';

/** Cards for a select-committee chair — a prestige backbench scrutiny role.
 *  Gated on the `_committeeChair` flag; text uses the {committee} / {cmtdept}
 *  tokens for the department the player scrutinises. */
export const COMMITTEE_CARDS: DecisionCard[] = [
  {
    id: 'cmt_launch_inquiry',
    title: 'Launch an inquiry',
    body: 'As Chair of the {committee} Select Committee you set the agenda. Your clerks lay two paths before you: a deep, evidence-heavy inquiry that will take months — or a punchy, headline-grabbing probe that delivers a story by Friday.',
    tags: ['westminster', 'policy', 'serious'],
    weight: 13, cooldownDays: 300,
    requires: { flags: { _committeeChair: true } },
    choices: [
      {
        label: 'A rigorous, evidence-led inquiry',
        effects: { stats: { competence: 4, profile: 2 } },
        outcomeText: 'You take the slow road: witnesses, written submissions, a forensic final report. It wins no quick headlines, but the lobby starts citing your committee as the serious one — and you, as the MP who actually reads the briefs.',
      },
      {
        label: 'A punchy probe for the headlines',
        effects: { stats: { profile: 5, integrity: -2 } },
        outcomeText: 'You go for the jugular and the news angle. The clip does numbers and your name leads the bulletins; the wonks mutter that it was thin, but nobody remembers thin by the weekend.',
      },
    ],
  },
  {
    id: 'cmt_summon_minister',
    title: 'Summon them to give evidence',
    body: 'You can haul the Secretary of State — or a squirming agency boss — before the {committee} Committee for a televised grilling. The room will be packed, the cameras live.',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 320,
    requires: { flags: { _committeeChair: true } },
    choices: [
      {
        label: 'Land the blows on the record',
        effects: {
          stats: { profile: 5, competence: 1 },
          relationships: [{ kind: 'leader', delta: -2 }],
          pollingShock: { party: 'gov', delta: -0.4 },
        },
        outcomeText: 'You corner them on a number they cannot explain and let the silence do the work. The clip runs all evening. Whitehall takes note of a chair with teeth; the government takes a small, deserved knock.',
      },
      {
        label: 'A firm but fair hearing',
        effects: { stats: { competence: 3, integrity: 2 } },
        outcomeText: 'You ask the hard questions without the theatrics and let them answer in full. No viral moment, but the evidence session is a model of the form, and your reputation for fairness grows on all sides.',
      },
    ],
  },
  {
    id: 'cmt_publish_report',
    title: 'Publish the report',
    body: 'The {committee} Committee\'s report is ready. You can hold the cross-party members together behind a unanimous, authoritative text — or sharpen it into a partisan weapon that delights your own side.',
    tags: ['westminster', 'party', 'serious'],
    weight: 12, cooldownDays: 360,
    requires: { flags: { _committeeChair: true } },
    choices: [
      {
        label: 'A unanimous, cross-party report',
        effects: { stats: { integrity: 4, partyStanding: 1, competence: 1 } },
        outcomeText: 'You make the compromises that keep every member signed up. A unanimous select-committee report carries real weight — ministers cannot dismiss it as politics, and your stock as an honest broker rises across the House.',
      },
      {
        label: 'Sharpen it into a partisan attack',
        effects: {
          stats: { profile: 3, partyStanding: 3, integrity: -3 },
          pollingShock: { party: 'gov', delta: -0.3 },
        },
        outcomeText: 'You override the doubters and ship a report with a clear political edge. Your own benches cheer; the committee\'s other members brief that the chair has gone native, and a little cross-party trust drains away.',
      },
    ],
  },
  {
    id: 'cmt_leak',
    title: 'A leak lands on your desk',
    body: 'A whistleblower slips the {committee} Committee a dossier of internal documents — damning, unverified, and embargoed by the department. Publishing would be a sensation. It would also be a breach.',
    tags: ['scandal', 'media'],
    weight: 10, cooldownDays: 400,
    requires: { flags: { _committeeChair: true } },
    choices: [
      {
        label: 'Publish in the public interest',
        effects: {
          stats: { profile: 5, integrity: -1 },
          relationships: [{ kind: 'journalist', delta: 6 }],
          pollingShock: { party: 'gov', delta: -0.4 },
        },
        outcomeText: 'You put it on the public record and dare them to complain. The story is enormous; the lobby loves you. The department\'s lawyers draft furious letters that change nothing now the cat is out.',
      },
      {
        label: 'Verify quietly, hand it back',
        effects: { stats: { integrity: 4, competence: 2 } },
        outcomeText: 'You resist the sugar-rush, authenticate what you can through proper channels, and protect the source. No fireworks — but the next whistleblower will know this committee can be trusted.',
      },
    ],
  },
  {
    id: 'cmt_scrutinise_own_side',
    title: 'Hold your own side to account',
    body: 'The evidence points squarely at a failure by {govparty} — your own party in government. The {committee} Committee can pursue it without fear or favour, or you can find a way to let your colleagues off lightly.',
    tags: ['westminster', 'party', 'serious'],
    weight: 11, cooldownDays: 360,
    requires: { flags: { _committeeChair: true }, inGovernment: true },
    choices: [
      {
        label: 'Without fear or favour',
        effects: {
          stats: { integrity: 5, profile: 3, partyStanding: -5 },
          relationships: [{ kind: 'leader', delta: -6 }, { kind: 'chiefWhip', delta: -5 }],
          pollingShock: { party: 'gov', delta: -0.4 },
        },
        outcomeText: 'You scrutinise your own government as hard as you would the other lot. The press calls it the finest tradition of the backbenches; the whips call it something unprintable. Your independence is now a matter of record — and a problem for Number 10.',
      },
      {
        label: 'Pull your punches for the team',
        effects: {
          stats: { integrity: -4, partyStanding: 4 },
          relationships: [{ kind: 'leader', delta: 3 }, { kind: 'chiefWhip', delta: 4 }],
        },
        outcomeText: 'You steer the inquiry into the long grass and the report lands soft as a feather. The whips are grateful and remember it. The lobby notices the chair went easy on its own side, and files the thought away.',
      },
    ],
  },
  {
    id: 'cmt_viral_moment',
    title: 'A viral committee moment',
    body: 'A single exchange from your {committee} Committee questioning — a witness floundering, a perfect follow-up — is clipped and racing across the internet. Your team wants you to ride the wave.',
    tags: ['media', 'funny'],
    weight: 10, cooldownDays: 360,
    requires: { flags: { _committeeChair: true } },
    choices: [
      {
        label: 'Ride the wave',
        effects: {
          stats: { profile: 6 },
          relationships: [{ kind: 'journalist', delta: 4 }],
        },
        outcomeText: 'You lean into it: a few well-judged posts, a couple of broadcast hits, and suddenly the whole country knows the backbencher who asks the questions. Profile, banked.',
      },
      {
        label: 'Stay above the noise',
        effects: { stats: { competence: 2, integrity: 2 } },
        outcomeText: 'You let the clip speak for itself and get back to the evidence sessions. No victory lap — but the seriousness is the point, and the people who matter were already watching.',
      },
    ],
  },
];
