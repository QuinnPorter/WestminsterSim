import { DecisionCard } from '../../types/content';

/** Always-eligible fallback pool — any tier, government or opposition.
 *  The engine guarantees it can never stall as long as this pool exists. */
export const PERSONAL_CARDS: DecisionCard[] = [
  {
    id: 'per_social_media',
    title: 'The post',
    body: 'Late at night, you draft a spicy post about the day\'s news. Your thumb hovers over publish. Your staffer once made you promise to "sleep on the funny ones".',
    tags: ['personal', 'media', 'funny'],
    weight: 10, cooldownDays: 240,
    choices: [
      {
        label: 'Post it',
        effects: { stats: { profile: 4 }, relationships: [{ kind: 'chiefWhip', delta: -3 }] },
        outcomeText: [
          { weight: 3, text: 'It does numbers. Even your rival grudgingly reposts it. The whips pretend not to laugh.' },
          { weight: 1, text: 'It is screenshotted, misread, and turned into a minor news cycle. Worth it? Hard to say.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
      {
        label: 'Delete it and sleep',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'You sleep. In the morning, someone else has posted something worse and is trending. Dodged.',
      },
    ],
  },
  {
    id: 'per_family_weekend',
    title: 'The empty chair',
    body: 'Your family has stopped saving you a seat at Sunday lunch. This weekend there is a constituency fair, a select committee briefing pack, and a birthday you have already missed twice.',
    tags: ['personal', 'serious'],
    weight: 10, cooldownDays: 300,
    choices: [
      {
        label: 'Go home, phone off',
        effects: { stats: { competence: -1, constituencyApproval: 1, integrity: 2 } },
        outcomeText: 'Cake, candles, and nobody mentions politics until pudding. You needed it more than you admitted.',
      },
      {
        label: 'Work through it again',
        effects: { stats: { competence: 3 } },
        outcomeText: 'The briefing pack is mastered, the fair is attended, the birthday card is in the post. Something in your chest files a complaint for later.',
      },
    ],
  },
  {
    id: 'per_marathon',
    title: 'Fun run',
    body: 'The local hospice asks you to run the constituency 10k in a foam Big Ben costume. The photos will exist forever, whichever way this goes.',
    tags: ['personal', 'constituency', 'funny'],
    weight: 8, cooldownDays: 400,
    choices: [
      {
        label: 'Run it in the costume',
        effects: { stats: { constituencyApproval: 5, profile: 2 } },
        outcomeText: 'You finish 214th, dressed as a clock tower, to genuine cheers. The hospice raises a record sum. The photos are everywhere and, somehow, endearing.',
      },
      {
        label: 'Sponsor generously instead',
        effects: { stats: { constituencyApproval: 1 } },
        outcomeText: 'A dignified donation and a tweet of support. Sensible. Forgettable.',
      },
    ],
  },
  {
    id: 'per_old_friend',
    title: 'An old friend calls',
    body: 'A friend from your old life — before all this — is in town and wants dinner. They have also, they mention casually, just taken a job at a lobbying firm.',
    tags: ['personal', 'serious'],
    weight: 8, cooldownDays: 350,
    choices: [
      {
        label: 'Dinner, but you pay',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'You split the evening between nostalgia and carefully changing the subject. You pay, you declare it anyway, and you go home feeling like you passed a test no one set.',
      },
      {
        label: 'Let them expense it',
        effects: { stats: { integrity: -4 }, setFlags: { lobbyDinner: true } },
        outcomeText: 'Lovely meal. Excellent wine. A receipt now exists with your name adjacent to it, in a filing system you do not control.',
      },
      {
        label: 'Too busy, sadly',
        effects: {},
        outcomeText: 'You cancel. They understand, which is somehow worse. The job has eaten another friendship — but a clean one.',
      },
    ],
  },
  {
    id: 'per_health_scare',
    title: 'The check-up',
    body: 'You have rescheduled the GP appointment four times. Your assistant has now booked it in your diary under a fake meeting name so you cannot wriggle out.',
    tags: ['personal', 'serious'],
    weight: 6, cooldownDays: 500,
    choices: [
      {
        label: 'Go to the appointment',
        effects: { stats: { competence: 1 } },
        outcomeText: 'Blood pressure: "parliamentary". Advice: sleep, vegetables, fewer receptions. You frame the printout as a joke and then, quietly, follow some of it.',
      },
      {
        label: 'Reschedule a fifth time',
        effects: { stats: { competence: -1 } },
        outcomeText: 'The fake meeting is replaced by a real one. Your assistant says nothing in a very loud way.',
      },
    ],
  },
  {
    id: 'per_podcast',
    title: 'The podcast invitation',
    body: 'A wildly popular politics podcast wants you on. Long format, no notes, famously good at getting guests to say one sentence too many.',
    tags: ['media', 'personal'],
    weight: 9, cooldownDays: 280,
    choices: [
      {
        label: 'Do it, fully prepped',
        effects: { stats: { profile: 5, competence: 1 } },
        outcomeText: 'Ninety minutes, two laughs, zero gaffes. Clips circulate with approving captions. The party press office exhales.',
      },
      {
        label: 'Do it, wing it',
        effects: { stats: { profile: 3 } },
        outcomeText: [
          { weight: 2, text: 'Loose, funny, human. The hosts love you. The one risky anecdote lands safely on the right side of charming.' },
          { weight: 1, text: 'You say one sentence too many, as foretold. It chases you around the internet for a fortnight.', extra: { stats: { partyStanding: -4, profile: 2 } } },
        ],
      },
      {
        label: 'Decline politely',
        effects: {},
        outcomeText: 'They book your rival instead, who is — annoyingly — quite good on it.',
      },
    ],
  },
  {
    id: 'per_train_delay',
    title: 'The 18:47 to {constituency}',
    body: 'Your train home is cancelled. Again. The platform is full of your constituents, several of whom recognise you, all of whom have opinions about the railways.',
    tags: ['personal', 'constituency', 'funny'],
    weight: 9, cooldownDays: 220,
    choices: [
      {
        label: 'Hold an impromptu platform surgery',
        effects: { stats: { constituencyApproval: 4, profile: 1 } },
        outcomeText: 'Forty minutes of complaints, two genuinely useful case files, and a selfie that ends up in the local paper under "MP STRANDED WITH THE REST OF US".',
      },
      {
        label: 'Headphones in, head down',
        effects: { stats: { constituencyApproval: -2, competence: 1 } },
        outcomeText: 'You clear your inbox on the replacement bus. Someone posts a photo captioned "too important to talk to us". It gets eleven likes. You monitor all eleven.',
      },
    ],
  },
  {
    id: 'per_quiz_night',
    title: 'Pub quiz ringer',
    body: 'The constituency Rotary Club begs you to join their pub quiz team for the charity final. Their weak round is, ironically, politics.',
    tags: ['personal', 'constituency', 'funny'],
    weight: 7, cooldownDays: 380,
    choices: [
      {
        label: 'Join and carry the politics round',
        effects: { stats: { constituencyApproval: 3 } },
        outcomeText: 'You go nine for ten on the politics round, missing only the question about yourself. The team wins. The photo of you holding a novelty trophy does more for you than three press releases.',
      },
      {
        label: 'Send a signed bottle instead',
        effects: {},
        outcomeText: 'The bottle raises £40 in the raffle. The team comes third. Life goes on.',
      },
    ],
  },
];
