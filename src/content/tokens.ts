/** every `{token}` a card may use. The card engine's resolver is typed against
 *  this list, so a token added here must be resolved there, and card validation
 *  rejects a token that is not here. */
export const CARD_TOKEN_KEYS = [
  'leader', 'pm', 'lo', 'whip', 'rival', 'ally', 'mentor', 'journalist', 'constituency', 'department',
  'committee', 'cmtdept', 'party', 'govparty', 'oppparty', 'house', 'housefull', 'hill', 'member', 'members',
  'head', 'headoffice', 'government', 'nation', 'speaker', 'otherleader', 'otherparty', 'othergov',
  'mayoralty', 'city',
] as const;
export type CardToken = typeof CARD_TOKEN_KEYS[number];
