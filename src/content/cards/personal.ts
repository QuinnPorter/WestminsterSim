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
  {
    id: 'per_burnout',
    title: 'Running on empty',
    body: 'You fell asleep in a committee, snapped at a caseworker, and can\'t remember your last day off. Your partner leaves a note on the fridge that just says "talk to me?". The body is sending invoices.',
    tags: ['personal', 'serious'],
    weight: 9, cooldownDays: 400,
    choices: [
      {
        label: 'Take a real week off',
        effects: { stats: { competence: 3, profile: -2 } },
        outcomeText: 'Phone in a drawer, walks, sleep, an actual conversation. You come back sharper and kinder. The week of missed votes and silence costs a little visibility. Cheap at the price.',
      },
      {
        label: 'Push through — there\'s no time',
        effects: { stats: { profile: 2, integrity: -1, competence: -2 } },
        outcomeText: 'You power on, visibly everywhere, quietly fraying. The diary is impressed; the mistakes start small and accumulate. The note stays on the fridge.',
      },
    ],
  },
  {
    id: 'per_old_vote_resurfaces',
    title: 'A vote you\'d forgotten',
    body: 'An activist account has dug up a vote you cast years ago that reads very badly out of context — and not brilliantly in it. It\'s climbing. A staffer asks how you want to handle it.',
    tags: ['personal', 'media', 'scandal'],
    weight: 8, cooldownDays: 500,
    choices: [
      {
        label: 'Explain it honestly, own the nuance',
        effects: { stats: { integrity: 4, profile: 1 } },
        outcomeText: 'You post a calm thread explaining the vote, the context, and what you\'d do now. It won\'t satisfy the pile-on, but it satisfies the fair-minded — who are quieter but more numerous.',
      },
      {
        label: 'Ignore it and let it burn out',
        effects: { stats: { profile: -2 } },
        outcomeText: [
          { weight: 2, text: 'You say nothing and the internet, gloriously, forgets by Friday. Silence: occasionally the wisest reply.' },
          { weight: 1, text: 'The silence reads as guilt and a real outlet picks it up. Now it\'s a story about you not answering, which is harder to kill.', extra: { stats: { partyStanding: -3 } } },
        ],
      },
    ],
  },
  {
    id: 'per_book_deal',
    title: 'The book deal',
    body: 'A publisher offers a tidy advance for a memoir-slash-manifesto. It would raise your profile and your bank balance — and hand your enemies 300 pages to quote back at you forever.',
    tags: ['personal', 'media'],
    weight: 8, cooldownDays: 500,
    choices: [
      {
        label: 'Write the bold political book',
        effects: { stats: { profile: 5, partyStanding: -2, integrity: 1 } },
        outcomeText: 'You set out what you actually believe, at length. It sells, it\'s reviewed, it\'s serialised — and one chapter is read aloud, unkindly, in the chamber within the month.',
      },
      {
        label: 'A safe, charming non-memoir',
        effects: { stats: { profile: 2 } },
        outcomeText: 'Anecdotes, no enemies, a nice photo on the back. It does fine in the Christmas market and gives nothing away. The advance buys a new kitchen.',
      },
      {
        label: 'Decline — too risky',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'You pass. The publisher signs your rival instead, whose book is, annoyingly, quite good.',
      },
    ],
  },
  {
    id: 'per_anniversary',
    title: 'The forgotten anniversary',
    body: 'It\'s your anniversary and you are, once again, three hundred miles away at a party fundraiser. Your partner has been more than patient for more years than is fair. The phone is ringing.',
    tags: ['personal', 'serious'],
    weight: 8, cooldownDays: 400,
    choices: [
      {
        label: 'Leave the fundraiser, go home',
        effects: { stats: { integrity: 3, partyStanding: -3, constituencyApproval: 1 } },
        outcomeText: 'You make your excuses, drive through the night, and arrive with flowers and apologies. The party chair is frosty; your marriage is not. Some priorities sort themselves out at 70mph.',
      },
      {
        label: 'Stay — the donors are here',
        effects: { stats: { partyStanding: 3, integrity: -2 } },
        outcomeText: 'You work the room and bank the donations. You phone at midnight to a voice that says it\'s fine in the tone that means it isn\'t. The fund is healthier; something else isn\'t.',
      },
    ],
  },
  {
    id: 'per_health_diagnosis',
    title: 'The diagnosis',
    body: 'The thing you kept rescheduling turned out to be worth seeing a doctor about. It\'s manageable — with rest, treatment, and honesty you\'re not sure Westminster permits. Who, if anyone, do you tell?',
    tags: ['personal', 'serious'],
    weight: 6, cooldownDays: 700,
    choices: [
      {
        label: 'Go public, campaign on it',
        effects: { stats: { profile: 4, integrity: 4, competence: -2 } },
        outcomeText: 'You tell your story and become, overnight, a face for thousands who share the condition. The cause is real and so is the cost: the treatment, and the politics, both take their toll.',
      },
      {
        label: 'Tell only your closest team',
        effects: { stats: { integrity: 2 } },
        outcomeText: 'A tight circle, a quiet treatment plan, a managed diary. You carry on. Most colleagues never know why you started leaving receptions early.',
      },
    ],
  },
  {
    id: 'per_charity_patron',
    title: 'The patronage',
    body: 'A small, vital local charity asks you to be their patron. It would mean real, unglamorous, ongoing commitment — and no political reward to speak of. Just turning up, for years, because it matters.',
    tags: ['personal', 'constituency'],
    weight: 8, cooldownDays: 450,
    choices: [
      {
        label: 'Say yes, and mean it',
        effects: { stats: { integrity: 3, constituencyApproval: 3, competence: -1 } },
        outcomeText: 'You become a genuine, hands-on patron: the fetes, the trustee meetings, the 3am crisis calls. It eats time you don\'t have. It is, quietly, the part of the job you\'ll be proudest of.',
      },
      {
        label: 'Lend your name only',
        effects: { stats: { constituencyApproval: 1 } },
        outcomeText: 'Your name goes on the letterhead and your face to the gala. It helps them, a bit. Everyone understands an MP\'s time is short. You understand it too, and feel the gap.',
      },
    ],
  },
  {
    id: 'per_social_media_pileon',
    title: 'The pile-on',
    body: 'A clumsy late-night post of yours has been wilfully misread and you are, this morning, the main character of the internet. Some of the anger is bad faith. Some of it, uncomfortably, has a point.',
    tags: ['personal', 'media'],
    weight: 9, cooldownDays: 300,
    choices: [
      {
        label: 'Apologise for the real bit, ignore the rest',
        effects: { stats: { integrity: 3, profile: 1 } },
        outcomeText: 'You concede the fair criticism cleanly and don\'t engage the trolls. It defuses the genuine grievance and starves the rest. By tomorrow you are no longer the main character.',
      },
      {
        label: 'Double down defiantly',
        effects: { stats: { profile: 3, partyStanding: -3 } },
        outcomeText: [
          { weight: 1, text: 'Your base loves the defiance and rallies round. The clip travels; your profile spikes. The whips wince but the polling among your supporters ticks up.' },
          { weight: 1, text: 'Doubling down pours petrol on it. A second day, a third, a front page. The whips call. "Just stop posting," they beg.', extra: { stats: { partyStanding: -4, profile: -1 } } },
        ],
      },
    ],
  },
  {
    id: 'per_mentor_retires',
    title: 'The mentor steps down',
    body: '{mentor} is standing down at the next election. Over a last lunch in the members\' dining room, they offer you the thing they have left to give: their contacts, their causes, and one piece of brutally honest advice.',
    speaker: 'mentor',
    tags: ['personal', 'party'],
    weight: 7, cooldownDays: 600,
    choices: [
      {
        label: 'Take up their causes',
        effects: { stats: { partyStanding: 3, integrity: 3 }, relationships: [{ kind: 'mentor', delta: 8 }] },
        outcomeText: 'You promise to carry their unfinished campaigns forward, and you mean it. They hand you a contacts book worth more than gold and a look that says: don\'t waste it.',
      },
      {
        label: 'Thank them and forge your own path',
        effects: { stats: { profile: 2, integrity: 1 } },
        outcomeText: 'You honour them but politely decline the inheritance — you have your own road. They nod, a little sad, a little proud. "Good," they say. "Never just be someone\'s heir."',
      },
    ],
  },
];
