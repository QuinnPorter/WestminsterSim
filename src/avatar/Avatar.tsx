import { AvatarConfig } from '../types/game';
import { BG_COLOURS, HAIR_COLOURS, OUTFIT_COLOURS, SKIN_TONES } from './palette';
import { ACCESSORIES, BROWS, EYES, HAIR, OUTFITS } from './layers';

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  /** used by the rosette accessory */
  partyColour?: string;
  className?: string;
}

export function Avatar({ config, size = 64, partyColour = '#888', className }: AvatarProps) {
  const skin = SKIN_TONES[config.skin % SKIN_TONES.length];
  const hairC = HAIR_COLOURS[config.hairColour % HAIR_COLOURS.length];
  const outfitC = OUTFIT_COLOURS[config.outfitColour % OUTFIT_COLOURS.length];
  const bg = BG_COLOURS[config.bg % BG_COLOURS.length];

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="100" fill={bg} />
      {OUTFITS[config.outfit % OUTFITS.length](outfitC)}
      {/* neck */}
      <rect x="88" y="116" width="24" height="26" rx="10" fill={skin} />
      {/* ears */}
      <circle cx="61" cy="94" r="8" fill={skin} />
      <circle cx="139" cy="94" r="8" fill={skin} />
      {/* head */}
      <ellipse cx="100" cy="92" rx="40" ry="44" fill={skin} />
      {EYES[config.eyes % EYES.length]}
      {BROWS[config.brows % BROWS.length]}
      {/* smile */}
      <path
        d="M90 113 q10 8 20 0"
        fill="none"
        stroke="#26221C"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {HAIR[config.hairStyle % HAIR.length](hairC)}
      {ACCESSORIES[config.accessory % ACCESSORIES.length](partyColour)}
    </svg>
  );
}
