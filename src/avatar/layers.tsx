import { ReactElement } from 'react';

/** Hand-authored flat layers for the 200x200 avatar.
 *  Head centre ≈ (100, 92), radius ≈ 40. Shoulders enter at y ≈ 138. */

// ---------- eyes (4) ----------
export const EYES: ReactElement[] = [
  // 0: friendly dots
  <g key="e0" fill="#26221C">
    <circle cx="85" cy="92" r="4.4" />
    <circle cx="115" cy="92" r="4.4" />
  </g>,
  // 1: wide ovals with shine
  <g key="e1">
    <ellipse cx="85" cy="92" rx="5.5" ry="6.5" fill="#26221C" />
    <ellipse cx="115" cy="92" rx="5.5" ry="6.5" fill="#26221C" />
    <circle cx="87" cy="90" r="1.6" fill="#fff" />
    <circle cx="117" cy="90" r="1.6" fill="#fff" />
  </g>,
  // 2: sleepy lids
  <g key="e2" fill="none" stroke="#26221C" strokeWidth="3.4" strokeLinecap="round">
    <path d="M79 92 q6 5 12 0" />
    <path d="M109 92 q6 5 12 0" />
  </g>,
  // 3: happy arcs
  <g key="e3" fill="none" stroke="#26221C" strokeWidth="3.4" strokeLinecap="round">
    <path d="M79 93 q6 -7 12 0" />
    <path d="M109 93 q6 -7 12 0" />
  </g>,
];

// ---------- brows (3) ----------
export const BROWS: ReactElement[] = [
  <g key="b0" fill="none" stroke="#26221C" strokeWidth="3" strokeLinecap="round" opacity="0.75">
    <path d="M78 79 h14" />
    <path d="M108 79 h14" />
  </g>,
  <g key="b1" fill="none" stroke="#26221C" strokeWidth="3" strokeLinecap="round" opacity="0.75">
    <path d="M78 80 q7 -5 14 -1" />
    <path d="M108 79 q7 -4 14 1" />
  </g>,
  <g key="b2" fill="none" stroke="#26221C" strokeWidth="5" strokeLinecap="round" opacity="0.8">
    <path d="M79 79 h12" />
    <path d="M109 79 h12" />
  </g>,
];

// ---------- outfits (6) ----------
const SHOULDERS = 'M36 200 C36 156 64 138 100 138 C136 138 164 156 164 200 Z';

export const OUTFITS: ((colour: string) => ReactElement)[] = [
  // 0: suit + tie
  (c) => (
    <g key="o0">
      <path d={SHOULDERS} fill={c} />
      <path d="M86 138 L100 160 L114 138 L107 138 L100 147 L93 138 Z" fill="#fff" />
      <path d="M96 142 L104 142 L102 168 L100 174 L98 168 Z" fill="#7A2E2E" />
    </g>
  ),
  // 1: open blazer, shirt
  (c) => (
    <g key="o1">
      <path d={SHOULDERS} fill={c} />
      <path d="M84 138 L100 178 L116 138 L106 138 L100 153 L94 138 Z" fill="#F6F3EC" />
    </g>
  ),
  // 2: crew-neck jumper
  (c) => (
    <g key="o2">
      <path d={SHOULDERS} fill={c} />
      <path d="M84 141 q16 12 32 0 q-4 8 -16 8 q-12 0 -16 -8" fill="#00000022" />
    </g>
  ),
  // 3: blouse with collar
  (c) => (
    <g key="o3">
      <path d={SHOULDERS} fill={c} />
      <path d="M88 138 L100 150 L92 156 Z" fill="#fff" />
      <path d="M112 138 L100 150 L108 156 Z" fill="#fff" />
    </g>
  ),
  // 4: turtleneck
  (c) => (
    <g key="o4">
      <path d={SHOULDERS} fill={c} />
      <rect x="84" y="128" width="32" height="16" rx="8" fill={c} />
      <rect x="84" y="128" width="32" height="6" rx="3" fill="#00000022" />
    </g>
  ),
  // 5: waistcoat over shirt
  (c) => (
    <g key="o5">
      <path d={SHOULDERS} fill="#F6F3EC" />
      <path d="M36 200 C36 156 60 142 78 139 L92 200 Z" fill={c} />
      <path d="M164 200 C164 156 140 142 122 139 L108 200 Z" fill={c} />
      <circle cx="100" cy="168" r="2.4" fill="#5b5147" />
      <circle cx="100" cy="180" r="2.4" fill="#5b5147" />
    </g>
  ),
];

