import { useMemo, useState } from 'react';
import {
  AvatarConfig, BackgroundId, Era, Gender, PartyId, RegionId,
} from '../types/game';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { PARTIES, playablePartiesForEra, populistPartyForEra } from '../data/parties';
import { PLAYER_REGIONS, REGIONS } from '../data/regions';
import { BACKGROUND_IDS, BACKGROUNDS } from '../data/backgrounds';
import { PARLIAMENTS } from '../data/parliaments';
import { Avatar } from '../avatar/Avatar';
import { SwipeCarousel } from '../components/SwipeCarousel';
import { AVATAR_COUNTS, AvatarLayerKey } from '../avatar/palette';
import { Rng } from '../engine/rng';
import { randomAvatar, generateName } from '../generation/characters';
import './NewCareerScreen.css';

const STEPS = ['Era', 'You', 'Party', 'Background', 'Look'] as const;

const ERA_LABELS: Record<Era, { title: string; blurb: string }> = {
  '2015': {
    title: 'May 2015',
    blurb: "Cameron's surprise majority of 12. Austerity, an EU referendum pledge to keep, UKIP snapping at the right, and the SNP sweeping all but three Scottish seats.",
  },
  '2017': {
    title: 'June 2017',
    blurb: "Theresa May's gamble backfires: a hung parliament, propped up by the DUP. Brexit consumes everything and the majority has vanished.",
  },
  '2019': {
    title: 'December 2019',
    blurb: 'A thumping Conservative majority of 80. Brexit looms, the red wall has crumbled, and you are one of the new intake.',
  },
  '2024': {
    title: 'July 2024',
    blurb: 'A Labour landslide of 411 seats. A weary country wants delivery, and you have just been handed a green bench to sit on.',
  },
};

const LAYER_PILLS: { key: AvatarLayerKey; label: string }[] = [
  { key: 'skin', label: 'Skin' },
  { key: 'hairStyle', label: 'Hair' },
  { key: 'hairColour', label: 'Hair colour' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'brows', label: 'Brows' },
  { key: 'outfit', label: 'Outfit' },
  { key: 'outfitColour', label: 'Outfit colour' },
  { key: 'accessory', label: 'Extras' },
  { key: 'bg', label: 'Backdrop' },
];

