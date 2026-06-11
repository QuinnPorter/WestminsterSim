/** Option counts and colour ramps for the layered avatar.
 *  layers.tsx must provide exactly these many options per layer. */

export const SKIN_TONES = [
  '#F6D7BD', '#EFC3A4', '#D9A57E', '#B97F5B', '#8E5B3F', '#62402C',
];

export const HAIR_COLOURS = [
  '#2A2118', '#4A3320', '#6E4A26', '#9A6A33', '#C89B5C', '#D8D2C8',
  '#A33B2A', '#5B5B66',
];

export const OUTFIT_COLOURS = [
  '#33415C', '#5B3A5E', '#1F5F4E', '#7A2E2E', '#2E5E7A', '#4F4A41',
  '#8A5A2E', '#3B3B3B',
];

export const BG_COLOURS = [
  '#FBE8D8', '#E2EEDF', '#DDE8F5', '#F4E3EC', '#F0EBDB', '#E5E0F0',
];

export const AVATAR_COUNTS = {
  skin: SKIN_TONES.length,        // 6
  hairStyle: 8,
  hairColour: HAIR_COLOURS.length, // 8
  eyes: 4,
  brows: 3,
  outfit: 6,
  outfitColour: OUTFIT_COLOURS.length, // 8
  accessory: 6,                   // 0 = none
  bg: BG_COLOURS.length,          // 6
} as const;

export type AvatarLayerKey = keyof typeof AVATAR_COUNTS;
