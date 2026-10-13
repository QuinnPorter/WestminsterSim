import { DecisionCard } from '../../../types/content';

/** Stormont without an Executive. These fire only while the Executive is
 *  collapsed: the departments run by their permanent secretaries, the Assembly
 *  not sitting, the Secretary of State setting the budget from London, and
 *  every MLA still being paid. Nothing here assumes which party walked out:
 *  the player may belong to the blocker, the other head party, or neither. */
export const NI_COLLAPSE_CARDS: DecisionCard[] = [
  {
    id: 'nic_permanent_secretary_decides',
    title: 'The official decides',
    body: 'With no minister to sign it, a decision on a new school for {constituency} has sat on a permanent secretary’s desk for five months. The courts have now said officials may take “routine” decisions, and the permanent secretary would like to know whether a school is routine. So would the parents, who have started a Facebook group with your name in the title.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 14, cooldownDays: 240,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Tell the official to sign it',
        effects: { stats: { constituencyApproval: 4, competence: 1, integrity: -1 } },
        outcomeText: 'You write a letter that an unelected official can wave if anyone asks why they built a school. They build the school. Somebody, somewhere, is drafting a judicial review, and it is not about your constituency.',
      },
      {
        label: 'Say only a minister can decide, and name who is stopping that',
        effects: { stats: { profile: 3, partyStanding: 2, constituencyApproval: -2 } },
        outcomeText: 'You turn the school into an argument about the stalemate, which it is, and the parents into an audience for it, which they did not ask to be. The clip does well. The school does not get built.',
      },
      {
        label: 'Find the money through the council',
        effects: { stats: { competence: 3, constituencyApproval: 2 } },
        outcomeText: 'There is a route, through a council capital scheme and a charity, that does not need a minister. It takes a year and three meetings nobody will remember. The school is smaller than planned, and open.',
      },
    ],
  },
  {
    id: 'nic_paid_for_nothing',
    title: 'Paid for nothing',
    body: 'A tabloid has worked out what every MLA has been paid since the Assembly last sat, and your number is in a box on the front page. The Secretary of State is “considering” cutting the salary. Your constituents are not considering anything: they are furious, and your surgery is full of people asking what exactly you do.',
    tags: ['media', 'personal', 'funny'],
    weight: 12, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Publish your diary for the year',
        effects: { stats: { integrity: 3, constituencyApproval: 2, profile: 1 } },
        outcomeText: 'Four hundred constituency cases, a hundred and twelve meetings, two funerals a week. It is a real job, and the diary proves it, and the box on the front page does not move.',
      },
      {
        label: 'Give the money to charity, loudly',
        effects: { stats: { profile: 3, constituencyApproval: 3, integrity: -1 } },
        outcomeText: 'A cheque, a photograph, a hospice. It is generous and it is calculated, and the hospice is grateful enough not to mind which. Three colleagues follow you. The rest quietly do not.',
      },
      {
        label: 'Say the pay is not the problem',
        effects: { stats: { partyStanding: 2, constituencyApproval: -3, integrity: 1 } },
        outcomeText: 'You say the problem is that there is no Executive, which is true and which sounds, on the radio, like a person defending their salary. The presenter lets the silence run.',
      },
    ],
  },
  {
    id: 'nic_recall_petition',
    title: 'Thirty signatures to sit',
    body: 'A party wants the Assembly recalled: thirty signatures and the Speaker must summon it, even with no Executive to answer to. The point is to vote on something urgent and to be seen voting on it; the counter-point is that the chamber cannot elect a Speaker, so the sitting will last twenty minutes and end in the same place. Your signature is being asked for.',
    tags: ['westminster', 'party'],
    weight: 11, cooldownDays: 240,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Sign, and speak',
        effects: { stats: { profile: 3, integrity: 1, partyStanding: -1 } },
        outcomeText: 'The chamber fills, fails to elect a Speaker, and adjourns. In the twenty minutes you make a speech about the thing itself, not the stalemate, and it is the first thing said in the room for months that anyone quotes.',
      },
      {
        label: 'Sign, and stay away',
        effects: { stats: { partyStanding: 1, constituencyApproval: -1 } },
        outcomeText: 'Your name is on the petition and not in the room. The sitting is as short as predicted. The local paper notes who turned up.',
      },
      {
        label: 'Refuse to take part in theatre',
        effects: { stats: { integrity: 2, profile: -1, partyStanding: 1 } },
        outcomeText: 'You call it what it is, which wins you a column and loses you the people who wanted to see somebody try. The chamber meets without you and adjourns without anybody.',
      },
    ],
  },
  {
    id: 'nic_budget_from_london',
    title: 'The letter from London',
    body: 'The Secretary of State has set {nation}’s budget by letter, since nobody at Stormont can, and the letter cuts the thing in {constituency} that you have spent three years protecting. There is no minister to lobby. There is a Permanent Secretary who did not want to cut it, a Secretary of State who did not read it, and a Treasury that did both.',
    tags: ['constituency', 'policy', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Go to London and sit in the Northern Ireland Office until someone sees you',
        effects: { stats: { profile: 3, competence: 2, constituencyApproval: 2 } },
        outcomeText: 'A junior minister sees you on the second afternoon, listens, and finds a line that restores half of it. You are photographed on the steps looking like somebody who got half of something, which in this year counts as a result.',
      },
      {
        label: 'Make the cut the stalemate’s fault',
        effects: { stats: { partyStanding: 3, constituencyApproval: -1 } },
        outcomeText: 'You say, correctly, that a minister would never have signed this. The people who lost the thing are not comforted by the organisational chart, and the party that is not nominating is not named in your statement, because it may be yours.',
      },
      {
        label: 'Organise the people who lost it',
        effects: { stats: { constituencyApproval: 4, profile: 2, competence: -1 } },
        outcomeText: 'A march to the gates of Stormont, where nobody is. It is a strange place to protest, a parliament with the lights off, and the photograph of it is the most shared image of the year.',
      },
    ],
  },
  {
    id: 'nic_direct_rule_murmur',
    title: 'The D-word',
    body: 'A Westminster backbencher has used the words “direct rule” on the radio, and the whole of {nation} has heard them. Half your inbox wants it, since somebody would at least be deciding things; the other half regards the idea as the end of the Agreement. A journalist wants your view by six.',
    tags: ['media', 'policy', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Rule it out',
        effects: { stats: { integrity: 2, partyStanding: 1, profile: 1 } },
        outcomeText: 'You say {nation} should be governed from {nation}, and that the way to do that is the one everyone knows. It is the responsible answer and the dull one, and the journalist thanks you for it in the tone of someone who had hoped for better.',
      },
      {
        label: 'Say it may be the least bad option',
        effects: { stats: { profile: 4, constituencyApproval: 2, partyStanding: -4 } },
        outcomeText: 'You say what a surprising number of people are thinking, and the surprising number is delighted, and your party is not. The clip is on every bulletin and your {leader} does not call.',
      },
      {
        label: 'Call for the Irish government to be at the table',
        effects: { stats: { profile: 3, partyStanding: 1, constituencyApproval: -2 } },
        outcomeText: 'The Agreement has two governments in it and you say so. It is a position, it is the position of some of your constituents, and it is the end of the conversation for the others.',
      },
    ],
  },
  {
    id: 'nic_waiting_list_no_minister',
    title: 'Nobody to resign',
    body: 'The waiting-list figures are out, they are the worst ever recorded anywhere in these islands, and the usual thing happens: the opposition calls for the Health Minister to resign. There is no Health Minister. A permanent secretary gives a careful statement about the limits of their authority, and the Assembly that would question them is not sitting. You are asked for a comment on a system with nobody in charge.',
    tags: ['policy', 'serious'],
    weight: 12, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Call for the Executive to be restored, today',
        effects: { stats: { integrity: 2, profile: 2, partyStanding: -2 } },
        outcomeText: 'You say the lists are the price of the stalemate and that every party, including yours, is paying it with other people’s hips. It is true. The party would have preferred a different pronoun.',
      },
      {
        label: 'Propose officials be given the powers',
        effects: { stats: { competence: 3, profile: 1 } },
        outcomeText: 'You draft what a civil servant could lawfully do if the law let them, and send it to London. Six months later a Bill with your paragraph in it passes without your name. The lists move by a fortnight.',
      },
      {
        label: 'Say nothing useful',
        effects: { stats: { partyStanding: 1, constituencyApproval: -2 } },
        outcomeText: 'A statement of concern. It is accurate, concerned, and useless, and the woman with the folder is back on Friday.',
      },
    ],
  },
  {
    id: 'nic_officials_running_dept',
    title: 'Your department, without you',
    body: 'You were the minister. The department you ran is still there, the staff still come in, and the permanent secretary still sends you a courtesy note on Mondays about what they have decided without you. This week it is a decision you would have taken the other way. You have no power, and some influence, and a phone.',
    tags: ['policy', 'personal'],
    weight: 12, cooldownDays: 240,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'], flags: { _peakTier: 4 } },
    choices: [
      {
        label: 'Ring the permanent secretary and say so',
        effects: { stats: { competence: 2, profile: 1, integrity: -1 } },
        outcomeText: 'They listen, as they listened when you had the power to make them, and they do it your way, because it is easier and because you might be back. Nobody writes any of this down.',
      },
      {
        label: 'Say nothing: you are not the minister',
        effects: { stats: { integrity: 3, partyStanding: -1 } },
        outcomeText: 'You let an unelected official take a decision you disagree with, because that is what the law now says, and you write down the date for the inquiry that will one day ask why nobody stopped them.',
      },
      {
        label: 'Criticise the decision in public',
        effects: { stats: { profile: 3, competence: -2 } },
        outcomeText: 'A former minister attacking the officials who used to work for them, for doing the job the former minister cannot. It is a strange sight and the papers enjoy it, and the department stops sending the Monday note.',
      },
    ],
  },
  {
    id: 'nic_talks_leak',
    title: 'The leaked paper',
    body: 'A draft of the deal that might restore the Executive has leaked, and your party is in it, and what your party is said to have conceded is on the front of two newspapers. The leadership says the paper is “one of many”. Your constituency association says it is a betrayal. The leadership would like you to say the first thing; the association, the second.',
    tags: ['party', 'media', 'serious'],
    weight: 11, cooldownDays: 300,
    requires: { arena: ['ni'], minTier: 0, maxTier: 4, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Back the leadership',
        effects: { stats: { partyStanding: 4, constituencyApproval: -3 } },
        outcomeText: 'You say a deal that restores government is worth a paragraph most people will never read. The association does not forgive it; the {leader} remembers it.',
      },
      {
        label: 'Back the association',
        effects: { stats: { constituencyApproval: 4, partyStanding: -5, profile: 2 } },
        outcomeText: 'You say your members did not walk out to walk back in for this. The leadership’s negotiators spend a week repairing the damage, some of which is you.',
      },
      {
        label: 'Ask who leaked it',
        effects: { stats: { integrity: 1, profile: 1 } },
        outcomeText: 'A sensible question with an answer nobody will give you. The row moves on to the leak, which suits everybody who was in the paper.',
      },
    ],
  },
  {
    id: 'nic_dublin_london_summit',
    title: 'Two governments and an empty chair',
    body: 'The Prime Minister and the Taoiseach are meeting about {nation} without anyone from {nation} in the room, since there is nobody with a mandate to send. A statement is coming that will set the terms of whatever deal there is. Your party has been asked, informally, what it could live with, and you have been asked, informally, what to say.',
    tags: ['policy', 'party'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 2, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Send a realistic list',
        effects: { stats: { competence: 3, integrity: 1, partyStanding: -1 } },
        outcomeText: 'Three things, two of which can be done. The statement, when it comes, has one of them in it, which is how these things work and more than most people get.',
      },
      {
        label: 'Send the maximal list',
        effects: { stats: { partyStanding: 3, competence: -2 } },
        outcomeText: 'Everything the party has ever asked for, on one page. It is received politely and placed where such pages are placed. The statement has none of it, and your party calls the statement a betrayal with a clear conscience.',
      },
      {
        label: 'Refuse to engage with a process you are not in',
        effects: { stats: { integrity: 2, profile: 1, competence: -1 } },
        outcomeText: 'You say {nation} should not be discussed over its head, which is a principle, and which leaves the room with one fewer voice in it.',
      },
    ],
  },
  {
    id: 'nic_strike_no_minister',
    title: 'The biggest strike in a generation',
    body: 'Nurses, teachers, bus drivers and civil servants are out together, over pay that has fallen years behind England’s, and the money to settle it is sitting in a letter from the Treasury that says it will be released when there is an Executive to release it to. The picket is at Stormont, where there is nobody. They have asked every MLA to come down and explain.',
    tags: ['crisis', 'policy', 'serious'],
    weight: 10, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Go down and stand with them',
        effects: { stats: { constituencyApproval: 3, integrity: 2, profile: 2 } },
        outcomeText: 'You stand in the cold with a hundred thousand people and are asked, repeatedly, why you cannot simply form a government. You do not have a good answer. Nobody does. You stay until the end.',
      },
      {
        label: 'Say London is holding the money hostage',
        effects: { stats: { partyStanding: 3, integrity: -1 } },
        outcomeText: 'It is a true sentence and a convenient one. The Treasury says the money is there for an Executive, which is also true, and the strikers go home no better off than before either sentence.',
      },
      {
        label: 'Call for the money to be released anyway',
        effects: { stats: { competence: 2, profile: 2, partyStanding: -2 } },
        outcomeText: 'You say a pay award is not a bargaining chip and the Secretary of State can sign it today. Some of your party agree, loudly. The Secretary of State, eventually, does.',
      },
    ],
  },
  {
    id: 'nic_pay_cut_lands',
    title: 'Twenty-seven per cent',
    body: 'The Secretary of State has done what was threatened and cut MLA pay by more than a quarter, by letter, from the first of the month. The letter also says the office-cost allowance, which pays the constituency staff who are doing the only governing anyone in {nation} is getting, will be reviewed next. A colleague is organising a legal challenge; the party would like a line; your staff would like to know whether they are in the review. The front pages are happy for the first time in months.',
    tags: ['personal', 'party', 'media'],
    weight: 12, cooldownDays: 400,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Take the cut, say so, and fight for the staff',
        effects: { stats: { integrity: 3, constituencyApproval: 2, partyStanding: -1 } },
        outcomeText: 'You say the cut is fair and the staff are not the problem, and write to Hillsborough to say so in detail. The allowance is spared. Your salary is not. Colleagues who wanted the challenge note that you have made it harder for them, and that you did not need to.',
      },
      {
        label: 'Back the legal challenge',
        effects: { stats: { partyStanding: 2, constituencyApproval: -4, integrity: -1 } },
        outcomeText: 'The challenge is lodged in the name of a group of MLAs that includes you. It is a reasonable argument about the law and an impossible one about everything else, and your surgery that Friday is a long one. The case is lost in the spring.',
      },
      {
        label: 'Call for pay to stop altogether until the Assembly sits',
        effects: { stats: { profile: 4, constituencyApproval: 3, partyStanding: -3 } },
        outcomeText: 'You say that if there is no Assembly there should be no Assembly salary. Your colleagues, who have mortgages, assume you have a private income. You do not. The clip runs on every bulletin, and the Secretary of State thanks you for it, which does not help.',
      },
    ],
  },
  {
    id: 'nic_armagh_without_ministers',
    title: 'Armagh, informally',
    body: 'The North-South Ministerial Council cannot meet, since one side of it has no ministers, and the Irish minister whose sector matches your committee has written to the committee’s members, as individuals, suggesting lunch in Armagh to “keep the channels open”. There will be a photograph and a jointly funded programme with a deadline in it. For some of your constituents the lunch is common sense; for others it is a minister from another state dealing with {nation} over its head. Your party has not said. You have been asked.',
    tags: ['policy', 'party'],
    weight: 11, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0, maxTier: 4, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Go',
        effects: { stats: { competence: 3, profile: 1, partyStanding: -2, constituencyApproval: -1 } },
        outcomeText: 'Lunch, a photograph, and a sentence in a press release that keeps the programme alive until a minister exists to sign it. The photograph is used, in the half of {constituency} that uses such things, with a caption about who you were sitting beside.',
      },
      {
        label: 'Go, as a committee visit, with no photograph',
        effects: { stats: { competence: 2, integrity: 2 } },
        outcomeText: 'You go with the committee and without the cameras. The programme survives. The minister is faintly puzzled by a visitor who refuses to be seen, and the party is content, because there is nothing to be seen.',
      },
      {
        label: 'Decline, and say why',
        effects: { stats: { partyStanding: 2, integrity: 1, competence: -2 } },
        outcomeText: 'You write that the Council has two sides and that one of them is not in a position to attend, and that this is the point. The programme’s deadline passes. The minister understands the position, and a scheme in {constituency} does not get its money.',
      },
    ],
  },
  {
    id: 'nic_ed_temporary_closure',
    title: 'Temporarily, from Monday',
    body: 'The health trust is closing the emergency department nearest {constituency} to overnight admissions from Monday, “temporarily and on safety grounds”, because it cannot staff it. In a normal year a minister would have been asked to stop it, or to own it. There is no minister; the permanent secretary says the decision is clinical; the clinicians say they have been asking for a plan for eight years and there is nobody to give them one. There is a public meeting tonight and the hall is already full.',
    tags: ['constituency', 'crisis', 'policy'],
    weight: 13, cooldownDays: 365,
    requires: { arena: ['ni'], minTier: 0, executiveStatus: ['collapsed'] },
    choices: [
      {
        label: 'Back the clinicians, in front of the hall',
        effects: { stats: { integrity: 3, competence: 2, constituencyApproval: -4 } },
        outcomeText: 'You tell four hundred people that the doctors are right and the department is not safe as it stands, and that the people who could have fixed it are the ones not forming a government. You are booed for the first sentence and listened to for the second. “Temporary” lasts three years.',
      },
      {
        label: 'Lead the campaign to keep it open',
        effects: { stats: { constituencyApproval: 5, profile: 2, competence: -2 } },
        outcomeText: 'Marches, a petition, a vigil at the gates of Stormont. The trust delays the closure by a month, loses two more consultants in the uncertainty, and closes it anyway. You are the face of the campaign, which in {constituency} is a good thing to be and in the trust’s boardroom is not.',
      },
      {
        label: 'Use it to demand the Executive be restored',
        effects: { stats: { partyStanding: 2, profile: 2, constituencyApproval: -1 } },
        outcomeText: 'You turn the hall into an argument about the stalemate, which it is. The hall did not come for that and says so. The clip runs under the word “blame”, and whichever party is not nominating is not named, since you cannot be sure it is not yours.',
      },
    ],
  },
];