export function NewCareerScreen() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const setStarted = useUiStore((s) => s.setStarted);
  const setLanding = useUiStore((s) => s.setLanding);
  const [step, setStep] = useState(0);

  const [era, setEra] = useState<Era>('2024');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('f');
  const [age, setAge] = useState(38);
  const [partyId, setPartyId] = useState<PartyId>('lab');
  const [region, setRegion] = useState<RegionId>('yorkshire');
  const [background, setBackground] = useState<BackgroundId>('teacher');
  const [avatar, setAvatar] = useState<AvatarConfig>(() =>
    randomAvatar(new Rng((Math.random() * 0xffffffff) >>> 0))
  );
  const [activeLayer, setActiveLayer] = useState<AvatarLayerKey>('hairStyle');

  const validRegions = useMemo(
    () => PLAYER_REGIONS.filter((r) => PARTIES[partyId].contestsRegions.includes(r)),
    [partyId]
  );

  const canContinue =
    step !== 1 || name.trim().length >= 2;

  const cycleLayer = (dir: 1 | -1) => {
    const count = AVATAR_COUNTS[activeLayer];
    setAvatar((a) => ({
      ...a,
      [activeLayer]: ((a[activeLayer] + dir) % count + count) % count,
    }));
  };

  const finish = () => {
    startNewGame({
      name: name.trim(), gender, age, region, background, partyId, avatar, era,
    });
    setStarted(true);
  };

  return (
    <div className="screen nc">
      <div className="nc-steps">
        {STEPS.map((s, i) => (
          <span key={s} className={`nc-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="fade-in">
          <h2 className="nc-h">When does your story begin?</h2>
          {(['2015', '2017', '2019', '2024'] as Era[]).map((e) => (
            <button
              key={e}
              className={`card nc-era${era === e ? ' selected' : ''}`}
              onClick={() => {
                setEra(e);
                // keep a populist selection valid: remap to the era's actual party
                if (partyId === 'ukip' || partyId === 'brexit' || partyId === 'reform') {
                  const p = populistPartyForEra(e);
                  setPartyId(p);
                  if (!PARTIES[p].contestsRegions.includes(region)) {
                    setRegion(PARTIES[p].contestsRegions[0] as RegionId);
                  }
                }
              }}
            >
              <strong>{ERA_LABELS[e].title}</strong>
              <span>{ERA_LABELS[e].blurb}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="fade-in">
          <h2 className="nc-h">Who are you?</h2>
          <label className="nc-label">Name</label>
          <div className="nc-name-row">
            <input
              className="nc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Hartley"
              maxLength={30}
            />
            <button
              type="button"
              className="nc-dice"
              title="Randomise name"
              aria-label="Randomise name"
              onClick={() =>
                setName(generateName(new Rng((Math.random() * 0xffffffff) >>> 0), gender, new Set(), region))
              }
            >
              🎲
            </button>
          </div>
          <label className="nc-label">Gender</label>
          <div className="nc-seg">
            {([['f', 'Woman'], ['m', 'Man'], ['nb', 'Non-binary']] as [Gender, string][]).map(([g, label]) => (
              <button
                key={g}
                className={gender === g ? 'active' : ''}
                onClick={() => setGender(g)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="nc-label">Age — {age}</label>
          <input
            type="range" min={25} max={68} value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="nc-range"
          />
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <h2 className="nc-h">Pick your colours</h2>
          <div className="nc-parties">
            {playablePartiesForEra(era).map((p) => (
              <button
                key={p}
                className={`nc-party${partyId === p ? ' selected' : ''}`}
                style={{ ['--pc' as string]: PARTIES[p].colour }}
                onClick={() => {
                  setPartyId(p);
                  if (!PARTIES[p].contestsRegions.includes(region)) {
                    setRegion(PARTIES[p].contestsRegions[0] as RegionId);
                  }
                }}
              >
                <span className="nc-party-dot" />
                {PARTIES[p].name}
              </button>
            ))}
          </div>
          {(partyId !== PARLIAMENTS[era].governingParty && partyId !== PARLIAMENTS[era].oppositionParty) && (
            <p className="nc-hint">
              A smaller party: a harder road to ministerial office, but your voice is your own.
            </p>
          )}
          <label className="nc-label">Where do you stand?</label>
          <select
            className="nc-input"
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionId)}
          >
            {validRegions.map((r) => (
              <option key={r} value={r}>{REGIONS[r].name}</option>
            ))}
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in">
          <h2 className="nc-h">What did you do before?</h2>
          <div className="nc-bgs">
            {BACKGROUND_IDS.map((b) => (
              <button
                key={b}
                className={`card nc-bg${background === b ? ' selected' : ''}`}
                onClick={() => setBackground(b)}
              >
                <strong>{BACKGROUNDS[b].name}</strong>
                <span>{BACKGROUNDS[b].blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="fade-in">
          <h2 className="nc-h">Looking the part</h2>
          <SwipeCarousel
            onPrev={() => cycleLayer(-1)}
            onNext={() => cycleLayer(1)}
            caption={`${LAYER_PILLS.find((l) => l.key === activeLayer)?.label} ${avatar[activeLayer] + 1} / ${AVATAR_COUNTS[activeLayer]}`}
          >
            <Avatar config={avatar} size={170} partyColour={PARTIES[partyId].colour} />
          </SwipeCarousel>
          <div className="nc-pills">
            {LAYER_PILLS.map((l) => (
              <button
                key={l.key}
                className={`nc-pill${activeLayer === l.key ? ' active' : ''}`}
                onClick={() => setActiveLayer(l.key)}
              >
                {l.label}
              </button>
            ))}
            <button
              className="nc-pill nc-dice"
              onClick={() =>
                setAvatar(randomAvatar(new Rng((Math.random() * 0xffffffff) >>> 0)))
              }
            >
              🎲 Surprise me
            </button>
          </div>
          <p className="nc-hint">Swipe the portrait (or use the arrows) to change the selected feature.</p>
        </div>
      )}

      <div className="nc-nav">
        <button
          className="btn"
          onClick={() => (step > 0 ? setStep(step - 1) : setLanding('menu'))}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            className="btn btn-primary"
            disabled={!canContinue}
            style={{ opacity: canContinue ? 1 : 0.5 }}
            onClick={() => canContinue && setStep(step + 1)}
          >
            Next
          </button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>
            Take your seat
          </button>
        )}
      </div>
    </div>
  );
}