// ---------- hair (8) ----------
export const HAIR: ((colour: string) => ReactElement)[] = [
  // 0: short crop
  (c) => (
    <path key="h0" d="M60 88 C58 56 80 44 100 44 C120 44 142 56 140 88 C138 70 124 62 100 62 C76 62 62 70 60 88 Z" fill={c} />
  ),
  // 1: side part
  (c) => (
    <path key="h1" d="M60 90 C58 54 82 42 104 44 C126 46 142 60 140 92 C140 74 132 66 122 64 C110 62 86 70 74 64 C66 72 62 80 60 90 Z" fill={c} />
  ),
  // 2: curly mop
  (c) => (
    <g key="h2" fill={c}>
      <circle cx="72" cy="66" r="15" />
      <circle cx="92" cy="55" r="16" />
      <circle cx="113" cy="56" r="15" />
      <circle cx="130" cy="68" r="13" />
      <path d="M60 88 C60 64 78 52 100 52 C122 52 140 64 140 88 C130 72 116 66 100 66 C84 66 70 72 60 88 Z" />
    </g>
  ),
  // 3: buzz / balding
  (c) => (
    <path key="h3" d="M64 76 C70 56 86 48 100 48 C114 48 130 56 136 76 C128 64 114 58 100 58 C86 58 72 64 64 76 Z" fill={c} opacity="0.85" />
  ),
  // 4: bob
  (c) => (
    <path key="h4" d="M58 110 C52 62 78 42 100 42 C122 42 148 62 142 110 C140 118 132 120 130 112 C134 86 126 64 100 62 C74 64 66 86 70 112 C68 120 60 118 58 110 Z" fill={c} />
  ),
  // 5: long waves
  (c) => (
    <path key="5" d="M56 132 C48 70 76 40 100 40 C124 40 152 70 144 132 C142 142 132 142 132 132 C136 96 128 78 118 70 C110 84 80 84 76 68 C68 78 64 96 68 132 C68 142 58 142 56 132 Z" fill={c} />
  ),
  // 6: top bun
  (c) => (
    <g key="h6" fill={c}>
      <circle cx="100" cy="40" r="13" />
      <path d="M62 86 C62 58 80 48 100 48 C120 48 138 58 138 86 C130 68 118 62 100 62 C82 62 70 68 62 86 Z" />
    </g>
  ),
  // 7: afro
  (c) => (
    <g key="h7" fill={c}>
      <circle cx="100" cy="58" r="28" />
      <circle cx="74" cy="70" r="18" />
      <circle cx="126" cy="70" r="18" />
      <path d="M60 92 C60 70 78 58 100 58 C122 58 140 70 140 92 C130 76 116 70 100 70 C84 70 70 76 60 92 Z" />
    </g>
  ),
];

// ---------- accessories (6) ----------
export const ACCESSORIES: ((partyColour: string) => ReactElement | null)[] = [
  // 0: none
  () => null,
  // 1: round glasses
  () => (
    <g key="a1" fill="none" stroke="#3a342c" strokeWidth="3">
      <circle cx="85" cy="92" r="11" />
      <circle cx="115" cy="92" r="11" />
      <path d="M96 92 h8" />
    </g>
  ),
  // 2: square glasses
  () => (
    <g key="a2" fill="none" stroke="#3a342c" strokeWidth="3">
      <rect x="73" y="83" width="23" height="18" rx="4" />
      <rect x="104" y="83" width="23" height="18" rx="4" />
      <path d="M96 90 h8" />
    </g>
  ),
  // 3: earrings
  () => (
    <g key="a3" fill="#d9b23c">
      <circle cx="59" cy="103" r="3.4" />
      <circle cx="141" cy="103" r="3.4" />
    </g>
  ),
  // 4: pocket square sparkle (lapel pin)
  () => (
    <circle key="a4" cx="76" cy="158" r="4" fill="#d9b23c" />
  ),
  // 5: party rosette
  (party) => (
    <g key="a5">
      <circle cx="70" cy="158" r="11" fill={party} />
      <circle cx="70" cy="158" r="6.5" fill="#fff" opacity="0.85" />
      <circle cx="70" cy="158" r="3.5" fill={party} />
      <path d="M66 168 l-3 12 M74 168 l3 12" stroke={party} strokeWidth="3.4" strokeLinecap="round" />
    </g>
  ),
];
