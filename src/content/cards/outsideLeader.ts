import { DecisionCard } from '../../types/content';

/** Leading the party from outside the chamber: a former mayor at the head of
 *  an opposition or minor party with no seat in the Commons, a deputy at the
 *  despatch box, and a general election coming that will give them a seat or
 *  take the job away. Every card requires `outsideLeader: true` and nothing
 *  else reads it. {party} is the player's party, {pm} the Prime Minister,
 *  {house} the chamber. */
export const OUTSIDE_LEADER_CARDS: DecisionCard[] = [
  {
    // always eligible: the weeks when nothing else is due
    id: 'ol_quiet_weeks',
    title: 'Leading from the outside',
    body: 'A fortnight of the job as it is from here: the shadow cabinet on a video call, a speech in a city that is not Westminster, a deputy who reads out your lines in the chamber and is thanked for them. The party is behind you, by which it means it is watching to see whether this works.',
    tags: ['party'],
    weight: 2, cooldownDays: 0,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Tour the country',
        effects: { stats: { profile: 1, constituencyApproval: 1 } },
        outcomeText: 'Town halls, factory floors, a hospital car park in the rain. Outside the bubble people like a leader who is outside the bubble, which is the whole bet.',
      },
      {
        label: 'Work the parliamentary party by phone',
        effects: { stats: { partyStanding: 1 } },
        outcomeText: 'Forty calls to MPs who have never sat beside you. Most are polite. Several mention, unprompted, that they are polite.',
      },
    ],
  },
  {
    id: 'ol_gallery_pass',
    title: 'The gallery',
    body: 'Your deputy has a big day in the chamber and your office wants you in the building: a seat in the public gallery, looking down on a party you lead from above it. The picture would be striking. The picture would also say, to anyone who looked at it, that the leader of {party} is a spectator in {house}.',
    tags: ['media', 'westminster'],
    weight: 10, cooldownDays: 400,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Sit in the gallery',
        effects: { stats: { profile: 3, partyStanding: -2 } },
        outcomeText: 'The cameras find you before they find the despatch box. The sketch writers have their column by lunchtime, and it is not about your deputy.',
      },
      {
        label: 'Watch from the office, and call the deputy afterwards',
        effects: { stats: { partyStanding: 2, competence: 1 } },
        outcomeText: 'You let the chamber be theirs and the call afterwards be yours. The deputy notices both, and so does the parliamentary party, which prefers a leader who knows where the lines are.',
      },
    ],
  },
  {
    id: 'ol_deputy_shines',
    title: 'The deputy is good',
    body: 'Your deputy has had three good weeks at the despatch box and a profile in a Sunday paper that uses the word “leader” four times, only one of them about you. The whips say it is loyal admiration. The whips said that about the last one too.',
    tags: ['party', 'serious'],
    weight: 11, cooldownDays: 500,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Praise them, loudly and often',
        effects: { stats: { partyStanding: 3, integrity: 1, profile: -1 } },
        outcomeText: 'You make the deputy’s success your own success in every interview. It is generous and it is strategy, and both are visible from the back of the room.',
      },
      {
        label: 'Take the next set-piece yourself, from a stage',
        effects: { stats: { profile: 3, partyStanding: -2 } },
        outcomeText: 'You answer the Budget from a factory floor while the deputy answers it in the chamber, and the bulletins run both. Two leaders is one too many, and the party counts.',
      },
      {
        label: 'Rebalance the top team',
        effects: { stats: { competence: 1, partyStanding: -3 }, relationships: [{ kind: 'rival', delta: -4 }] },
        outcomeText: 'A new shadow Chancellor, a spread of the big briefs, and a deputy who understands the message without being sent it. The deputy’s friends understand it too.',
      },
    ],
  },
  {
    id: 'ol_pm_taunt',
    title: '“Where is the Leader of the Opposition?”',
    body: '{pm} has started answering every question with the same line: that the leader of {party} cannot be bothered to turn up to {house}. It is cheap and it is working, because every clip of it is a clip of an empty space where you should be.',
    tags: ['westminster', 'media'],
    weight: 12, cooldownDays: 365,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Challenge the Prime Minister to a debate outside the House',
        effects: { stats: { profile: 4, partyStanding: 1 } },
        outcomeText: 'You name a hall and a date. The Prime Minister declines, which is the answer you wanted, and for a week the empty space is theirs.',
      },
      {
        label: 'Let the deputy answer it in the chamber',
        effects: { stats: { partyStanding: 2, profile: -1 } },
        outcomeText: 'Your deputy has a line ready about Prime Ministers who are frightened of mayors, and lands it. The chamber laughs. Nobody can quite remember afterwards who the laugh was for.',
      },
      {
        label: 'Ignore it',
        effects: { stats: { integrity: 1, profile: -2 } },
        outcomeText: 'You rise above it, which the papers describe as sinking beneath it. The line keeps working until the day it stops being new.',
      },
    ],
  },
  {
    id: 'ol_by_election_pressure',
    title: 'Make a seat',
    body: 'A safe seat has fallen vacant and half the parliamentary party wants you to fight the by-election now rather than wait for a general election. The other half points out that losing a by-election as leader is the end, and that the seat is safe only for the member who died in it.',
    tags: ['party', 'serious'],
    weight: 9, cooldownDays: 900, oncePerCareer: true,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Tell them the general election is the test, as agreed',
        effects: { stats: { integrity: 2, partyStanding: -2 } },
        outcomeText: 'You hold to the plan the members voted for. The local party selects somebody else, who wins, and who is now a member while you are not.',
      },
      {
        label: 'Let the speculation run',
        effects: { stats: { profile: 3, partyStanding: -3, competence: -1 } },
        outcomeText: 'Three weeks of will-they-won’t-they and then a candidate who is not you. The parliamentary party learns that you can be moved by it, which it files for later.',
      },
    ],
  },
  {
    id: 'ol_shadow_cabinet_revolt',
    title: 'The shadow cabinet meets without you',
    body: 'Not a plot, they say: a meeting, in {house}, about parliamentary business, which you cannot attend because you cannot enter. It happened twice this month. The whips were there. Your chief of staff was not told.',
    tags: ['party', 'crisis'],
    weight: 10, cooldownDays: 600,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Move the shadow cabinet to your office',
        effects: { stats: { partyStanding: 2, competence: 1, profile: -1 } },
        outcomeText: 'Tuesdays at your headquarters across the river, with sandwiches and a view of the building they would rather be in. Attendance is complete. Enthusiasm is not.',
      },
      {
        label: 'Confront the whips',
        effects: { stats: { partyStanding: -4, integrity: 2 }, relationships: [{ kind: 'chiefWhip', delta: -8 }] },
        outcomeText: 'You say what it looks like. The Chief Whip says what it is. Neither of you is entirely wrong, and the next meeting is minuted.',
      },
      {
        label: 'Let them meet: you lead the country, not the corridor',
        effects: { stats: { profile: 2, partyStanding: -2 } },
        outcomeText: 'You say the parliamentary party can run Parliament and you will run the argument. It is a good line. A parliamentary party that runs Parliament is a parliamentary party that does not need you to.',
      },
    ],
  },
  {
    id: 'ol_city_hall_legacy',
    title: 'The successor at City Hall',
    body: 'Your successor as mayor has reversed the policy you were proudest of, and has done it with a speech about “a fresh start”. The city noticed. So did the national press, which has decided that this is a story about you.',
    tags: ['constituency', 'media'],
    weight: 9, cooldownDays: 700,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Defend the record',
        effects: { stats: { constituencyApproval: 3, profile: 2, partyStanding: -1 } },
        outcomeText: 'You fight your old city’s corner from the national stage. The city is grateful. The parliamentary party wonders quietly which job you want.',
      },
      {
        label: 'Say nothing: that was then',
        effects: { stats: { competence: 1, constituencyApproval: -2 } },
        outcomeText: 'You are the leader of a national party now, and you say so, and the city hears exactly what it has been told.',
      },
    ],
  },
  {
    id: 'ol_members_rally',
    title: 'The members’ rally',
    body: 'The members who chose you want to see you: a rally in a northern arena, five thousand people and a stage, the kind of event your predecessors could never fill. The parliamentary party was not invited, and has noticed.',
    tags: ['party', 'media'],
    weight: 10, cooldownDays: 500,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Fill the arena',
        effects: { stats: { profile: 4, partyStanding: 1, competence: -1 } },
        outcomeText: 'The pictures are extraordinary and the speech is better. The next morning three MPs tell the papers that rallies do not win elections, and they are right, and nobody is talking about them.',
      },
      {
        label: 'Turn it into a policy launch with the shadow cabinet on stage',
        effects: { stats: { competence: 2, partyStanding: 3 } },
        outcomeText: 'Less of a rally, more of a programme, with the people who will have to defend it standing behind you. The hall is slightly less loud and the party slightly more yours.',
      },
    ],
  },
  {
    id: 'ol_commons_vote',
    title: 'The vote you cannot cast',
    body: 'A knife-edge vote in {house} tonight on a bill your party has made its own, and the whips have everybody in the building except the one person the cameras will look for. The result will be reported, either way, with your absence in the second paragraph.',
    tags: ['westminster', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Spend the evening on the phones to wavering MPs',
        effects: { stats: { competence: 2, partyStanding: 2 } },
        outcomeText: 'You cannot vote but you can call, and you call every name on the list twice. Whether it changed a vote nobody knows; that you did it, everybody does.',
      },
      {
        label: 'Hold a vigil outside with the campaigners',
        effects: { stats: { profile: 3, partyStanding: -1 } },
        outcomeText: 'Candles, placards, a speech through a megaphone in Parliament Square. The campaigners love it. Inside, a colleague mutters about theatre, and is quoted.',
      },
    ],
  },
  {
    id: 'ol_policy_from_outside',
    title: 'Policy without a bench',
    body: 'Your big idea needs a bill, and a bill needs a member to move it. Your deputy will do it, of course; your deputy will also be the face on it. The think tank that wrote it would like to know whose name goes on the cover.',
    tags: ['policy'],
    weight: 10, cooldownDays: 500,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Your name on the cover, the deputy’s on the bill',
        effects: { stats: { profile: 2, partyStanding: -1 } },
        outcomeText: 'The launch is yours and the Commons stage is theirs, and the press write it up as a double act, which is one more act than you wanted.',
      },
      {
        label: 'Give it to the deputy outright',
        effects: { stats: { partyStanding: 3, integrity: 1, profile: -2 } },
        outcomeText: 'It is their bill and their moment and you say so. The party likes a leader who can give things away. It also remembers who had them.',
      },
      {
        label: 'Launch it in the city instead, as a mayors’ programme',
        effects: { stats: { constituencyApproval: 2, competence: 2 } },
        outcomeText: 'Six mayors on a stage with you and a programme that does not need the Commons at all. It is a strength and it is a reminder of where you are not.',
      },
    ],
  },
  {
    id: 'ol_selection_rumour',
    title: 'Which seat?',
    body: 'Every vacancy in the party is now reported as yours. A retiring member in your old region, a safe seat in the north, a by-election that has not even been called. Your office denies each one, which confirms each one.',
    tags: ['media', 'party'],
    weight: 9, cooldownDays: 400,
    requires: { outsideLeader: true },
    choices: [
      {
        label: 'Say you will stand where you are from',
        effects: { stats: { constituencyApproval: 3, integrity: 2, partyStanding: -1 } },
        outcomeText: 'A harder seat and an honest answer. The region approves. The strategists who had a safer plan put it back in the drawer, for now.',
      },
      {
        label: 'Say the party will decide, at the time',
        effects: { stats: { partyStanding: 2, profile: -1 } },
        outcomeText: 'The correct answer and the dullest one. The rumours continue, which at least keeps your name in the paper.',
      },
    ],
  },
];
