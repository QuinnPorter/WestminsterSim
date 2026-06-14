import { DecisionCard, EffectSpec } from '../../types/content';
import { DepartmentId } from '../../types/game';

/** Per-ministry "what will you focus on?" prompt, shown once when a player takes a
 *  department as Secretary of State. An extension of the existing dir_<dept>
 *  direction chains: each choice banks a `focus_<dept>` flag and a modest effect.
 *  The agenda↔department link is handled mechanically by the cause bonus in
 *  eligibilityScore(); these cards give the choice its narrative shape. */
interface FocusOption {
  label: string;
  outcome: string;
  effects: EffectSpec;
}
interface FocusDef {
  dept: DepartmentId;
  title: string;
  body: string;
  options: FocusOption[];
}

const FOCUS_DEFS: FocusDef[] = [
  {
    dept: 'treasury',
    title: 'Your Treasury, your call',
    body: 'The red box is yours. Every Chancellor is defined by a handful of choices made early. What is the doctrine of your {department}?',
    options: [
      { label: 'Invest in public services', outcome: 'You loosen the purse strings for schools and hospitals, betting that investment pays its way. The spending departments cheer; the bond markets watch.', effects: { stats: { profile: 3, partyStanding: 2 }, pollingShock: { party: 'own', delta: 1 } } },
      { label: 'Balance the books', outcome: 'You make fiscal discipline your watchword. Dry, unglamorous, and the City sleeps a little easier — at the cost of a few unhappy colleagues.', effects: { stats: { competence: 4, partyStanding: -1 } } },
      { label: 'Cut taxes to grow', outcome: 'You stake your chancellorship on lower taxes unleashing growth. A bold gamble that thrills your base and worries your officials.', effects: { stats: { profile: 4, competence: -1 }, pollingShock: { party: 'own', delta: 1 } } },
    ],
  },
  {
    dept: 'foreign',
    title: 'Britain in the world',
    body: 'The {department} runs on choices about where Britain spends its limited attention. What will yours be?',
    options: [
      { label: 'Development and aid', outcome: 'You rebuild the case for development spending as soft power. Principled, and a slow burn with the public.', effects: { stats: { integrity: 3, profile: 1 } } },
      { label: 'Trade and exports', outcome: 'You turn the Foreign Office into a sales force, chasing deals and market access. Tangible wins, frequent air miles.', effects: { stats: { competence: 3, profile: 2 } } },
      { label: 'Alliances and security', outcome: 'You put alliances and deterrence first, knitting Britain closer to its partners. Reassuringly statesmanlike.', effects: { stats: { competence: 3, partyStanding: 2 } } },
    ],
  },
  {
    dept: 'health',
    title: 'The health of the nation',
    body: 'The {department} is the biggest, hardest brief in government. You cannot fix everything at once. Where do you point it?',
    options: [
      { label: 'Fix social care', outcome: 'You finally grasp the social-care nettle that defeated your predecessors. Brave, expensive, and quietly historic if it works.', effects: { stats: { integrity: 3, competence: 2 } } },
      { label: 'Staff and workforce', outcome: 'You make recruitment and retention the mission — more doctors, more nurses, better pay. Popular with the front line.', effects: { stats: { partyStanding: 2, profile: 2 }, pollingShock: { party: 'own', delta: 1 } } },
      { label: 'Waiting lists and efficiency', outcome: 'You go all-in on cutting waiting times, targets on every wall. Measurable, relentless, and politically high-stakes.', effects: { stats: { competence: 4, profile: 1 } } },
    ],
  },
  {
    dept: 'home',
    title: 'Order and liberty',
    body: 'The {department} is where security meets civil liberty, and the tabloids never sleep. What is your priority?',
    options: [
      { label: 'Crime and policing', outcome: 'You back the police with funding and tougher powers. The papers approve; the watchdogs raise an eyebrow.', effects: { stats: { profile: 3, partyStanding: 2 } } },
      { label: 'Borders and migration', outcome: 'You make the asylum and borders system your defining fight. Politically electric, operationally brutal.', effects: { stats: { profile: 4, integrity: -1 }, pollingShock: { party: 'own', delta: 1 } } },
      { label: 'Rights and reform', outcome: 'You temper the department with a focus on rights and proportionality. Quietly principled, occasionally unpopular.', effects: { stats: { integrity: 4, partyStanding: -1 } } },
    ],
  },
  {
    dept: 'education',
    title: 'Opportunity for all',
    body: 'The {department} shapes a generation. Your tenure will be remembered for one fight above the rest. Which?',
    options: [
      { label: 'School standards', outcome: 'You make rigour and results your crusade. Divisive in the staffroom, popular with anxious parents.', effects: { stats: { competence: 3, profile: 2 } } },
      { label: 'Skills and colleges', outcome: 'You champion further education and apprenticeships, the perennially overlooked half of the system. Worthy and warmly received.', effects: { stats: { integrity: 2, partyStanding: 2 } } },
      { label: 'Early years and childcare', outcome: 'You bet on the early years, where the evidence is strongest and the costs are real. A long game with deep dividends.', effects: { stats: { integrity: 3, profile: 1 }, pollingShock: { party: 'own', delta: 1 } } },
    ],
  },
  {
    dept: 'defence',
    title: 'The nation\'s shield',
    body: 'The {department} forces hard trade-offs between kit, people and posture. Where does your priority lie?',
    options: [
      { label: 'Equipment and procurement', outcome: 'You drive a modernisation of the kit, wrestling with the famously unruly procurement budget. Competent, thankless work.', effects: { stats: { competence: 4 } } },
      { label: 'Personnel and welfare', outcome: 'You put the welfare of service personnel and veterans first. Quietly honourable and well received in the messes.', effects: { stats: { integrity: 3, partyStanding: 2 } } },
      { label: 'Alliances and deterrence', outcome: 'You focus on alliances and a credible deterrent, standing tall on the world stage. Statesmanlike and steadying.', effects: { stats: { profile: 3, competence: 1 } } },
    ],
  },
  {
    dept: 'justice',
    title: 'Justice and its limits',
    body: 'The {department} balances punishment, rehabilitation and a creaking court system. What will you be known for?',
    options: [
      { label: 'Tougher sentencing', outcome: 'You make sentences longer and the message clearer. The columnists applaud; the prisons fill.', effects: { stats: { profile: 3, partyStanding: 1 } } },
      { label: 'Rehabilitation and reform', outcome: 'You bet on cutting reoffending rather than just locking the door. Evidence-led, and a hard sell on a bad news day.', effects: { stats: { integrity: 4, profile: -1 } } },
      { label: 'Clear the courts backlog', outcome: 'You wage war on the courts backlog, the unglamorous crisis behind every headline. Genuinely useful, rarely thanked.', effects: { stats: { competence: 4 } } },
    ],
  },
  {
    dept: 'transport',
    title: 'Keeping Britain moving',
    body: 'The {department} is where grand schemes meet potholes. Which gets your political capital?',
    options: [
      { label: 'Rail and public transport', outcome: 'You throw your weight behind rail and buses, the spine of the network. Popular in the cities, costly everywhere.', effects: { stats: { profile: 2, partyStanding: 2 } } },
      { label: 'Roads and drivers', outcome: 'You make the case for the motorist — fixing roads, easing journeys. Quietly popular far from Westminster.', effects: { stats: { profile: 2, constituencyApproval: 3 } } },
      { label: 'Decarbonise transport', outcome: 'You steer the department toward electric vehicles and lower emissions. Forward-looking, and a magnet for culture-war flak.', effects: { stats: { integrity: 3, profile: 1 } } },
      { label: 'Major infrastructure projects', outcome: 'You back the big builds — new lines, bridges and links that take a decade and define a country. Statesmanlike, and ruinously expensive.', effects: { stats: { competence: 3, profile: 2 } } },
    ],
  },
  {
    dept: 'environment',
    title: 'Land, air and water',
    body: 'The {department} spans climate, farming and the natural world. Where do you plant your flag?',
    options: [
      { label: 'Net zero and climate', outcome: 'You make the climate transition your mission, leaning into the long emergency. Defining, and fiercely contested.', effects: { stats: { integrity: 4, profile: 2 } } },
      { label: 'Farming and the countryside', outcome: 'You stand up for farmers and rural communities navigating a world of change. Steady support from the shires.', effects: { stats: { constituencyApproval: 3, partyStanding: 2 } } },
      { label: 'Nature and clean water', outcome: 'You take on the sewage scandal and the state of nature. Vivid, popular, and a stick your opponents will grab too.', effects: { stats: { profile: 3 }, pollingShock: { party: 'own', delta: 1 } } },
    ],
  },
  {
    dept: 'business',
    title: 'The engine room',
    body: 'The {department} sets the terms of trade between enterprise, the state and the workforce. What is your instinct?',
    options: [
      { label: 'Deregulate and back enterprise', outcome: 'You cut red tape and trust business to deliver. The boardrooms cheer; the unions sharpen their pencils.', effects: { stats: { competence: 2, profile: 2 } } },
      { label: 'An industrial strategy', outcome: 'You pick sectors and back them, betting the state can shape growth. Ambitious, and only vindicated in the long run.', effects: { stats: { competence: 3, partyStanding: 1 } } },
      { label: "Workers' rights", outcome: 'You strengthen protections for workers, tilting the field a little. Warmly received on your side, fought on the other.', effects: { stats: { integrity: 3, partyStanding: 1 }, pollingShock: { party: 'own', delta: 1 } } },
    ],
  },
  {
    dept: 'dwp',
    title: 'The safety net',
    body: 'The {department} touches more lives than any other, often at their hardest moments. What will you focus on?',
    options: [
      { label: 'Protect the safety net', outcome: 'You defend and strengthen support for those who need it. Principled, costly, and a fault line with the Treasury.', effects: { stats: { integrity: 4, partyStanding: -1 } } },
      { label: 'Help people back to work', outcome: 'You make employment support the mission, getting people off benefits and into jobs. A pragmatic, sellable story.', effects: { stats: { competence: 3, profile: 2 } } },
      { label: 'Pensions and later life', outcome: 'You focus on pensions and security in later life — a large, loyal, reliably voting constituency.', effects: { stats: { partyStanding: 2 }, pollingShock: { party: 'own', delta: 1 } } },
    ],
  },
  {
    dept: 'culture',
    title: 'Culture, media and sport',
    body: 'The {department} is small but loud, the brief everyone has an opinion on. Where do you lead?',
    options: [
      { label: 'Arts and heritage', outcome: 'You make the case for the arts and the places that hold a nation\'s memory. Cherished by some, derided as luvvie-ish by others.', effects: { stats: { integrity: 2, profile: 2 } } },
      { label: 'Grassroots sport', outcome: 'You back grassroots sport and the health and joy it brings. Cheerfully popular and hard to attack.', effects: { stats: { constituencyApproval: 3, profile: 1 } } },
      { label: 'Media and broadcasting', outcome: 'You wade into the future of broadcasting and the press — the brief with the sharpest teeth. High-profile, high-risk.', effects: { stats: { profile: 4, integrity: -1 } } },
    ],
  },
  {
    dept: 'housing',
    title: 'A roof over their heads',
    body: 'The {department} owns the housing crisis — supply, ownership and the planning system all run through your desk. Where do you push hardest?',
    options: [
      { label: 'Build, build, build', outcome: 'You set a relentless housebuilding target and dare everyone to meet it. Bold, popular with the young — and a war with the shires.', effects: { stats: { profile: 4, competence: 1 }, pollingShock: { party: 'own', delta: 1 } } },
      { label: 'Social & affordable homes', outcome: 'You make genuinely affordable and social housing the mission. Principled, costly, and a slow build in every sense.', effects: { stats: { integrity: 4, partyStanding: 1 } } },
      { label: 'Reform the planning system', outcome: 'You take on the planning system itself — the unglamorous machinery behind every blocked development. Technocratic, thankless, quietly transformative.', effects: { stats: { competence: 4, constituencyApproval: -2 } } },
    ],
  },
];

function buildFocusCard(def: FocusDef): DecisionCard {
  const flag = `focus_${def.dept}`;
  return {
    id: `focus_${def.dept}`,
    title: def.title,
    body: def.body,
    tags: ['policy', 'serious'],
    weight: 22, cooldownDays: 9999,
    requires: {
      inGovernment: true, minTier: 4, department: [def.dept],
      flags: { [flag]: false },
    },
    choices: def.options.map((o, i) => ({
      label: o.label,
      effects: { ...o.effects, setFlags: { ...(o.effects.setFlags ?? {}), [flag]: i + 1 } },
      outcomeText: o.outcome,
    })),
  };
}

export const MINISTRY_FOCUS_CARDS: DecisionCard[] = FOCUS_DEFS.map(buildFocusCard);
