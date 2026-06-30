import { DecisionCard } from '../../types/content';

/**
 * Squad C — C2. A fresh batch of one-off themed dilemmas spanning tiers and
 * sides: backbench texture, broadcast traps, casework, portfolio crunch,
 * opposition mischief, and the occasional scandal. Written to sit alongside the
 * celebrated one-offs ("The vegetable of judgement", "Section 114", "Three
 * lines, one conscience") in structure and tone — real Westminster trade-offs,
 * dry wit, no cartoonishness. New file only; registered in index.ts.
 */
export const EXTRA_ONE_OFF_CARDS: DecisionCard[] = [
  // ---------------------------------------------------------------- backbench
  {
    id: 'x1_urgent_question',
    title: 'The urgent question',
    body: 'The Speaker has granted an urgent question on a story breaking right now, and the minister is "travelling". You could put your name down to ask — first time at the despatch box on something live, with no notice and the chamber filling up to watch.',
    tags: ['westminster', 'media'],
    weight: 11, cooldownDays: 420,
    requires: { maxTier: 2 },
    choices: [
      {
        label: 'Go up and wing it on the facts you have',
        effects: { stats: { profile: 5, competence: 2 } },
        outcomeText: 'You ask a tight, well-aimed question and the stand-in minister flounders. Two front benches notice the same thing at once: this one can do it cold. Clips travel; so does your name, upward.',
      },
      {
        label: 'Pass — let a more senior colleague lead',
        effects: { stats: { partyStanding: 2 } },
        outcomeText: 'You defer to a shadow who has done forty of these. Sensible, team-minded, and entirely forgettable. The moment that might have been yours belongs to someone with a longer Wikipedia entry.',
      },
    ],
  },
  {
    id: 'x1_maiden_speech_clash',
    title: 'The wrong day to be brave',
    body: 'A new intake colleague is giving their maiden speech this afternoon — by tradition, heard in respectful silence. It is also, by sheer bad luck, the only window to table your amendment before the deadline. Tabling it means breaking the convention and stepping on their moment.',
    tags: ['westminster', 'party'],
    weight: 8, cooldownDays: 500,
    requires: { maxTier: 2 },
    speaker: 'ally',
    choices: [
      {
        label: 'Hold the amendment, let them have their day',
        effects: { stats: { integrity: 3, partyStanding: 2 } },
        outcomeText: 'You miss the deadline and reschedule. The newcomer\'s speech lands beautifully and they thank you, not knowing what it cost. Some courtesies are invisible; this is the job rewarding itself in private.',
      },
      {
        label: 'Table it — the deadline waits for no one',
        effects: { stats: { competence: 2, partyStanding: -3 } },
        outcomeText: 'You get the amendment in. The newcomer\'s maiden speech is now "the one that was interrupted", and the older hands file you under "sharp elbows". The amendment, for the record, goes nowhere.',
      },
    ],
  },
  {
    id: 'x1_select_committee_grilling',
    title: 'The witness chair',
    body: 'You sit on a select committee that has summoned a tech billionaire who has spent the morning being smoothly evasive. The chair gives you the last five minutes. You have one genuinely damaging question and the documents to back it — or you can do the crowd-pleasing soundbite everyone will share.',
    tags: ['westminster', 'media'],
    weight: 10, cooldownDays: 400,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Bury them with the documents',
        effects: { stats: { competence: 5, profile: 2 } },
        outcomeText: 'You walk them line by line into a contradiction they cannot wriggle out of, and the room goes very quiet. No viral clip — just a witness who leaves looking smaller than they arrived, and a committee that now takes you seriously.',
      },
      {
        label: 'Land the soundbite for the cameras',
        effects: { stats: { profile: 5, competence: -2 } },
        outcomeText: 'You deliver the zinger and it does numbers all evening. The billionaire, who has lawyers, notes that it was more theatre than substance — and is, irritatingly, right. The story is the clip, not the scandal.',
      },
    ],
  },
  {
    id: 'x1_voting_app_glitch',
    title: 'The vote you missed',
    body: 'You were paired with an opposition MP for a vote you both had to miss — a gentleman\'s agreement, honoured for a century. Tonight the pairing has gone wrong: they voted, you didn\'t, and your side lost by one. The whips want to know whether you were cheated or careless.',
    tags: ['westminster', 'party'],
    weight: 7, cooldownDays: 600,
    requires: { maxTier: 3 },
    speaker: 'chiefWhip',
    choices: [
      {
        label: 'Raise it as a breach — name and shame',
        effects: { stats: { profile: 3, integrity: 1 }, relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'You make a point of order and the other side\'s MP is hauled before their own whips. The pairing system, already fraying, frays a little more. Your whips are pleased; the convention is one funeral closer.',
      },
      {
        label: 'Eat it quietly — the system runs on trust',
        effects: { stats: { integrity: 3, partyStanding: -2 } },
        outcomeText: 'You let it go, on the grounds that a hundred years of pairing is worth more than one lost division. Magnanimous, and faintly maddening to colleagues who counted the vote. The trust survives another week.',
      },
    ],
  },
  {
    id: 'x1_thinktank_paper',
    title: 'The think-tank wants your name',
    body: 'A glossy think-tank offers to publish a pamphlet under your byline — bold, provocative, certain to get you on the broadcast round. They have already written it. It is sharper than anything you\'d say in your own words, and on one point, sharper than you actually believe.',
    tags: ['media', 'policy'],
    weight: 9, cooldownDays: 450,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Rewrite it until it\'s genuinely yours',
        effects: { stats: { competence: 3, integrity: 3, profile: 1 } },
        outcomeText: 'You spend a weekend turning their punchy ghost-written copy into something you can defend at 7am on the radio. Less viral, fully owned. When challenged, you don\'t flinch, because every line is actually yours.',
      },
      {
        label: 'Sign it as written and ride the noise',
        effects: { stats: { profile: 5, integrity: -3 } },
        outcomeText: 'You put your name to it and do the round. It travels — until an interviewer reads back the one line you don\'t really mean, and you discover that "I think the pamphlet may have overstated it" is not a sentence anyone survives gracefully.',
      },
    ],
  },
  {
    id: 'x1_spad_overheard',
    title: 'The SpAd in the lift',
    body: 'Trapped in a Portcullis House lift, you overhear two special advisers — not yours — gossiping freely about a reshuffle, a rival\'s drink problem, and a number that, if true, blows a hole in a minister\'s flagship policy. They have not noticed you. The doors will open in nine floors.',
    tags: ['westminster', 'scandal'],
    weight: 8, cooldownDays: 520,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Forget you heard any of it',
        effects: { stats: { integrity: 4 } },
        outcomeText: 'You study the lift\'s emergency notice with great interest and walk out remembering nothing. Lobby life runs on a thousand such silences. You sleep well; you simply know one fewer thing than you might have.',
      },
      {
        label: 'Quietly verify the policy number and use it',
        effects: { stats: { competence: 3, profile: 2, integrity: -2 } },
        outcomeText: 'You can\'t un-hear the figure, so you confirm it the proper way and deploy it in committee. The minister never works out where it came from. Useful, deniable, and a small thing you traded for it that you can\'t quite name.',
      },
      {
        label: 'Mention the drink problem to a journalist',
        effects: { stats: { profile: 2, integrity: -5 }, relationships: [{ kind: 'journalist', delta: 4 }, { kind: 'rival', delta: -4 }] },
        outcomeText: 'You pass on the human detail, the one that wasn\'t yours to pass on. It runs as "friends are concerned". You\'ve banked a favour with the press and lost something you won\'t miss until you need it: the benefit of the doubt.',
      },
    ],
  },
  // ------------------------------------------------------------------- media
  {
    id: 'x1_radio_ambush',
    title: 'The breakfast ambush',
    body: 'You agreed to a "quick chat about the high street" on the morning programme. Forty seconds in, the presenter pivots — hard — to a colleague\'s resignation overnight that you know nothing about. The clock is running and the country is eating its cereal.',
    tags: ['media'],
    weight: 11, cooldownDays: 380,
    requires: { maxTier: 3 },
    speaker: 'journalist',
    choices: [
      {
        label: 'Admit you haven\'t seen it, decline to speculate',
        effects: { stats: { integrity: 4, competence: 2, profile: -1 } },
        outcomeText: '"I genuinely haven\'t seen the detail, so I won\'t pretend to" — three honest sentences that bore the presenter and reassure everyone else. No clip, no gaffe. The quietest possible win.',
      },
      {
        label: 'Bluff a line and brazen it out',
        effects: { stats: { profile: 3, competence: -3, integrity: -1 } },
        outcomeText: 'You improvise a confident-sounding response about a resignation you can\'t actually describe. The presenter, who has read the statement, gently corrects you on air. The clip outlives the news it was about.',
      },
      {
        label: 'Snap that this isn\'t what you came to discuss',
        effects: { stats: { profile: 4, constituencyApproval: -2, competence: -1 } },
        outcomeText: 'You bristle, the presenter smells blood, and "MP loses cool over high street" becomes a montage. Your point about the high street, which was a good one, is never heard again.',
      },
    ],
  },
  {
    id: 'x1_documentary_access',
    title: 'The fly on the wall',
    body: 'A documentary team wants three months of access — your office, your surgeries, the late-night votes, the real texture of the job. It could humanise politics or hang you with your own candour. The producer is charming and the release form is very long.',
    tags: ['media', 'personal'],
    weight: 8, cooldownDays: 700,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Let them in, no veto, total honesty',
        effects: { stats: { profile: 6, integrity: 3, competence: -1 } },
        outcomeText: 'You give them everything and ask for nothing back. The film is honest, occasionally unflattering, and quietly devastating to the cynics who think MPs don\'t work. It also captures one tired, unguarded line you\'ll be asked about for years.',
      },
      {
        label: 'Agree — with sign-off on the final cut',
        effects: { stats: { profile: 3, integrity: -2 } },
        outcomeText: 'You take the access and the control. The result is glossy, safe and faintly suspicious to anyone who notices there are no rough edges. The producer\'s emails get steadily cooler.',
      },
      {
        label: 'Decline — the job is hard enough watched once',
        effects: { stats: { integrity: 1 } },
        outcomeText: 'You pass, politely. The series finds a more biddable MP and does fine without you. You keep your evenings unfilmed, which on balance is worth more than a profile in the listings magazine.',
      },
    ],
  },
  {
    id: 'x1_deepfake_clip',
    title: 'The clip you never said',
    body: 'A slick, AI-generated video of "you" saying something inflammatory is racing around social media. It is fake — convincingly so — and already has more views than anything you have ever genuinely said. Your inbox is on fire and a broadcaster wants a comment in twenty minutes.',
    tags: ['media', 'crisis'],
    weight: 9, cooldownDays: 480,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Calm, factual rebuttal with the evidence',
        effects: { stats: { competence: 4, integrity: 3, profile: 1 } },
        outcomeText: 'You publish the original footage, flag the fake to the platforms, and keep your tone level. It spreads slower than the lie but it sticks. You become, briefly, the sensible voice on a subject everyone else is shrieking about.',
      },
      {
        label: 'Go nuclear — lawyers, outrage, the lot',
        effects: { stats: { profile: 5, competence: -2 } },
        outcomeText: 'You threaten everyone in sight and do an angry broadcast. The Streisand effect does the rest: the fake clip gets a second life as "the one the MP tried to ban". You are now more associated with it, not less.',
      },
    ],
  },
  // ----------------------------------------------------------- minister / SoS
  {
    id: 'x1_official_advice_ignored',
    title: 'The submission you don\'t like',
    body: 'Your officials have sent up a careful, evidenced submission recommending the cautious option. Your instinct, your manifesto and your political antennae all say be bold. The permanent secretary has, very politely, asked for a written direction if you overrule them.',
    tags: ['policy'],
    weight: 11, cooldownDays: 420,
    requires: { minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Take the official advice — bank the competence',
        effects: { stats: { competence: 4, profile: -1 } },
        outcomeText: 'You go with the submission. It is sound, defensible, and exactly what the machine wanted. The manifesto pledge slips a notch and a backbencher mutters about "capture", but the policy works and nobody gets sued.',
      },
      {
        label: 'Overrule them and sign the direction',
        effects: { stats: { profile: 4, integrity: 2, competence: -2 }, setFlags: { ministerialDirection: true } },
        outcomeText: 'You put your reasons in writing and own the call. Ministers are meant to decide, and you have. If it works you\'re bold; if it doesn\'t, that signed direction is the first document the inquiry reads aloud.',
      },
    ],
  },
  {
    id: 'x1_leak_inquiry',
    title: 'The leak inquiry',
    body: 'A market-sensitive line from your department hit the front page before it hit the House. The Cabinet Secretary has ordered a leak inquiry, and the trail runs uncomfortably close to your own office — possibly to the SpAd you rely on most.',
    tags: ['scandal', 'westminster'],
    weight: 9, cooldownDays: 540,
    requires: { minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Cooperate fully, hand over the phones',
        effects: { stats: { integrity: 4, competence: 1, profile: -2 } },
        outcomeText: 'You give the inquiry everything, including access to your own messages. It clears you and pins the leak on a junior elsewhere. Uncomfortable, slow, and the only version where you can look the Cabinet Secretary in the eye afterwards.',
      },
      {
        label: 'Protect your SpAd and stonewall politely',
        effects: { stats: { partyStanding: 2, integrity: -4 }, setFlags: { leakSuspicion: true }, relationships: [{ kind: 'ally', delta: 4 }] },
        outcomeText: 'You close ranks and the inquiry stalls in a thicket of "ongoing reviews". Your SpAd is loyal for life. But the Cabinet Secretary files you under "obstructive", and that file is read at reshuffle time.',
      },
    ],
  },
  {
    id: 'x1_quango_appointment',
    title: 'The chairmanship',
    body: 'A flagship public body needs a new chair, and the obvious appointment is a genuine expert who once savaged your party in print. The alternative is a competent, loyal donor the Number 10 grid would much prefer. The appointments commissioner is watching.',
    tags: ['policy', 'westminster'],
    weight: 9, cooldownDays: 500,
    requires: { minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Appoint the expert who once attacked you',
        effects: { stats: { integrity: 5, competence: 3, partyStanding: -3 } },
        outcomeText: 'You hand the job to the best candidate, critic and all. The body thrives, the appointment is unimpeachable, and Number 10\'s grid people will not forget that you went off-script. Quality has a price, and you paid it.',
      },
      {
        label: 'Appoint the safe, loyal donor',
        effects: { stats: { partyStanding: 3, integrity: -4 }, setFlags: { croniesAppointment: true } },
        outcomeText: 'The grid is delighted and the donor is grateful. Then a select committee asks the donor a basic question about the body they now chair, and the silence is broadcast live. "Cronyism" enters the cuttings file with your name beside it.',
      },
    ],
  },
  {
    id: 'x1_budget_cut_choice',
    title: 'The line in the spending review',
    body: 'The Treasury has handed you a flat settlement and a deadline. To balance it you must cut one of two things: a small, beloved programme that helps a few thousand vulnerable people very visibly, or a dull back-office system whose failure would be catastrophic but invisible for years.',
    tags: ['policy', 'serious'],
    weight: 10, cooldownDays: 460,
    requires: { minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Protect the visible programme, gamble on the system',
        effects: { stats: { profile: 3, constituencyApproval: 2, competence: -3 } },
        outcomeText: 'You save the thing the cameras love and quietly starve the back office. For now, everyone\'s happy. Somewhere in a server room, a problem compounds at interest, banking up a future headline with a date on it years from now.',
      },
      {
        label: 'Fund the boring system, cut the beloved programme',
        effects: { stats: { competence: 5, integrity: 2, constituencyApproval: -4, profile: -2 }, addHeadline: 'Minister axes lifeline scheme' },
        outcomeText: 'You make the grown-up call and take the kicking for it. The scheme\'s users picket the department; the editorials are merciless. The system holds, which is precisely the kind of disaster nobody ever thanks you for preventing.',
      },
    ],
  },
  {
    id: 'x1_red_box_late',
    title: 'The midnight red box',
    body: 'It is 1am, the red box still has a finger of papers in it, and tomorrow is brutal. The last submission is a knotty, consequential decision that deserves a clear head you no longer have. Your private secretary has flagged it "for decision" with a hopeful Post-it.',
    tags: ['personal', 'policy'],
    weight: 9, cooldownDays: 400,
    requires: { minTier: 3, inGovernment: true },
    choices: [
      {
        label: 'Send it back: "Not tonight — I\'ll do it properly tomorrow"',
        effects: { stats: { competence: 4, integrity: 2 } },
        outcomeText: 'You refuse to rubber-stamp something serious at 1am and the office, slightly surprised, reschedules it. The decision, made fresh, is better. A small act of discipline that the machine quietly learns to respect.',
      },
      {
        label: 'Power through and sign it now',
        effects: { stats: { competence: -2, profile: 1 } },
        outcomeText: 'You clear the box by half one, exhausted and faintly heroic. Three weeks later the tired decision needs unpicking, and unpicking is always harder than deciding. Still — empty box, brief glow, brief.',
      },
    ],
  },
  // -------------------------------------------------------------- opposition
  {
    id: 'x1_opposition_day_motion',
    title: 'The opposition day trap',
    body: 'It is your party\'s opposition day and you control the motion. You can write it as a genuine policy proposition the government might struggle to oppose — or as a gleeful wedge designed purely to split their backbenches and generate a viral division list.',
    tags: ['party', 'westminster'],
    weight: 10, cooldownDays: 440,
    requires: { inGovernment: false, maxTier: 4 },
    choices: [
      {
        label: 'Write a serious motion that could actually pass',
        effects: { stats: { competence: 4, integrity: 3, profile: -1 } },
        outcomeText: 'You draft something so reasonable that a dozen government MPs are visibly tempted. It doesn\'t win, but it makes the case and looks like a government-in-waiting. The grown-ups notice; the clips desk is bored.',
      },
      {
        label: 'Write the wedge and watch them squirm',
        effects: { stats: { profile: 5, partyStanding: 2, integrity: -3 } },
        outcomeText: 'You build a beautiful trap, the government tears itself in half opposing it, and the division list is shared with delight all evening. It also teaches them to do exactly the same to you the moment they\'re in opposition. Politics keeps the receipts.',
      },
    ],
  },
  {
    id: 'x1_shadow_costings',
    title: 'The shadow budget question',
    body: 'You are on the broadcast round defending the shadow team\'s spending plans when the presenter produces a number you cannot make add up. Privately you suspect the costing is dodgy. Live, on air, you must decide how loyally to sell it.',
    tags: ['media', 'policy'],
    weight: 10, cooldownDays: 420,
    requires: { inGovernment: false, minTier: 2, maxTier: 4 },
    speaker: 'journalist',
    choices: [
      {
        label: 'Hold the line and defend the number',
        effects: { stats: { partyStanding: 3, competence: -2, integrity: -2 } },
        outcomeText: 'You sell the costing with a straight face and a fixed smile. The team is grateful and the fact-checkers are not. By teatime the number has been "corrected" by your own front bench, and you defended it to the last on live television.',
      },
      {
        label: 'Concede the figure needs work, pivot to the principle',
        effects: { stats: { integrity: 4, competence: 2, partyStanding: -3 } },
        outcomeText: '"The precise figure is something we\'ll firm up" — honest, faintly off-message, and a small earthquake in the WhatsApp group. The presenter respects it; your shadow chancellor would like a word.',
      },
    ],
  },
  {
    id: 'x1_byelection_swing',
    title: 'The by-election the morning after',
    body: 'Your party has just taken a seat off the government in a thumping by-election. The broadcasters want a triumphant face, the leader\'s office wants discipline, and one over-excited colleague is already briefing that this means a particular policy must now change. The narrative is up for grabs for about four hours.',
    tags: ['party', 'media'],
    weight: 9, cooldownDays: 600,
    requires: { inGovernment: false, minTier: 2 },
    choices: [
      {
        label: 'Stay disciplined: "the public want a change, not a party"',
        effects: { stats: { competence: 3, partyStanding: 4 } },
        outcomeText: 'You decline to over-read one result and keep the focus on the government\'s failures. Dull, correct, and exactly what a winning operation does. The leader\'s office sends a rare and slightly startling thank-you.',
      },
      {
        label: 'Claim it as a mandate for your pet policy',
        effects: { stats: { profile: 4, partyStanding: -3 }, relationships: [{ kind: 'leader', delta: -3 }] },
        outcomeText: 'You go on telly and announce what the result "really means" — which is, conveniently, your hobby-horse. It makes the bulletins and irritates everyone above you, who now have to spend the afternoon un-saying it.',
      },
    ],
  },
  // ----------------------------------------------------------------- scandal
  {
    id: 'x1_register_of_interests',
    title: 'The late entry',
    body: 'Tidying your affairs, you realise a small consultancy payment from eighteen months ago never made it onto the Register of Members\' Financial Interests. Genuinely an oversight, comfortably outside any rule about deliberate concealment — but the clock on the technical breach is already running.',
    tags: ['scandal', 'westminster'],
    weight: 8, cooldownDays: 620,
    requires: { maxTier: 4 },
    choices: [
      {
        label: 'Self-report to the Commissioner immediately',
        effects: { stats: { integrity: 5, profile: -1 } },
        outcomeText: 'You write to the Standards Commissioner before anyone asks, register the entry, and accept the mild rebuke. A one-line correction, no story. Owning a small mistake fast is the cheapest insurance in politics.',
      },
      {
        label: 'Quietly add it now and hope nobody checks the dates',
        effects: { stats: { integrity: -3 }, setFlags: { registerGap: true } },
        outcomeText: 'You slip it into the register and say nothing. It sits there, a small dated anomaly, perfectly visible to anyone who ever decides to look. The gamble isn\'t whether it\'s found — it\'s when, and by whom.',
      },
    ],
  },
  {
    id: 'x1_old_tweet',
    title: 'The fifteen-year-old tweet',
    body: 'A researcher for a rival outlet has unearthed something you posted as a much younger, much glibber person — a joke that read as edgy then and reads as appalling now. It is unmistakably you. They\'re running it tomorrow and want a response tonight.',
    tags: ['scandal', 'media', 'personal'],
    weight: 9, cooldownDays: 560,
    requires: { maxTier: 4 },
    choices: [
      {
        label: 'Apologise plainly, no excuses, delete nothing',
        effects: { stats: { integrity: 4, constituencyApproval: 1, profile: -2 } },
        outcomeText: 'You say it was wrong, you\'re sorry, and you\'ve changed — and you leave the post up rather than scrubbing the evidence. The "non-apology" hunters find nothing to hunt. It hurts for a day and then it\'s genuinely over.',
      },
      {
        label: 'Lawyer up and call it a smear',
        effects: { stats: { profile: 3, integrity: -4 }, setFlags: { scandal: true } },
        outcomeText: 'You deny the spirit while admitting the letter and threaten the outlet. The story now has a second day — "MP refuses to apologise" — and a third, when the threats go nowhere. The flag stays on the file.',
      },
      {
        label: 'Claim the account was "managed by a team back then"',
        effects: { stats: { integrity: -5, competence: -1 } },
        outcomeText: 'You imply a phantom intern wrote it. Within an hour someone produces the reply you sent from the same account that same afternoon, unmistakably you, mid-conversation. The cover story is now the story.',
      },
    ],
  },
  // ----------------------------------------------------------- constituency
  {
    id: 'x1_casework_miracle',
    title: 'The letter that worked',
    body: 'A constituent you fought for two years ago — a benefits case everyone said was hopeless — has written to say your intervention quite literally saved their life, and they\'ve nominated you for a national "good egg" award you find slightly mortifying. The local paper has the story and wants you at the ceremony.',
    tags: ['constituency', 'personal', 'funny'],
    weight: 8, cooldownDays: 480,
    choices: [
      {
        label: 'Go, but make the day about them',
        effects: { stats: { constituencyApproval: 4, integrity: 3 } },
        outcomeText: 'You accept the award and spend the entire speech talking about the constituent and the caseworker who actually did the legwork. Modest, genuine, and quietly the best press you\'ll get all year precisely because you weren\'t chasing it.',
      },
      {
        label: 'Politely decline the limelight',
        effects: { stats: { integrity: 4, constituencyApproval: 1 } },
        outcomeText: 'You send your thanks and ask that the caseworker be honoured instead. The gesture is noticed by exactly the right number of people: a few. Some good deeds are happiest unphotographed.',
      },
      {
        label: 'Lean in — turn it into a campaign launch',
        effects: { stats: { profile: 4, integrity: -2, constituencyApproval: 1 } },
        outcomeText: 'You use the warm story to launch a wider "casework that works" tour. It\'s effective and faintly queasy-making, building a brand on someone\'s worst year. The constituent doesn\'t mind. You\'re not sure that\'s the point.',
      },
    ],
  },
  {
    id: 'x1_remembrance_clash',
    title: 'Two wreaths, one Sunday',
    body: 'Remembrance Sunday, and two villages in {constituency} hold their services at exactly the same hour, eleven miles apart. Both have always expected their MP. Whichever you choose, the other\'s parish magazine will record your absence in a tone of deep, churchy disappointment.',
    tags: ['constituency', 'personal'],
    weight: 8, cooldownDays: 520,
    choices: [
      {
        label: 'Alternate yearly and write to both, in advance',
        effects: { stats: { constituencyApproval: 3, integrity: 2 } },
        outcomeText: 'You set up a fair rota, explain it warmly to both, and turn up properly at one rather than badly at neither. Most people, told the truth in advance, are reasonable. The parish magazines find other griefs.',
      },
      {
        label: 'Try to do both — a heroic dash between the two',
        effects: { stats: { constituencyApproval: -1, profile: 1, competence: -1 } },
        outcomeText: 'You manage half a service at each, arriving late to one and leaving early from the other, and standing slightly breathless at both cenotaphs. Nobody is fully satisfied, and the dash itself becomes a small, fond local legend.',
      },
    ],
  },
  {
    id: 'x1_school_funding_formula',
    title: 'The school that loses out',
    body: 'A new national funding formula is, on the whole, fairer — and it quietly takes money from the secondary school in {constituency} where half the town was educated, including you. Defending the formula means defending a cut to your own old school.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 9, cooldownDays: 500,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Back the fairer formula and explain why, locally',
        effects: { stats: { integrity: 4, competence: 3, constituencyApproval: -3 } },
        outcomeText: 'You stand in the school hall and make the honest case: it\'s fairer overall, even though it costs us here. Half the room respects it; the other half puts "MP backs cut to OUR school" on the noticeboard. You meant every word, which doesn\'t soften it.',
      },
      {
        label: 'Fight your corner — exemptions for towns like yours',
        effects: { stats: { constituencyApproval: 5, integrity: -2, partyStanding: -1 } },
        outcomeText: 'You demand a carve-out and win a small one. The old school is spared; the formula is a little less fair; and somewhere, another town\'s MP you\'ve never met now has a slightly worse settlement and your name in their inbox.',
      },
    ],
  },
  {
    id: 'x1_local_developer_jobs',
    title: 'The gigafactory bid',
    body: 'A foreign manufacturer might build a vast plant — two thousand jobs — on the edge of {constituency}. Securing it means lavishing it with subsidy and waving through environmental concerns the campaigners are already raising. The company has three other towns competing and a tight deadline.',
    tags: ['constituency', 'policy'],
    weight: 9, cooldownDays: 540,
    requires: { maxTier: 3 },
    choices: [
      {
        label: 'Throw everything at winning the jobs',
        effects: { stats: { constituencyApproval: 5, profile: 2, integrity: -2 } },
        outcomeText: 'You lobby ministers ragged, sweeten the package, and the plant comes to your town. Two thousand jobs, one ribbon to cut, and a wetland the campaigners will name after you in their newsletters for years. You decide the payslips win.',
      },
      {
        label: 'Insist on real conditions, even at the risk of losing it',
        effects: { stats: { integrity: 4, competence: 2, constituencyApproval: -3 } },
        outcomeText: 'You hold out for binding environmental and local-hiring terms. The company grumbles; one rival town offers more and you very nearly lose the lot. In the end they sign — but the months of "MP risks 2,000 jobs over newts" headlines were real.',
      },
    ],
  },
  // -------------------------------------------------------------------- party
  {
    id: 'x1_conference_speech_slot',
    title: 'The graveyard slot',
    body: 'You\'ve been handed a conference speech — but it\'s the dead slot just after lunch, to a half-empty hall and an unattended press gallery. You could phone it in, or write something worth the room you wish you had and gamble that the clips travel even if the seats are empty.',
    tags: ['party', 'media'],
    weight: 9, cooldownDays: 520,
    requires: { maxTier: 4 },
    choices: [
      {
        label: 'Write the speech of your life for an empty hall',
        effects: { stats: { profile: 4, competence: 3, partyStanding: 2 } },
        outcomeText: 'You treat the ghost audience like the main stage, and a single passionate passage gets clipped and shared into the evening. The hall was empty; the speech wasn\'t. People upstairs ask who wrote it. You did.',
      },
      {
        label: 'Save your best material for a bigger occasion',
        effects: { stats: { partyStanding: 1 } },
        outcomeText: 'You deliver competent boilerplate and bank the good lines for later. The hall doesn\'t notice; neither does anyone else. The bigger occasion, as these things go, is slow to arrive.',
      },
    ],
  },
  {
    id: 'x1_membership_revolt',
    title: 'The members\' motion',
    body: 'Your local party membership has passed, overwhelmingly, a motion demanding you vote against the leadership on a totemic issue. They are your selectorate, your activists, the people who knock the doors. The whips expect loyalty. Both can end your career, in different ways.',
    tags: ['party', 'serious'],
    weight: 9, cooldownDays: 560,
    requires: { maxTier: 3 },
    speaker: 'chiefWhip',
    choices: [
      {
        label: 'Vote with your members against the leadership',
        effects: { stats: { integrity: 3, constituencyApproval: 3, partyStanding: -4 }, relationships: [{ kind: 'chiefWhip', delta: -5 }, { kind: 'leader', delta: -3 }] },
        outcomeText: 'You side with the people who selected you and defy the whip. The members are jubilant; the whips\' office is glacial. You\'ve banked deep local loyalty and spent a great deal of the kind that gets you promoted.',
      },
      {
        label: 'Vote with the leadership, face the members',
        effects: { stats: { partyStanding: 3, constituencyApproval: -3 }, relationships: [{ kind: 'chiefWhip', delta: 4 }] },
        outcomeText: 'You hold the line and then drive home to explain yourself to a hall of furious activists. The whips are pleased; the door-knockers are thinner on the ground next campaign. Loyalty up, foot-soldiers down.',
      },
      {
        label: 'Abstain and try to keep everyone',
        effects: { stats: { integrity: -3, partyStanding: -1, constituencyApproval: -1 } },
        outcomeText: 'You find a procedural reason to be elsewhere. Both sides see exactly what you did. The members feel unled, the whips feel unsupported, and you have achieved the rare feat of disappointing everyone at once.',
      },
    ],
  },
];
